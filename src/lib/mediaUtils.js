/*
|--------------------------------------------------------------------------
| Media helpers shared by the attach sheet, the upload queue and the
| message bubbles. Pure browser helpers: no React in this file.
|--------------------------------------------------------------------------
*/

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_SELECTION = 10;
export const MAX_CAPTION_LENGTH = 1024;

// Longest edge of the previews generated in the browser.
const PREVIEW_MAX_EDGE = 1280;

// These lists mirror the types the server accepts for each media kind.
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/flac",
  "audio/webm",
]);

const EXTENSION_MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  opus: "audio/ogg",
  flac: "audio/flac",
  weba: "audio/webm",
};

/*
|--------------------------------------------------------------------------
| Names, types and kinds
|--------------------------------------------------------------------------
*/

export function normalizeMimeType(value) {
  return String(value || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

export function getFileExtension(name) {
  const value = String(name || "");
  const dot = value.lastIndexOf(".");

  if (dot < 0 || dot === value.length - 1) return "";

  return value.slice(dot + 1).toLowerCase();
}

export function getFileBaseName(name) {
  const value = String(name || "");
  const dot = value.lastIndexOf(".");

  return dot > 0 ? value.slice(0, dot) : value;
}

// Browsers (especially on Android) report vendor specific MIME types such
// as audio/mp4a-latm or audio/x-m4a. Map them to the types the server knows.
export function inferMimeType(file) {
  const declared = normalizeMimeType(file?.type);
  const fromExtension =
    EXTENSION_MIME_TYPES[getFileExtension(file?.name)] || "";

  if (declared && declared !== "application/octet-stream") {
    if (
      IMAGE_MIME_TYPES.has(declared) ||
      VIDEO_MIME_TYPES.has(declared) ||
      AUDIO_MIME_TYPES.has(declared)
    ) {
      return declared;
    }

    if (
      fromExtension &&
      declared.split("/")[0] === fromExtension.split("/")[0]
    ) {
      return fromExtension;
    }

    return declared;
  }

  return fromExtension || "application/octet-stream";
}

export function detectKind(mimeType) {
  if (IMAGE_MIME_TYPES.has(mimeType)) return "image";
  if (VIDEO_MIME_TYPES.has(mimeType)) return "video";
  if (AUDIO_MIME_TYPES.has(mimeType)) return "audio";
  return "file";
}

export function withMimeType(file, mimeType) {
  if (!file || normalizeMimeType(file.type) === mimeType) return file;

  try {
    return new File([file], file.name, {
      type: mimeType,
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

/*
|--------------------------------------------------------------------------
| Formatting
|--------------------------------------------------------------------------
*/

export function formatDuration(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatFileSize(bytes, language = "english") {
  const value = Math.max(0, Number(bytes) || 0);
  const english = language === "english";

  const units = english
    ? ["B", "KB", "MB", "GB"]
    : ["بایت", "کیلوبایت", "مگابایت", "گیگابایت"];

  if (value < 1024) return `${Math.round(value)} ${units[0]}`;

  const kilobytes = value / 1024;
  if (kilobytes < 1024) {
    return `${kilobytes < 10 ? kilobytes.toFixed(1) : Math.round(kilobytes)} ${units[1]}`;
  }

  const megabytes = kilobytes / 1024;
  if (megabytes < 1024) {
    return `${megabytes < 100 ? megabytes.toFixed(1) : Math.round(megabytes)} ${units[2]}`;
  }

  return `${(megabytes / 1024).toFixed(1)} ${units[3]}`;
}

export function formatMessageTime(value, language = "english") {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(
    language === "english" ? "en-US" : "fa-IR",
    { hour: "2-digit", minute: "2-digit" }
  );
}

export function formatFullDate(value, language = "english") {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(
    language === "english" ? "en-US" : "fa-IR",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

// Short label used in reply previews and as a fallback for empty captions.
export function getMediaTypeLabel(type, language = "english") {
  const english = language === "english";

  switch (type) {
    case "image":
      return english ? "Image" : "تصویر";
    case "video":
      return english ? "Video" : "ویدئو";
    case "audio":
      return english ? "Music" : "آهنگ";
    case "voice":
      return english ? "Audio message" : "پیام صوتی";
    case "file":
      return english ? "File" : "فایل";
    default:
      return "";
  }
}

/*
|--------------------------------------------------------------------------
| Local preview cache
|--------------------------------------------------------------------------
|
| After an upload finishes, the freshly sent photo or video is shown from the
| local preview until the real message arrives, so the bubble never flashes
| empty while its signed URL is fetched.
|
*/

const localPreviews = new Map();

export function rememberLocalPreview(attachmentUrl, previewUrl) {
  if (!attachmentUrl || !previewUrl) return;
  localPreviews.set(attachmentUrl, previewUrl);
}

export function getLocalPreview(attachmentUrl) {
  return attachmentUrl ? localPreviews.get(attachmentUrl) || "" : "";
}

export function revokePreviewUrl(url) {
  if (typeof url === "string" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Nothing to release.
    }
  }
}

/*
|--------------------------------------------------------------------------
| Metadata extraction
|--------------------------------------------------------------------------
|
| analyzeMediaFile resolves with { previewUrl, width, height, duration }
| (any of them may be missing). The returned previewUrl is an object URL
| that the caller owns and must revoke.
|
*/

function drawScaled(source, width, height) {
  const longEdge = Math.max(width, height);
  const scale = Math.min(1, PREVIEW_MAX_EDGE / longEdge);
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function analyzeImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.decoding = "async";

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;

      if (!width || !height) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("INVALID_IMAGE"));
        return;
      }

      const keepOriginal =
        normalizeMimeType(file.type) === "image/gif" ||
        Math.max(width, height) <= PREVIEW_MAX_EDGE;

      if (keepOriginal) {
        resolve({ previewUrl: objectUrl, width, height });
        return;
      }

      const canvas = drawScaled(image, width, height);

      if (!canvas) {
        resolve({ previewUrl: objectUrl, width, height });
        return;
      }

      const outputType =
        normalizeMimeType(file.type) === "image/jpeg"
          ? "image/jpeg"
          : "image/png";

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ previewUrl: objectUrl, width, height });
            return;
          }

          URL.revokeObjectURL(objectUrl);
          resolve({
            previewUrl: URL.createObjectURL(blob),
            width,
            height,
          });
        },
        outputType,
        0.84
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("INVALID_IMAGE"));
    };

    image.src = objectUrl;
  });
}

function analyzeVideo(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    let result = {};
    let finished = false;
    let timer = null;

    const finish = () => {
      if (finished) return;
      finished = true;

      window.clearTimeout(timer);

      try {
        video.removeAttribute("src");
        video.load();
      } catch {
        // The element is discarded anyway.
      }

      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    timer = window.setTimeout(finish, 8000);

    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration)
        ? video.duration
        : null;

      result = {
        width: video.videoWidth || null,
        height: video.videoHeight || null,
        duration,
      };

      const target = duration && duration > 0
        ? Math.min(0.1, duration / 2)
        : 0.05;

      try {
        video.currentTime = target;
      } catch {
        finish();
      }
    };

    video.onseeked = () => {
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
          finish();
          return;
        }

        const canvas = drawScaled(video, width, height);

        if (!canvas) {
          finish();
          return;
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              result = {
                ...result,
                previewUrl: URL.createObjectURL(blob),
              };
            }

            finish();
          },
          "image/jpeg",
          0.82
        );
      } catch {
        finish();
      }
    };

    video.onerror = finish;
    video.src = objectUrl;
  });
}

function analyzeAudio(file) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();

    let finished = false;
    let timer = null;

    const finish = (duration) => {
      if (finished) return;
      finished = true;

      window.clearTimeout(timer);

      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {
        // The element is discarded anyway.
      }

      URL.revokeObjectURL(objectUrl);
      resolve({ duration });
    };

    timer = window.setTimeout(() => finish(null), 6000);

    audio.preload = "metadata";
    audio.onloadedmetadata = () =>
      finish(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => finish(null);
    audio.src = objectUrl;
  });
}

export function analyzeMediaFile(file, kind) {
  if (kind === "image") return analyzeImage(file);
  if (kind === "video") return analyzeVideo(file);
  if (kind === "audio") return analyzeAudio(file);

  return Promise.resolve({});
}

/*
|--------------------------------------------------------------------------
| Layout
|--------------------------------------------------------------------------
|
| Telegram sizes photo and video bubbles from the media's own proportions.
| Returns the pixel width of the bubble and the CSS aspect ratio of its box.
|
*/

const MEDIA_MAX_WIDTH = 300;
const MEDIA_MAX_HEIGHT = 380;
const MEDIA_MIN_WIDTH = 160;
const MEDIA_MIN_RATIO = 0.5;
const MEDIA_MAX_RATIO = 3;

export function getMediaBoxSize(width, height) {
  const w = Number(width);
  const h = Number(height);

  if (!(w > 0) || !(h > 0)) {
    return { width: 240, ratio: 4 / 3, known: false };
  }

  const ratio = Math.min(
    MEDIA_MAX_RATIO,
    Math.max(MEDIA_MIN_RATIO, w / h)
  );

  let boxWidth = Math.min(
    MEDIA_MAX_WIDTH,
    Math.max(MEDIA_MIN_WIDTH, w)
  );

  if (boxWidth / ratio > MEDIA_MAX_HEIGHT) {
    boxWidth = MEDIA_MAX_HEIGHT * ratio;
  }

  return { width: Math.round(boxWidth), ratio, known: true };
}
