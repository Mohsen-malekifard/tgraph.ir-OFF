"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getAccessToken,
  apiFetch,
} from "@/lib/api";

import {
  getCachedMedia,
  putCachedMedia,
  optimizeImageForCache,
} from "@/lib/mediaCache";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.joined.ir"
).replace(/\/+$/, "");

/*
|--------------------------------------------------------------------------
| Signed Media URL Cache
|--------------------------------------------------------------------------
*/

const urlCache = new Map();
const urlInflightRequests = new Map();
const blobInflightRequests = new Map();

const EXPIRY_SAFETY_SECONDS = 45;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value);
}

function getAttachmentUrl(attachment) {
  if (typeof attachment === "string") {
    return attachment;
  }

  return attachment?.url || "";
}

export function getMediaFileId(attachment) {
  if (attachment?.fileId) {
    return String(attachment.fileId);
  }

  const attachmentUrl = getAttachmentUrl(
    attachment
  );

  const cleanUrl = String(
    attachmentUrl
  ).split(/[?#]/)[0];

  const match = cleanUrl.match(
    /\/api\/media\/files\/([^/]+)\/?$/
  );

  if (!match?.[1]) {
    return "";
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function getAbsoluteMediaUrl(attachmentUrl) {
  if (/^https?:\/\//i.test(attachmentUrl)) {
    return attachmentUrl;
  }

  return `${API_URL}${
    attachmentUrl.startsWith("/")
      ? ""
      : "/"
  }${attachmentUrl}`;
}

/*
|--------------------------------------------------------------------------
| Legacy Media Request
|--------------------------------------------------------------------------
|
| Used for media stored before the current signed URL system.
|
*/

async function fetchLegacyMediaBlob(attachmentUrl) {
  const token = getAccessToken();

  const headers = new Headers();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  let response;

  try {
    response = await fetch(
      getAbsoluteMediaUrl(attachmentUrl),
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers,
      }
    );
  } catch {
    throw new Error(
      "ارتباط با سرور برای دریافت رسانه برقرار نشد."
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 401 ||
        response.status === 403
        ? "نشست شما منقضی شده یا دسترسی به این رسانه وجود ندارد."
        : "دریافت رسانه ناموفق بود."
    );
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error("MEDIA_BLOB_EMPTY");
  }

  return blob;
}

/*
|--------------------------------------------------------------------------
| Signed URL
|--------------------------------------------------------------------------
*/

function peekCachedUrl(key) {
  const cached = key
    ? urlCache.get(key)
    : null;

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    return cached.url;
  }

  if (cached) {
    urlCache.delete(key);
  }

  return "";
}

export async function fetchMediaUrl(
  attachmentUrl,
  {
    force = false,
    download = false,
  } = {}
) {
  if (
    typeof attachmentUrl !== "string" ||
    !attachmentUrl
  ) {
    throw new Error("MEDIA_URL_MISSING");
  }

  const key = download
    ? `${attachmentUrl}?download=1`
    : attachmentUrl;

  if (!force) {
    const cached = peekCachedUrl(key);

    if (cached) {
      return cached;
    }
  }

  if (urlInflightRequests.has(key)) {
    return urlInflightRequests.get(key);
  }

  const request = (async () => {
    try {
      const response = await apiFetch(
        `${attachmentUrl}/url${
          download ? "?download=1" : ""
        }`
      );

      /*
       * Legacy media does not have a signed URL.
       * It must be fetched through the authenticated API.
       */

      if (response?.legacy === true) {
        throw new Error(
          "LEGACY_MEDIA_REQUIRES_BLOB"
        );
      }

      if (
        !response?.url ||
        typeof response.url !== "string"
      ) {
        throw new Error(
          "MEDIA_URL_UNAVAILABLE"
        );
      }

      const lifetime = Math.max(
        60,
        Number(response.expiresIn) || 900
      ) - EXPIRY_SAFETY_SECONDS;

      urlCache.set(key, {
        url: response.url,
        expiresAt:
          Date.now() + lifetime * 1000,
      });

      return response.url;
    } finally {
      urlInflightRequests.delete(key);
    }
  })();

  urlInflightRequests.set(key, request);

  return request;
}

/*
|--------------------------------------------------------------------------
| Download Original Media Blob
|--------------------------------------------------------------------------
*/

async function fetchRemoteMediaBlob(
  attachmentUrl,
  {
    download = false,
  } = {}
) {
  const response = await apiFetch(
    `${attachmentUrl}/url${
      download ? "?download=1" : ""
    }`
  );

  if (response?.legacy === true) {
    return fetchLegacyMediaBlob(
      attachmentUrl
    );
  }

  if (
    typeof response?.url !== "string" ||
    !response.url
  ) {
    throw new Error(
      "MEDIA_URL_UNAVAILABLE"
    );
  }

  let remoteResponse;

  try {
    remoteResponse = await fetch(
      response.url,
      {
        method: "GET",
        credentials: "omit",
        cache: "no-store",
      }
    );
  } catch {
    /*
     * The API media endpoint is also tried as a fallback.
     * This helps with older media and storage CORS differences.
     */

    return fetchLegacyMediaBlob(
      attachmentUrl
    );
  }

  if (!remoteResponse.ok) {
    if (
      remoteResponse.status === 403 ||
      remoteResponse.status === 404
    ) {
      throw new Error(
        "دسترسی به رسانه وجود ندارد یا لینک آن منقضی شده است."
      );
    }

    throw new Error(
      "دریافت محتوای رسانه ناموفق بود."
    );
  }

  const blob = await remoteResponse.blob();

  if (!blob.size) {
    throw new Error("MEDIA_BLOB_EMPTY");
  }

  return blob;
}

/*
|--------------------------------------------------------------------------
| Persistent Media Blob
|--------------------------------------------------------------------------
|
| Returns the actual media Blob.
|
| The Blob is stored in IndexedDB after the first successful download.
| Images are optimized before storage.
|
*/

export async function fetchMediaBlob(
  attachment,
  {
    userId = "",
    force = false,
    download = false,
    cache = true,
    compressImage = true,
  } = {}
) {
  const attachmentUrl = getAttachmentUrl(
    attachment
  );

  const fileId = getMediaFileId(
    attachment
  );

  const normalizedUserId = normalizeId(
    userId
  );

  if (!attachmentUrl || !fileId) {
    throw new Error("MEDIA_URL_MISSING");
  }

  /*
   * Downloads of actual images must use the original file,
   * not the optimized display version.
   */

  const canUseCache = Boolean(
    normalizedUserId &&
      cache &&
      !download
  );

  if (
    canUseCache &&
    !force
  ) {
    const cachedBlob = await getCachedMedia(
      normalizedUserId,
      fileId
    );

    if (cachedBlob) {
      return cachedBlob;
    }
  }

  const attachmentType = String(
    attachment?.type ||
      attachment?.kind ||
      ""
  ).toLowerCase();

  const shouldCompressImage =
    compressImage &&
    !download &&
    attachmentType === "image";

  const requestKey = [
    normalizedUserId || "anonymous",
    fileId,
    download ? "download" : "media",
    shouldCompressImage ? "optimized" : "original",
  ].join(":");

  if (
    blobInflightRequests.has(requestKey)
  ) {
    return blobInflightRequests.get(
      requestKey
    );
  }

  const request = (async () => {
    let blob = await fetchRemoteMediaBlob(
      attachmentUrl,
      {
        download,
      }
    );

    let optimized = false;
    const originalSize = blob.size;

    if (shouldCompressImage) {
      const result = await optimizeImageForCache(
        blob
      );

      blob = result.blob;
      optimized = result.optimized;
    }

    if (canUseCache) {
      try {
        await putCachedMedia(
          normalizedUserId,
          fileId,
          blob,
          {
            originalSize,
            optimized,
            mimeType: blob.type,
          }
        );
      } catch {
        // Cache errors must not prevent displaying media.
      }
    }

    return blob;
  })();

  blobInflightRequests.set(
    requestKey,
    request
  );

  try {
    return await request;
  } finally {
    blobInflightRequests.delete(requestKey);
  }
}

/*
|--------------------------------------------------------------------------
| Media URL Hook
|--------------------------------------------------------------------------
|
| persistent=true:
|   Load Blob from IndexedDB or server and create a local Blob URL.
|
| persistent=false:
|   Use the temporary signed URL. Useful for lightweight video previews.
|
*/

export function useMediaUrl(
  attachment,
  {
    enabled = true,
    userId = "",
    persistent = true,
  } = {}
) {
  const key = getAttachmentUrl(attachment);

  const attachmentRef = useRef(attachment);
  const objectUrlRef = useRef("");

  const requestSequenceRef = useRef(0);

  attachmentRef.current = attachment;

  const [state, setState] = useState({
    url: "",
    loading: Boolean(key),
    error: false,
  });

  const load = useCallback(
    async (force = false) => {
      if (!key) {
        return "";
      }

      const requestId =
        ++requestSequenceRef.current;

      setState((previous) => ({
        ...previous,
        loading: true,
        error: false,
      }));

      let createdObjectUrl = "";

      try {
        let nextUrl = "";

        if (persistent) {
          const blob = await fetchMediaBlob(
            attachmentRef.current,
            {
              userId,
              force,
              cache: true,
              compressImage: true,
            }
          );

          createdObjectUrl =
            URL.createObjectURL(blob);

          nextUrl = createdObjectUrl;
        } else {
          try {
            nextUrl = await fetchMediaUrl(
              key,
              {
                force,
              }
            );
          } catch (error) {
            /*
             * Old media may not have a signed URL.
             * Use a Blob URL for legacy media instead.
             */

            if (
              error?.message !==
              "LEGACY_MEDIA_REQUIRES_BLOB"
            ) {
              throw error;
            }

            const blob = await fetchMediaBlob(
              attachmentRef.current,
              {
                userId,
                force,
                cache: false,
                compressImage: false,
              }
            );

            createdObjectUrl =
              URL.createObjectURL(blob);

            nextUrl = createdObjectUrl;
          }
        }

        if (
          requestId !==
          requestSequenceRef.current
        ) {
          if (createdObjectUrl) {
            URL.revokeObjectURL(
              createdObjectUrl
            );
          }

          return "";
        }

        /*
         * Release the previous local URL.
         */

        if (
          objectUrlRef.current &&
          objectUrlRef.current !== nextUrl
        ) {
          URL.revokeObjectURL(
            objectUrlRef.current
          );
        }

        objectUrlRef.current =
          createdObjectUrl;

        setState({
          url: nextUrl,
          loading: false,
          error: false,
        });

        return nextUrl;
      } catch {
        if (
          createdObjectUrl
        ) {
          URL.revokeObjectURL(
            createdObjectUrl
          );
        }

        if (
          requestId ===
          requestSequenceRef.current
        ) {
          setState({
            url: "",
            loading: false,
            error: true,
          });
        }

        return "";
      }
    },
    [
      key,
      userId,
      persistent,
    ]
  );

  useEffect(() => {
    if (!enabled || !key) {
      setState({
        url: "",
        loading: false,
        error: false,
      });

      return undefined;
    }

    setState({
      url: "",
      loading: true,
      error: false,
    });

    void load(false);

    return () => {
      requestSequenceRef.current += 1;

      if (objectUrlRef.current) {
        URL.revokeObjectURL(
          objectUrlRef.current
        );

        objectUrlRef.current = "";
      }
    };
  }, [
    enabled,
    key,
    userId,
    persistent,
    load,
  ]);

  return {
    ...state,
    refresh: load,
  };
}

/*
|--------------------------------------------------------------------------
| Lazy Loading
|--------------------------------------------------------------------------
*/

export function useInView(
  ref,
  {
    rootMargin = "400px 0px",
  } = {}
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return undefined;
    }

    if (
      typeof IntersectionObserver === "undefined"
    ) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some(
            (entry) => entry.isIntersecting
          )
        ) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [
    ref,
    rootMargin,
  ]);

  return inView;
}

/*
|--------------------------------------------------------------------------
| Download Attachment
|--------------------------------------------------------------------------
|
| Images:
|   Download the original file, not the compressed display copy.
|
| Other files:
|   Reuse the persistent cached Blob whenever available.
|
*/

export async function downloadAttachment(
  attachment,
  {
    newTab = false,
    userId = "",
  } = {}
) {
  if (!attachment?.url) {
    throw new Error("MEDIA_URL_MISSING");
  }

  const attachmentType = String(
    attachment.type ||
      attachment.kind ||
      ""
  ).toLowerCase();

  const isImage = attachmentType === "image";

  const blob = await fetchMediaBlob(
    attachment,
    {
      userId,

      force: isImage,

      /*
       * The original image must be downloaded.
       * Other media can be downloaded from the cache.
       */

      download: isImage,

      cache: !isImage,

      compressImage: false,
    }
  );

  const objectUrl = URL.createObjectURL(
    blob
  );

  const fileName =
    attachment.fileName ||
    "telegraph-media";

  if (newTab) {
    const opened = window.open(
      objectUrl,
      "_blank",
      "noopener,noreferrer"
    );

    if (!opened) {
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  } else {
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = fileName;
    link.rel = "noopener noreferrer";

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /*
   * Keep the URL alive briefly so the browser can
   * finish starting the download.
   */

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000);
}
