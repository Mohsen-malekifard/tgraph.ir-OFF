"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { apiFetch } from "@/lib/api";

/*
|--------------------------------------------------------------------------
| Signed media URLs
|--------------------------------------------------------------------------
|
| Media objects are private. The server hands out short-lived signed URLs
| (GET /api/media/files/:id/url) after checking conversation membership.
| URLs are cached until shortly before they expire.
|
*/

const urlCache = new Map();
const inflightRequests = new Map();
const EXPIRY_SAFETY_SECONDS = 45;

function peekCachedUrl(key) {
  const cached = key ? urlCache.get(key) : null;

  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  return "";
}

export async function fetchMediaUrl(
  attachmentUrl,
  { force = false, download = false } = {}
) {
  if (typeof attachmentUrl !== "string" || !attachmentUrl) {
    throw new Error("MEDIA_URL_MISSING");
  }

  const key = download
    ? `${attachmentUrl}?download=1`
    : attachmentUrl;

  if (!force) {
    const cached = peekCachedUrl(key);
    if (cached) return cached;
  }

  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const request = (async () => {
    try {
      const response = await apiFetch(
        `${attachmentUrl}/url${download ? "?download=1" : ""}`
      );

      if (!response?.url) {
        throw new Error("MEDIA_URL_UNAVAILABLE");
      }

      const lifetime = Math.max(
        60,
        Number(response.expiresIn) || 900
      ) - EXPIRY_SAFETY_SECONDS;

      urlCache.set(key, {
        url: response.url,
        expiresAt: Date.now() + lifetime * 1000,
      });

      return response.url;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, request);

  return request;
}

export function useMediaUrl(attachment, { enabled = true } = {}) {
  const key = attachment?.url || "";
  const keyRef = useRef(key);

  keyRef.current = key;

  const [state, setState] = useState(() => {
    const cached = peekCachedUrl(key);

    return {
      url: cached,
      loading: !cached && Boolean(key),
      error: false,
    };
  });

  const load = useCallback(
    async (force = false) => {
      if (!key) return "";

      setState((previous) => ({
        ...previous,
        loading: true,
        error: false,
      }));

      try {
        const url = await fetchMediaUrl(key, { force });

        if (keyRef.current === key) {
          setState({ url, loading: false, error: false });
        }

        return url;
      } catch {
        if (keyRef.current === key) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error: true,
          }));
        }

        return "";
      }
    },
    [key]
  );

  useEffect(() => {
    if (!enabled || !key) return;

    const cached = peekCachedUrl(key);

    if (cached) {
      setState({ url: cached, loading: false, error: false });
      return;
    }

    load(false);
  }, [enabled, key, load]);

  return { ...state, refresh: load };
}

/*
|--------------------------------------------------------------------------
| Lazy loading
|--------------------------------------------------------------------------
|
| Becomes true (and stays true) once the element gets close to the viewport,
| so a long chat does not request every signed URL at once.
|
*/

export function useInView(ref, { rootMargin = "400px 0px" } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}

/*
|--------------------------------------------------------------------------
| Download
|--------------------------------------------------------------------------
*/

export async function downloadAttachment(
  attachment,
  { newTab = false } = {}
) {
  if (!attachment?.url) {
    throw new Error("MEDIA_URL_MISSING");
  }

  const url = await fetchMediaUrl(attachment.url, {
    force: true,
    download: true,
  });

  const link = document.createElement("a");

  link.href = url;
  link.download = attachment.fileName || "";
  link.rel = "noopener noreferrer";

  if (newTab) {
    link.target = "_blank";
  }

  document.body.appendChild(link);
  link.click();
  link.remove();
}
