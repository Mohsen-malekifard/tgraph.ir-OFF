"use client";

/*
|--------------------------------------------------------------------------
| Persistent Media Cache
|--------------------------------------------------------------------------
|
| Storage:
|   IndexedDB
|
| Cache key:
|   userId + fileId
|
| Capacity:
|   200 MB per user
|
| Eviction:
|   Least Recently Used (LRU)
|
*/

const DB_NAME = "telegraph-media-cache";
const DB_VERSION = 1;
const STORE_NAME = "media";

export const MAX_USER_CACHE_BYTES = 200 * 1024 * 1024;

const IMAGE_MAX_EDGE = 1920;
const IMAGE_WEBP_QUALITY = 0.82;

let databasePromise = null;
let persistenceRequestStarted = false;

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

  return String(value).trim();
}

function getCacheKey(userId, fileId) {
  return `${normalizeId(userId)}::${normalizeId(fileId)}`;
}

function requestPersistentStorage() {
  if (
    persistenceRequestStarted ||
    typeof navigator === "undefined"
  ) {
    return;
  }

  persistenceRequestStarted = true;

  try {
    if (
      typeof navigator.storage?.persist === "function"
    ) {
      navigator.storage.persist().catch(() => {
        // Persistent storage is optional.
      });
    }
  } catch {
    // Storage persistence must not break the application.
  }
}

/*
|--------------------------------------------------------------------------
| Open IndexedDB
|--------------------------------------------------------------------------
*/

function openDatabase() {
  if (databasePromise) {
    return databasePromise;
  }

  if (
    typeof window === "undefined" ||
    !window.indexedDB
  ) {
    return Promise.reject(
      new Error("INDEXEDDB_UNAVAILABLE")
    );
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(STORE_NAME)
      ) {
        const store = database.createObjectStore(
          STORE_NAME,
          {
            keyPath: "key",
          }
        );

        store.createIndex(
          "userId",
          "userId",
          {
            unique: false,
          }
        );

        store.createIndex(
          "lastAccessedAt",
          "lastAccessedAt",
          {
            unique: false,
          }
        );
      }
    };

    request.onsuccess = () => {
      const database = request.result;

      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };

      requestPersistentStorage();

      resolve(database);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error("INDEXEDDB_OPEN_FAILED")
      );
    };

    request.onblocked = () => {
      reject(
        new Error("INDEXEDDB_BLOCKED")
      );
    };
  }).catch((error) => {
    databasePromise = null;
    throw error;
  });

  return databasePromise;
}

/*
|--------------------------------------------------------------------------
| Get Cached Media
|--------------------------------------------------------------------------
*/

export async function getCachedMedia(
  userId,
  fileId
) {
  const normalizedUserId = normalizeId(userId);
  const normalizedFileId = normalizeId(fileId);

  if (
    !normalizedUserId ||
    !normalizedFileId
  ) {
    return null;
  }

  try {
    const database = await openDatabase();

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = transaction.objectStore(
        STORE_NAME
      );

      const key = getCacheKey(
        normalizedUserId,
        normalizedFileId
      );

      let result = null;

      const request = store.get(key);

      request.onsuccess = () => {
        const record = request.result;

        if (
          !record ||
          !record.blob ||
          typeof record.blob.size !== "number"
        ) {
          return;
        }

        result = record.blob;

        store.put({
          ...record,
          lastAccessedAt: Date.now(),
        });
      };

      transaction.oncomplete = () => {
        resolve(result);
      };

      transaction.onerror = () => {
        reject(
          transaction.error ||
            new Error("INDEXEDDB_READ_FAILED")
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ||
            new Error("INDEXEDDB_READ_ABORTED")
        );
      };
    });
  } catch {
    /*
     * Cache failure must not prevent media from loading
     * from the server.
     */

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Save Media
|--------------------------------------------------------------------------
*/

export async function putCachedMedia(
  userId,
  fileId,
  blob,
  metadata = {}
) {
  const normalizedUserId = normalizeId(userId);
  const normalizedFileId = normalizeId(fileId);

  if (
    !normalizedUserId ||
    !normalizedFileId ||
    !blob ||
    typeof blob.size !== "number" ||
    blob.size <= 0
  ) {
    return false;
  }

  if (blob.size > MAX_USER_CACHE_BYTES) {
    return false;
  }

  try {
    const database = await openDatabase();

    const key = getCacheKey(
      normalizedUserId,
      normalizedFileId
    );

    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(
        STORE_NAME,
        "readwrite"
      );

      const store = transaction.objectStore(
        STORE_NAME
      );

      let saved = false;

      const request = store
        .index("userId")
        .getAll(normalizedUserId);

      request.onsuccess = () => {
        const records = Array.isArray(request.result)
          ? request.result
          : [];

        /*
         * Exclude the previous version of this file
         * from the capacity calculation.
         */

        const otherRecords = records.filter(
          (record) => record.key !== key
        );

        let totalBytes = otherRecords.reduce(
          (total, record) =>
            total + Math.max(0, Number(record.size) || 0),
          0
        );

        /*
         * Oldest and least recently accessed files
         * are removed first.
         */

        const oldestFirst = [...otherRecords].sort(
          (first, second) =>
            (Number(first.lastAccessedAt) || 0) -
            (Number(second.lastAccessedAt) || 0)
        );

        for (const record of oldestFirst) {
          if (
            totalBytes + blob.size <=
            MAX_USER_CACHE_BYTES
          ) {
            break;
          }

          store.delete(record.key);

          totalBytes -= Math.max(
            0,
            Number(record.size) || 0
          );
        }

        if (
          totalBytes + blob.size >
          MAX_USER_CACHE_BYTES
        ) {
          return;
        }

        store.put({
          key,
          userId: normalizedUserId,
          fileId: normalizedFileId,

          blob,
          size: blob.size,

          mimeType:
            blob.type ||
            metadata.mimeType ||
            "application/octet-stream",

          originalSize:
            Number(metadata.originalSize) ||
            blob.size,

          optimized: Boolean(metadata.optimized),

          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
        });

        saved = true;
      };

      transaction.oncomplete = () => {
        resolve(saved);
      };

      transaction.onerror = () => {
        reject(
          transaction.error ||
            new Error("INDEXEDDB_WRITE_FAILED")
        );
      };

      transaction.onabort = () => {
        reject(
          transaction.error ||
            new Error("INDEXEDDB_WRITE_ABORTED")
        );
      };
    });
  } catch {
    /*
     * Quota errors and private browsing restrictions
     * should not break media playback.
     */

    return false;
  }
}

/*
|--------------------------------------------------------------------------
| Image Compression
|--------------------------------------------------------------------------
|
| Supported:
|   JPEG
|   PNG
|   WebP
|
| Preserved:
|   GIF
|   SVG
|   AVIF
|   Unsupported image formats
|
| The compressed version is only retained when it is
| smaller than the original.
|
*/

async function canvasToWebP(
  canvas,
  quality
) {
  if (
    typeof canvas.convertToBlob === "function"
  ) {
    return canvas.convertToBlob({
      type: "image/webp",
      quality,
    });
  }

  if (
    typeof canvas.toBlob === "function"
  ) {
    return new Promise((resolve) => {
      canvas.toBlob(
        resolve,
        "image/webp",
        quality
      );
    });
  }

  return null;
}

export async function optimizeImageForCache(blob) {
  if (
    !blob ||
    !blob.type ||
    typeof createImageBitmap !== "function"
  ) {
    return {
      blob,
      optimized: false,
    };
  }

  const mimeType = String(blob.type).toLowerCase();

  const supportedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  if (!supportedTypes.has(mimeType)) {
    return {
      blob,
      optimized: false,
    };
  }

  let bitmap = null;

  try {
    bitmap = await createImageBitmap(blob);

    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;

    if (
      !originalWidth ||
      !originalHeight
    ) {
      return {
        blob,
        optimized: false,
      };
    }

    const longestEdge = Math.max(
      originalWidth,
      originalHeight
    );

    const scale = Math.min(
      1,
      IMAGE_MAX_EDGE / longestEdge
    );

    const width = Math.max(
      1,
      Math.round(originalWidth * scale)
    );

    const height = Math.max(
      1,
      Math.round(originalHeight * scale)
    );

    let canvas;

    if (
      typeof OffscreenCanvas !== "undefined"
    ) {
      canvas = new OffscreenCanvas(
        width,
        height
      );
    } else if (
      typeof document !== "undefined"
    ) {
      canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;
    } else {
      return {
        blob,
        optimized: false,
      };
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return {
        blob,
        optimized: false,
      };
    }

    context.drawImage(
      bitmap,
      0,
      0,
      width,
      height
    );

    const compressed = await canvasToWebP(
      canvas,
      IMAGE_WEBP_QUALITY
    );

    if (
      !compressed ||
      !compressed.size ||
      compressed.type !== "image/webp"
    ) {
      return {
        blob,
        optimized: false,
      };
    }

    /*
     * Avoid replacing the original with a larger
     * or almost equally sized WebP file.
     */

    if (
      compressed.size >= blob.size * 0.97
    ) {
      return {
        blob,
        optimized: false,
      };
    }

    return {
      blob: compressed,
      optimized: true,
    };
  } catch {
    return {
      blob,
      optimized: false,
    };
  } finally {
    try {
      bitmap?.close?.();
    } catch {
      // Ignore bitmap cleanup errors.
    }
  }
}
