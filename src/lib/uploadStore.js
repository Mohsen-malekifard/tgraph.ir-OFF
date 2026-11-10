"use client";

import { useSyncExternalStore } from "react";

import { apiUpload } from "@/lib/api";
import {
  rememberLocalPreview,
  revokePreviewUrl,
} from "@/lib/mediaUtils";

/*
|--------------------------------------------------------------------------
| Upload queue
|--------------------------------------------------------------------------
|
| Lives outside React so an upload keeps going when the user leaves the chat.
| Files are sent one after another, which keeps the messages in the order the
| user picked them. Each entry is rendered as a pending message bubble.
|
| status: "queued" | "uploading" | "sent" | "failed"
|
*/

const EMPTY = [];
const SENT_BUBBLE_LIFETIME_MS = 25000;

let uploads = EMPTY;
let queue = Promise.resolve();
let counter = 0;

const listeners = new Set();
const controllers = new Map();

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
    return { ...upload, ...changes };
  });

  if (found) emit(next);
}

function removeUpload(id) {
  if (!findUpload(id)) return;
  emit(uploads.filter((upload) => upload.id !== id));
}

function classifyError(error) {
  if (error?.name === "NetworkError") return "network";

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

function buildFormData(upload) {
  const form = new FormData();

  form.append("conversationId", upload.conversationId);
  form.append("type", upload.kind);
  form.append("fileName", upload.fileName);

  if (upload.caption) form.append("text", upload.caption);
  if (upload.replyTo) form.append("replyTo", upload.replyTo);

  if (
    (upload.kind === "audio" || upload.kind === "video") &&
    Number.isFinite(upload.duration) &&
    upload.duration > 0
  ) {
    form.append("duration", String(Math.round(upload.duration)));
  }

  if (
    (upload.kind === "image" || upload.kind === "video") &&
    upload.width > 0 &&
    upload.height > 0
  ) {
    form.append("width", String(Math.round(upload.width)));
    form.append("height", String(Math.round(upload.height)));
  }

  // The file part goes last, like the voice-message upload does.
  form.append("file", upload.file, upload.fileName);

  return form;
}

async function runUpload(id) {
  const upload = findUpload(id);

  if (
    !upload ||
    (upload.status !== "queued" && upload.status !== "uploading")
  ) {
    return;
  }

  const controller = new AbortController();
  controllers.set(id, controller);

  patchUpload(id, {
    status: "uploading",
    progress: 0,
    errorKind: "",
  });

  let lastEmit = 0;

  try {
    const data = await apiUpload(
      "/api/media/upload",
      buildFormData(upload),
      {
        signal: controller.signal,
        onProgress: (fraction) => {
          const now = Date.now();

          if (fraction >= 1 || now - lastEmit > 90) {
            lastEmit = now;
            patchUpload(id, { progress: fraction });
          }
        },
      }
    );

    if (data?.success !== true || !data?.message) {
      throw new Error("UPLOAD_FAILED");
    }

    const message = data.message;
    const attachmentUrl =
      data.attachment?.url ||
      message.attachments?.[0]?.url ||
      "";

    // Keep the local preview so the real bubble can show it instantly.
    rememberLocalPreview(attachmentUrl, upload.previewUrl);

    patchUpload(id, {
      status: "sent",
      progress: 1,
      serverMessageId: String(message._id ?? message.id ?? ""),
    });

    window.setTimeout(
      () => removeUpload(id),
      SENT_BUBBLE_LIFETIME_MS
    );
  } catch (error) {
    // A cancelled upload has already been removed by cancelUpload.
    if (error?.name === "AbortError") return;

    patchUpload(id, {
      status: "failed",
      errorKind: classifyError(error),
    });
  } finally {
    controllers.delete(id);
  }
}

function schedule(id) {
  queue = queue
    .then(() => runUpload(id))
    .catch(() => {});
}

export function enqueueUploads({
  conversationId,
  items,
  caption = "",
  replyTo = "",
}) {
  if (!conversationId || !Array.isArray(items) || !items.length) {
    return [];
  }

  const created = items.map((item, index) => ({
    id: `upload-${Date.now()}-${(counter += 1)}`,
    conversationId: String(conversationId),
    kind: item.kind,
    file: item.file,
    fileName: item.fileName || item.file?.name || "attachment",
    mimeType: item.mimeType || item.file?.type || "",
    size: Number(item.size ?? item.file?.size) || 0,
    width: Number(item.width) || 0,
    height: Number(item.height) || 0,
    duration: Number(item.duration) || 0,
    previewUrl: item.previewUrl || "",
    // The caption and the reply target belong to the first message only.
    caption: index === 0 ? caption : "",
    replyTo: index === 0 ? replyTo : "",
    status: "queued",
    progress: 0,
    errorKind: "",
    serverMessageId: "",
    createdAt: Date.now(),
  }));

  emit([...uploads, ...created]);
  created.forEach((upload) => schedule(upload.id));

  return created.map((upload) => upload.id);
}

export function cancelUpload(id) {
  const upload = findUpload(id);
  if (!upload) return;

  controllers.get(id)?.abort();
  removeUpload(id);

  if (upload.status !== "sent") {
    revokePreviewUrl(upload.previewUrl);
  }
}

export function retryUpload(id) {
  const upload = findUpload(id);
  if (!upload || upload.status !== "failed") return;

  patchUpload(id, {
    status: "queued",
    progress: 0,
    errorKind: "",
  });

  schedule(id);
}
