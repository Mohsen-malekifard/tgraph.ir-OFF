"use client";

import { useSyncExternalStore } from "react";

import { apiUpload } from "@/lib/api";
import {
  MAX_UPLOAD_BYTES,
  rememberLocalPreview,
  revokePreviewUrl,
} from "@/lib/mediaUtils";

/*
|--------------------------------------------------------------------------
| Upload queue
|--------------------------------------------------------------------------
|
| The queue lives outside React, so an upload continues while the user moves
| between conversations. Files are uploaded sequentially to preserve the
| selection order. A pending message is added synchronously by enqueueUploads
| before the first file is prepared or sent over the network.
|
| status: queued | uploading | sent | failed
|
| prepareFile is used by the native gallery: the full-resolution File is
| resolved only after its pending bubble has appeared in the chat.
|--------------------------------------------------------------------------
*/

const EMPTY = [];
const SENT_WITHOUT_ID_LIFETIME_MS = 60_000;

let uploads = EMPTY;
let queue = Promise.resolve();
let counter = 0;

const listeners = new Set();
const controllers = new Map();
const removalTimers = new Map();

function emit(next) {
  uploads = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return uploads;
}

function getServerSnapshot() {
  return EMPTY;
}

export function useUploads() {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
}

function findUpload(id) {
  return uploads.find((upload) => upload.id === id) || null;
}

function patchUpload(id, changes) {
  let found = false;

  const next = uploads.map((upload) => {
    if (upload.id !== id) return upload;

    found = true;

    return {
      ...upload,
      ...changes,
    };
  });

  if (found) emit(next);
}

function clearRemovalTimer(id) {
  const timer = removalTimers.get(id);

  if (timer) {
    window.clearTimeout(timer);
    removalTimers.delete(id);
  }
}

function removeUpload(id) {
  if (!findUpload(id)) return;

  clearRemovalTimer(id);

  emit(
    uploads.filter((upload) => upload.id !== id)
  );
}

function classifyError(error) {
  if (
    error?.name === "NetworkError" ||
    error?.isNetworkError
  ) {
    return "network";
  }

  switch (error?.status) {
    case 401:
      return "auth";

    case 403:
      return "forbidden";

    case 413:
      return "too_large";

    case 415:
      return "unsupported";

    default:
      return "unknown";
  }
}

function createUploadError(code, status) {
  const error = new Error(code);

  if (status) {
    error.status = status;
  }

  return error;
}

/*
|--------------------------------------------------------------------------
| FormData
|--------------------------------------------------------------------------
*/

function buildFormData(upload) {
  if (
    !upload.file ||
    typeof upload.file.size !== "number"
  ) {
    throw createUploadError("UPLOAD_FILE_NOT_READY");
  }

  if (!upload.file.size) {
    throw createUploadError("UPLOAD_FILE_EMPTY");
  }

  if (upload.file.size > MAX_UPLOAD_BYTES) {
    throw createUploadError("FILE_TOO_LARGE", 413);
  }

  const form = new FormData();

  form.append(
    "conversationId",
    upload.conversationId
  );

  form.append(
    "type",
    upload.kind
  );

  form.append(
    "fileName",
    upload.fileName || upload.file.name || "attachment"
  );

  if (upload.caption) {
    form.append("text", upload.caption);
  }

  if (upload.replyTo) {
    form.append("replyTo", upload.replyTo);
  }

  if (
    (upload.kind === "audio" || upload.kind === "video") &&
    Number.isFinite(upload.duration) &&
    upload.duration > 0
  ) {
    form.append(
      "duration",
      String(Math.round(upload.duration))
    );
  }

  if (
    (upload.kind === "image" || upload.kind === "video") &&
    upload.width > 0 &&
    upload.height > 0
  ) {
    form.append(
      "width",
      String(Math.round(upload.width))
    );

    form.append(
      "height",
      String(Math.round(upload.height))
    );
  }

  // Keep the file part last, matching the voice-message upload request.
  form.append(
    "file",
    upload.file,
    upload.fileName || upload.file.name || "attachment"
  );

  return form;
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

/*
|--------------------------------------------------------------------------
| Upload execution
|--------------------------------------------------------------------------
*/

async function runUpload(id) {
  const initialUpload = findUpload(id);

  if (
    !initialUpload ||
    (
      initialUpload.status !== "queued" &&
      initialUpload.status !== "uploading"
    )
  ) {
    return;
  }

  const controller = new AbortController();

  controllers.set(id, controller);

  patchUpload(id, {
    status: "uploading",
    progress: 0,
    errorKind: "",
    preparingFile: Boolean(initialUpload.prepareFile),
  });

  let lastEmit = 0;

  try {
    let upload = findUpload(id);

    if (!upload) return;

    /*
     * Native gallery originals are resolved after the pending bubble
     * has already appeared in the chat.
     */

    if (typeof upload.prepareFile === "function") {
      const preparedFile = await upload.prepareFile(
        controller.signal
      );

      if (
        controller.signal.aborted ||
        !findUpload(id)
      ) {
        return;
      }

      if (
        !preparedFile ||
        typeof preparedFile.size !== "number" ||
        typeof preparedFile.name !== "string"
      ) {
        throw createUploadError("UPLOAD_FILE_NOT_READY");
      }

      if (preparedFile.size <= 0) {
        throw createUploadError("UPLOAD_FILE_EMPTY");
      }

      if (preparedFile.size > MAX_UPLOAD_BYTES) {
        throw createUploadError("FILE_TOO_LARGE", 413);
      }

      upload = {
        ...upload,
        file: preparedFile,
        fileName: preparedFile.name || upload.fileName,
        mimeType: preparedFile.type || upload.mimeType,
        size: preparedFile.size,
        prepareFile: null,
      };

      patchUpload(id, {
        file: upload.file,
        fileName: upload.fileName,
        mimeType: upload.mimeType,
        size: upload.size,
        prepareFile: null,
        preparingFile: false,
      });
    }

    if (
      controller.signal.aborted ||
      !findUpload(id)
    ) {
      return;
    }

    /*
     * Upload to the server with real progress reporting.
     */

    const data = await apiUpload(
      "/api/media/upload",
      buildFormData(upload),
      {
        signal: controller.signal,

        onProgress: (fraction) => {
          const now = Date.now();

          // Limit React updates while retaining responsive progress feedback.
          if (
            fraction >= 1 ||
            now - lastEmit >= 90
          ) {
            lastEmit = now;

            patchUpload(id, {
              progress: Math.min(
                1,
                Math.max(0, Number(fraction) || 0)
              ),
            });
          }
        },
      }
    );

    if (
      controller.signal.aborted ||
      !findUpload(id)
    ) {
      return;
    }

    if (
      data?.success !== true ||
      !data?.message
    ) {
      throw createUploadError("UPLOAD_FAILED");
    }

    const message = data.message;

    const attachment =
      data.attachment ||
      message.attachments?.[0] ||
      null;

    const attachmentUrl = attachment?.url || "";

    const serverMessageId = String(
      message._id ?? message.id ?? ""
    );

    /*
     * Preserve the local thumbnail while the permanent message
     * obtains its signed media URL.
     */

    if (
      attachmentUrl &&
      upload.previewUrl
    ) {
      rememberLocalPreview(
        attachmentUrl,
        upload.previewUrl
      );
    }

    /*
     * Mark the pending message as successfully sent.
     */

    patchUpload(id, {
      status: "sent",
      progress: 1,
      preparingFile: false,
      attachment,
      serverMessageId,
    });

    /*
     * Normally PendingUploads acknowledges this row as soon as the
     * server message appears in MessageList.
     *
     * This timer is only a safety net for an unexpected response
     * without a usable server message ID.
     */

    if (!serverMessageId) {
      const timer = window.setTimeout(() => {
        removalTimers.delete(id);
        removeUpload(id);
      }, SENT_WITHOUT_ID_LIFETIME_MS);

      removalTimers.set(id, timer);
    }
  } catch (error) {
    // cancelUpload removes the row before the aborted operation settles.
    if (
      isAbortError(error) ||
      !findUpload(id)
    ) {
      return;
    }

    patchUpload(id, {
      status: "failed",
      preparingFile: false,
      errorKind: classifyError(error),
    });
  } finally {
    if (controllers.get(id) === controller) {
      controllers.delete(id);
    }
  }
}

/*
|--------------------------------------------------------------------------
| Sequential queue
|--------------------------------------------------------------------------
*/

function schedule(id) {
  queue = queue
    .then(() => runUpload(id))
    .catch(() => {});
}

/*
|--------------------------------------------------------------------------
| Enqueue uploads
|--------------------------------------------------------------------------
*/

export function enqueueUploads({
  conversationId,
  items,
  caption = "",
  replyTo = "",
}) {
  if (
    !conversationId ||
    !Array.isArray(items) ||
    !items.length
  ) {
    return [];
  }

  const createdAt = Date.now();

  const created = items.map((item, index) => {
    const file = item?.file || null;

    const prepareFile =
      typeof item?.prepareFile === "function"
        ? item.prepareFile
        : null;

    return {
      id: `upload-${createdAt}-${(counter += 1)}`,

      conversationId: String(conversationId),

      kind: item?.kind || "file",

      file,

      prepareFile,

      fileName:
        item?.fileName ||
        file?.name ||
        "attachment",

      mimeType:
        item?.mimeType ||
        file?.type ||
        "",

      size:
        Number(item?.size ?? file?.size) || 0,

      width:
        Number(item?.width) || 0,

      height:
        Number(item?.height) || 0,

      duration:
        Number(item?.duration) || 0,

      previewUrl:
        item?.previewUrl || "",

      // Caption and reply belong to the first message only.
      caption: index === 0 ? caption : "",

      replyTo: index === 0 ? replyTo : "",

      status: "queued",

      progress: 0,

      preparingFile: Boolean(prepareFile),

      errorKind: "",

      serverMessageId: "",

      attachment: null,

      createdAt,
    };
  });

  /*
   * Important:
   * Publish all pending bubbles before scheduling any asynchronous work.
   * This makes the messages appear immediately after Send is pressed.
   */

  emit([
    ...uploads,
    ...created,
  ]);

  created.forEach((upload) => {
    schedule(upload.id);
  });

  return created.map((upload) => upload.id);
}

/*
|--------------------------------------------------------------------------
| Cancel upload
|--------------------------------------------------------------------------
*/

export function cancelUpload(id) {
  const upload = findUpload(id);

  if (!upload) return;

  controllers.get(id)?.abort();

  removeUpload(id);

  if (upload.status !== "sent") {
    revokePreviewUrl(upload.previewUrl);
  }
}

/*
|--------------------------------------------------------------------------
| Acknowledge successful upload
|--------------------------------------------------------------------------
|
| Remove the temporary bubble only after its permanent server message
| has appeared in MessageList.
|
*/

export function acknowledgeUpload(id) {
  const upload = findUpload(id);

  if (
    !upload ||
    upload.status !== "sent"
  ) {
    return;
  }

  removeUpload(id);
}

/*
|--------------------------------------------------------------------------
| Retry failed upload
|--------------------------------------------------------------------------
*/

export function retryUpload(id) {
  const upload = findUpload(id);

  if (
    !upload ||
    upload.status !== "failed"
  ) {
    return;
  }

  patchUpload(id, {
    status: "queued",
    progress: 0,
    errorKind: "",
    preparingFile: Boolean(upload.prepareFile),
  });

  schedule(id);
}
