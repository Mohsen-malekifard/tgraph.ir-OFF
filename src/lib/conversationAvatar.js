function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("خواندن تصویر ناموفق بود."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("بازکردن تصویر ناموفق بود."));
    image.src = source;
  });
}

/** Compresses an avatar into a small square data URL for Conversation.avatar. */
export async function compressConversationAvatar(file) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("یک فایل تصویری معتبر انتخاب کن.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("حجم تصویر باید کمتر از ۱۲ مگابایت باشد.");
  }

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const side = Math.min(image.naturalWidth, image.naturalHeight);

  for (const edge of [128, 96, 64, 48]) {
    const canvas = document.createElement("canvas");
    canvas.width = edge;
    canvas.height = edge;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("پردازش تصویر در این دستگاه پشتیبانی نمی‌شود.");

    const sx = Math.max(0, (image.naturalWidth - side) / 2);
    const sy = Math.max(0, (image.naturalHeight - side) / 2);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, edge, edge);
    context.drawImage(image, sx, sy, side, side, 0, 0, edge, edge);

    for (const quality of [0.66, 0.5, 0.36, 0.24, 0.16]) {
      let avatar = canvas.toDataURL("image/webp", quality);
      if (!avatar.startsWith("data:image/webp")) {
        avatar = canvas.toDataURL("image/jpeg", quality);
      }
      if (avatar.length <= 1900) return avatar;
    }
  }

  throw new Error("این تصویر را نمی‌توان با حجم مجاز به عکس پروفایل تبدیل کرد.");
}
