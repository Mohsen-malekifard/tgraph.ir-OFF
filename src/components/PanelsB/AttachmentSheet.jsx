"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  File as FileIcon,
  FolderOpen,
  Image as ImageIcon,
  ImagePlus,
  LoaderCircle,
  MoreVertical,
  Music,
  Video,
} from "lucide-react";

import {
  MAX_CAPTION_LENGTH,
  MAX_SELECTION,
  MAX_UPLOAD_BYTES,
  analyzeMediaFile,
  detectKind,
  formatDuration,
  formatFileSize,
  getFileExtension,
  inferMimeType,
  revokePreviewUrl,
  withMimeType,
} from "@/lib/mediaUtils";

/*
|--------------------------------------------------------------------------
| Telegram-style attach sheet
|--------------------------------------------------------------------------
|
| Slides up from the bottom when the paperclip is pressed.
|
|   Gallery tab : camera tile, "browse" tile and the photos / videos picked
|                 so far, shown in Telegram's tight 3/4 column grid with
|                 numbered selection circles.
|   File tab    : Choose file / Gallery (as files) / Music, followed by the
|                 files picked so far.
|
| Browsers cannot enumerate a device gallery, so photos and videos come from
| the system picker (on phones that is the native photo grid) and are added to
| the grid pre-selected.
|
*/

const SHEET_ANIMATION_MS = 320;
const SHEET_EASING = "cubic-bezier(0.2, 0.9, 0.25, 1)";

function withAlpha(hex, alpha) {
  const normalized = String(hex).replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized.split("").map((char) => char + char).join("")
      : normalized;
  const value = parseInt(expanded, 16);

  if (!Number.isFinite(value)) return hex;

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function tabOf(item) {
  return item.kind === "image" || item.kind === "video"
    ? "gallery"
    : "file";
}

let itemCounter = 0;

function createItemId() {
  itemCounter += 1;
  return `attach-${Date.now()}-${itemCounter}`;
}

const FILE_COLORS = ["#3d8fe0", "#45a85d", "#e0524a", "#d6a437"];

function getFileColor(extension) {
  switch (extension) {
    case "pdf":
    case "ppt":
    case "pptx":
      return "#e0524a";
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return "#3d8fe0";
    case "xls":
    case "xlsx":
    case "csv":
      return "#45a85d";
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return "#d6a437";
    default: {
      let hash = 0;
      for (let index = 0; index < extension.length; index += 1) {
        hash = (hash * 31 + extension.charCodeAt(index)) >>> 0;
      }
      return FILE_COLORS[hash % FILE_COLORS.length];
    }
  }
}

/*
|--------------------------------------------------------------------------
| Small pieces
|--------------------------------------------------------------------------
*/

function SendGlyph({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.2 20.3V14l10.8-2L3.2 10V3.7L21.4 12z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The numbered circle in the corner of every gallery tile / file row.
function SelectionCircle({ index, accent, variant = "photo", ringColor }) {
  const selected = index >= 0;
  const isPhoto = variant === "photo";

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none flex h-[24px] w-[24px] items-center justify-center rounded-full text-[13px] font-semibold leading-none text-white transition-[background-color,border-color,transform] duration-150"
      style={{
        border: `2px solid ${
          selected
            ? isPhoto
              ? "#ffffff"
              : accent
            : isPhoto
              ? "rgba(255,255,255,0.95)"
              : ringColor
        }`,
        backgroundColor: selected
          ? accent
          : isPhoto
            ? "rgba(0,0,0,0.14)"
            : "transparent",
        transform: selected ? "scale(1)" : "scale(0.96)",
      }}
    >
      {selected ? (
        isPhoto ? (
          index + 1
        ) : (
          <Check size={14} strokeWidth={3} />
        )
      ) : null}
    </span>
  );
}

const MediaTile = memo(function MediaTile({
  item,
  index,
  accent,
  tileColor,
  language,
  onToggle,
}) {
  const selected = index >= 0;
  const isVideo = item.kind === "video";

  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      aria-pressed={selected}
      aria-label={item.file?.name || ""}
      className="relative block aspect-square w-full overflow-hidden outline-none"
      style={{ backgroundColor: tileColor }}
    >
      <span
        className="absolute inset-0 block overflow-hidden"
        style={{
          transform: selected ? "scale(0.88)" : "scale(1)",
          borderRadius: selected ? "6px" : "0px",
          transition:
            "transform 160ms ease-out, border-radius 160ms ease-out",
        }}
      >
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-white/45">
            {item.ready ? (
              <Video size={30} strokeWidth={1.6} />
            ) : (
              <LoaderCircle size={24} className="animate-spin" />
            )}
          </span>
        )}
      </span>

      {isVideo && (
        <span
          dir="ltr"
          className="pointer-events-none absolute bottom-[6px] left-[6px] inline-flex items-center gap-[3px] rounded-full bg-black/55 px-[6px] py-[2px] text-[11.5px] font-medium leading-[14px] text-white"
        >
          <Video size={12} strokeWidth={2.2} />
          {item.duration ? formatDuration(item.duration) : ""}
        </span>
      )}

      <span className="absolute right-[5px] top-[5px]">
        <SelectionCircle index={index} accent={accent} />
      </span>
    </button>
  );
});

function ActionRow({ color, icon, title, subtitle, onClick, palette }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-[14px] px-[16px] py-[9px] text-left outline-none transition-colors duration-150"
      style={{ color: palette.text }}
    >
      <span
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          dir="auto"
          className="block truncate text-[16px] font-medium leading-[21px]"
        >
          {title}
        </span>
        <span
          dir="auto"
          className="block truncate text-[13.5px] leading-[18px]"
          style={{ color: palette.muted }}
        >
          {subtitle}
        </span>
      </span>
    </button>
  );
}

const FileRow = memo(function FileRow({
  item,
  index,
  accent,
  language,
  palette,
  onToggle,
}) {
  const extension = getFileExtension(item.file?.name);
  const isAudio = item.kind === "audio";
  const color = isAudio ? "#ee8a38" : getFileColor(extension);

  const date = item.file?.lastModified
    ? new Date(item.file.lastModified).toLocaleDateString(
        language === "english" ? "en-US" : "fa-IR",
        { year: "numeric", month: "short", day: "numeric" }
      )
    : "";

  const details = [
    isAudio && item.duration ? formatDuration(item.duration) : "",
    formatFileSize(item.file?.size, language),
    date,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <button
      type="button"
      onClick={() => onToggle(item.id)}
      aria-pressed={index >= 0}
      className="flex w-full items-center gap-[14px] px-[16px] py-[8px] text-left outline-none"
      style={{ color: palette.text }}
    >
      <span
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[12px] text-[11px] font-bold uppercase text-white"
        style={{ backgroundColor: color }}
      >
        {isAudio ? (
          <Music size={22} strokeWidth={2} />
        ) : (
          (extension || "file").slice(0, 4)
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          dir="auto"
          className="block truncate text-[16px] font-medium leading-[21px]"
        >
          {item.file?.name}
        </span>
        <span
          dir="auto"
          className="block truncate text-[13.5px] leading-[18px]"
          style={{ color: palette.muted }}
        >
          {details}
        </span>
      </span>
      <SelectionCircle
        index={index}
        accent={accent}
        variant="row"
        ringColor={palette.ring}
      />
    </button>
  );
});

/*
|--------------------------------------------------------------------------
| Sheet
|--------------------------------------------------------------------------
*/

function AttachmentSheet({
  open,
  onClose,
  onSend,
  theme,
  isDark,
  language = "english",
  conversationId,
  initialFiles = null,
  onInitialFilesHandled,
}) {
  const t = useCallback(
    (english, persian) => (language === "english" ? english : persian),
    [language]
  );

  const isBlue = theme === "blue";
  const accentSolid = isBlue ? "#1278e6" : "#d93636";
  const accentTone = isDark
    ? isBlue
      ? "#91a8ef"
      : "#f08080"
    : accentSolid;
  const textDir = language === "english" ? "ltr" : "rtl";

  const palette = useMemo(
    () =>
      isDark
        ? {
            sheet: isBlue ? "#0c0f16" : "#150e0f",
            tile: isBlue ? "#161a24" : "#211718",
            text: "#ffffff",
            muted: "rgba(255,255,255,0.55)",
            ring: "rgba(255,255,255,0.4)",
            float: "rgba(24,26,31,0.86)",
            floatBorder: "rgba(255,255,255,0.09)",
            hairline: "rgba(255,255,255,0.08)",
            input: "rgba(255,255,255,0.08)",
            menu: "rgba(36,38,45,0.98)",
            handle: "rgba(255,255,255,0.28)",
            hover: "rgba(255,255,255,0.07)",
          }
        : {
            sheet: "#ffffff",
            tile: "#eceef2",
            text: "#202a3c",
            muted: "rgba(0,0,0,0.5)",
            ring: "rgba(0,0,0,0.3)",
            float: "rgba(255,255,255,0.9)",
            floatBorder: "rgba(0,0,0,0.08)",
            hairline: "rgba(0,0,0,0.08)",
            input: "rgba(0,0,0,0.06)",
            menu: "#ffffff",
            handle: "rgba(0,0,0,0.22)",
            hover: "rgba(0,0,0,0.05)",
          },
    [isDark, isBlue]
  );

  const [rendered, setRendered] = useState(false);
  const [shown, setShown] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState("gallery");
  const [items, setItems] = useState([]);
  const [selection, setSelection] = useState([]);
  const [caption, setCaption] = useState("");
  const [sendAsFiles, setSendAsFiles] = useState(false);
  const [albumFilter, setAlbumFilter] = useState("all");
  const [albumOpen, setAlbumOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [barHidden, setBarHidden] = useState(false);
  const [columns, setColumns] = useState(3);
  const [toast, setToast] = useState("");
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const itemsRef = useRef([]);
  const selectionRef = useRef([]);
  const aliveRef = useRef(true);
  const handedOffRef = useRef(new Set());
  const toastTimerRef = useRef(null);
  const scrollRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const dragStateRef = useRef(null);

  const cameraInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileGalleryInputRef = useRef(null);
  const musicInputRef = useRef(null);

  const [isLoadingDeviceGallery, setIsLoadingDeviceGallery] = useState(false);
  const [isPreparingSend, setIsPreparingSend] = useState(false);

  const nativePhotoLibraryRef = useRef(null);
  const nativeGalleryRequestRef = useRef(0);
  const preparingSendRef = useRef(false);

  itemsRef.current = items;
  selectionRef.current = selection;

  useEffect(() => {
    aliveRef.current = true;

    return () => {
      aliveRef.current = false;
      window.clearTimeout(toastTimerRef.current);

      for (const item of itemsRef.current) {
        if (!handedOffRef.current.has(item.id)) {
          revokePreviewUrl(item.previewUrl);
        }
      }
    };
  }, []);

  const showToast = useCallback((text) => {
    setToast(text);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(
      () => setToast(""),
      2600
    );
  }, []);

  const loadNativeGallery = useCallback(async () => {
    const requestId = ++nativeGalleryRequestRef.current;

    setIsLoadingDeviceGallery(true);

    try {
      const [{ Capacitor }, { PhotoLibrary }] = await Promise.all([
        import("@capacitor/core"),
        import("@capgo/capacitor-photo-library"),
      ]);

      // گالری کامل فقط در نسخه Native قابل دسترسی است.
      if (!Capacitor.isNativePlatform()) return;

      nativePhotoLibraryRef.current = PhotoLibrary;

      // بررسی مجوز فعلی
      let permission = await PhotoLibrary.checkAuthorization();

      // درخواست مجوز در اولین مراجعه به گالری
      if (
        permission.state !== "authorized" &&
        permission.state !== "limited"
      ) {
        permission = await PhotoLibrary.requestAuthorization();
      }

      if (
        permission.state !== "authorized" &&
        permission.state !== "limited"
      ) {
        if (
          requestId === nativeGalleryRequestRef.current &&
          aliveRef.current
        ) {
          showToast(
            t(
              "Gallery access was denied.",
              "دسترسی به گالری داده نشد."
            )
          );
        }

        return;
      }

      let offset = 0;
      let skippedLarge = 0;

      const PAGE_SIZE = 100;

      // دریافت تمام تصاویر و ویدئوها به‌صورت صفحه‌ای
      while (true) {
        const result = await PhotoLibrary.getLibrary({
          offset,
          limit: PAGE_SIZE,
          includeImages: true,
          includeVideos: true,
          useOriginalFileNames: true,
          thumbnailWidth: 320,
          thumbnailHeight: 320,
          thumbnailQuality: 0.65,
          includeFullResolutionData: false,
        });

        if (
          requestId !== nativeGalleryRequestRef.current ||
          !aliveRef.current
        ) {
          return;
        }

        const assets = Array.isArray(result?.assets)
          ? result.assets
          : [];

        if (!assets.length) break;

        const mappedItems = assets.flatMap((asset) => {
          if (!asset?.id) return [];

          const isVideo = asset.type === "video";

          const kind = isVideo ? "video" : "image";

          const mimeType =
            asset.mimeType ||
            (isVideo ? "video/mp4" : "image/jpeg");

          const rawSize = Number(asset.size);

          const size =
            Number.isFinite(rawSize) && rawSize > 0
              ? rawSize
              : 0;

          // محدودیت ۵۰ مگابایت فعلی پروژه
          if (size > MAX_UPLOAD_BYTES) {
            skippedLarge += 1;
            return [];
          }

          const extension = mimeType.includes("/")
            ? mimeType.split("/")[1].split(";")[0]
            : "bin";

          const fileName =
            asset.fileName ||
            `${kind}-${asset.id}.${extension}`;

          const lastModified = asset.creationDate
            ? new Date(asset.creationDate).getTime()
            : Date.now();

          const previewUrl =
            asset.thumbnail?.webPath ||
            (
              asset.thumbnail?.path
                ? Capacitor.convertFileSrc(asset.thumbnail.path)
                : ""
            );

          return [
            {
              id: `native-${asset.id}`,

              // فعلاً فقط اطلاعات فایل را نگه می‌داریم.
              // فایل اصلی هنگام ارسال دریافت می‌شود.
              file: {
                name: fileName,
                size,
                type: mimeType,
                lastModified: Number.isFinite(lastModified)
                  ? lastModified
                  : Date.now(),
              },

              kind,
              mimeType,

              ready: true,

              previewUrl,

              width: asset.width || null,
              height: asset.height || null,
              duration: asset.duration || null,

              nativeAssetId: String(asset.id),
            },
          ];
        });

        // اضافه کردن تصاویر و ویدئوهای جدید بدون تکرار
        setItems((previous) => {
          const existingIds = new Set(
            previous
              .filter((item) => item.nativeAssetId)
              .map((item) => item.nativeAssetId)
          );

          const uniqueItems = mappedItems.filter((item) => {
            if (existingIds.has(item.nativeAssetId)) {
              return false;
            }

            existingIds.add(item.nativeAssetId);
            return true;
          });

          return [...previous, ...uniqueItems];
        });

        offset += assets.length;

        if (!result.hasMore) break;
      }

      if (skippedLarge > 0 && aliveRef.current) {
        showToast(
          t(
            "Some files larger than 50 MB were excluded.",
            "برخی فایل‌های بزرگ‌تر از ۵۰ مگابایت نمایش داده نشدند."
          )
        );
      }
    } catch (error) {
      console.error("Native gallery error:", error);

      if (
        requestId === nativeGalleryRequestRef.current &&
        aliveRef.current
      ) {
        showToast(
          t(
            "Could not load your device gallery.",
            "بارگذاری گالری دستگاه ناموفق بود."
          )
        );
      }
    } finally {
      if (
        requestId === nativeGalleryRequestRef.current &&
        aliveRef.current
      ) {
        setIsLoadingDeviceGallery(false);
      }
    }
  }, [showToast, t]);

  useEffect(() => {
    if (!open) return undefined;

    void loadNativeGallery();

    return () => {
      nativeGalleryRequestRef.current += 1;
    };
  }, [open, loadNativeGallery]);

  const resetAll = useCallback(() => {
    for (const item of itemsRef.current) {
      if (!handedOffRef.current.has(item.id)) {
        revokePreviewUrl(item.previewUrl);
      }
    }

    handedOffRef.current = new Set();
    itemsRef.current = [];
    selectionRef.current = [];

    setItems([]);
    setSelection([]);
    setCaption("");
    setTab("gallery");
    setExpanded(false);
    setSendAsFiles(false);
    setAlbumFilter("all");
    setAlbumOpen(false);
    setMenuOpen(false);
    setBarHidden(false);
    setDragOffset(0);
    setDragging(false);
    setToast("");

    nativeGalleryRequestRef.current += 1;
    nativePhotoLibraryRef.current = null;
    preparingSendRef.current = false;

    setIsLoadingDeviceGallery(false);
    setIsPreparingSend(false);
  }, []);

  /*
   * Open / close animation
   */

  useEffect(() => {
    if (open) {
      setRendered(true);

      let secondFrame = 0;
      const firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() =>
          setShown(true)
        );
      });

      return () => {
        window.cancelAnimationFrame(firstFrame);
        window.cancelAnimationFrame(secondFrame);
      };
    }

    setShown(false);

    const timer = window.setTimeout(() => {
      setRendered(false);
      resetAll();
    }, SHEET_ANIMATION_MS);

    return () => window.clearTimeout(timer);
  }, [open, resetAll]);

  /*
   * Grid columns follow the sheet width (3 on phones, 4 on wider sheets)
   */

  useEffect(() => {
    if (!rendered) return undefined;

    const node = scrollRef.current;
    if (!node) return undefined;

    const measure = () => {
      const width = node.clientWidth;
      if (width > 0) setColumns(width >= 480 ? 4 : 3);
    };

    measure();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => observer.disconnect();
  }, [rendered]);

  const requestClose = useCallback(() => {
    if (preparingSendRef.current) return;

    onClose?.();
  }, [onClose]);

  const collapse = useCallback(() => {
    setExpanded(false);
    setBarHidden(false);
    setAlbumOpen(false);
    setMenuOpen(false);

    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;

      event.preventDefault();

      if (albumOpen || menuOpen) {
        setAlbumOpen(false);
        setMenuOpen(false);
      } else if (expanded) {
        collapse();
      } else {
        requestClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, albumOpen, menuOpen, expanded, collapse, requestClose]);

  /*
   * Adding files
   */

  const updateItem = useCallback((id, changes) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      )
    );
  }, []);

  const ingestFiles = useCallback(
    (fileList, source) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      const accepted = [];
      let tooLarge = 0;

      for (const file of files) {
        if (!file || !file.size) continue;

        if (file.size > MAX_UPLOAD_BYTES) {
          tooLarge += 1;
          continue;
        }

        const mimeType = inferMimeType(file);
        let kind = detectKind(mimeType);

        if (source === "file" || source === "fileGallery") {
          kind = "file";
        } else if (source === "music") {
          kind = kind === "audio" ? "audio" : "file";
        }

        accepted.push({
          id: createItemId(),
          file: withMimeType(file, mimeType),
          kind,
          mimeType,
          ready: kind === "file",
          previewUrl: "",
          width: null,
          height: null,
          duration: null,
        });
      }

      if (tooLarge > 0) {
        showToast(
          t(
            "Files larger than 50 MB can't be sent.",
            "فایل‌های بزرگ‌تر از ۵۰ مگابایت قابل ارسال نیستند."
          )
        );
      }

      if (!accepted.length) return;

      const itemsById = new Map(
        itemsRef.current.map((item) => [item.id, item])
      );
      const counts = { gallery: 0, file: 0 };

      for (const id of selectionRef.current) {
        const existing = itemsById.get(id);
        if (existing) counts[tabOf(existing)] += 1;
      }

      const toSelect = [];
      let overflow = false;

      for (const item of accepted) {
        const target = tabOf(item);

        if (counts[target] < MAX_SELECTION) {
          counts[target] += 1;
          toSelect.push(item.id);
        } else {
          overflow = true;
        }
      }

      if (overflow) {
        showToast(
          t(
            `You can select up to ${MAX_SELECTION} items.`,
            `حداکثر ${MAX_SELECTION} مورد را می‌توانید انتخاب کنید.`
          )
        );
      }

      setItems((previous) => [...previous, ...accepted]);
      setSelection((previous) => [...previous, ...toSelect]);
      setTab(tabOf(accepted[0]));

      for (const item of accepted) {
        if (item.kind === "file") continue;

        analyzeMediaFile(item.file, item.kind)
          .then((meta) => {
            const stillThere =
              aliveRef.current &&
              itemsRef.current.some((entry) => entry.id === item.id);

            if (!stillThere) {
              revokePreviewUrl(meta?.previewUrl);
              return;
            }

            updateItem(item.id, {
              previewUrl: meta?.previewUrl || "",
              width: meta?.width || null,
              height: meta?.height || null,
              duration: Number.isFinite(meta?.duration)
                ? meta.duration
                : null,
              ready: true,
            });
          })
          .catch(() => {
            if (!aliveRef.current) return;

            // The browser could not decode it: send it as a plain file.
            updateItem(item.id, { kind: "file", ready: true });
            showToast(
              t(
                "This image can't be previewed. It will be sent as a file.",
                "پیش‌نمایش این تصویر ممکن نیست؛ به‌صورت فایل ارسال می‌شود."
              )
            );
          });
      }
    },
    [showToast, t, updateItem]
  );

  useEffect(() => {
    if (!open || !initialFiles || !initialFiles.length) return;

    ingestFiles(initialFiles, "media");
    onInitialFilesHandled?.();
  }, [open, initialFiles, ingestFiles, onInitialFilesHandled]);

  const handlePicked = (source) => (event) => {
    const input = event.target;
    const files = Array.from(input.files || []);

    input.value = "";

    if (files.length) ingestFiles(files, source);
  };

  const handleDragOver = (event) => {
    if (event.dataTransfer?.types?.includes("Files")) {
      event.preventDefault();
    }
  };

  const handleDrop = (event) => {
    const files = event.dataTransfer?.files;

    if (files && files.length) {
      event.preventDefault();
      ingestFiles(files, "media");
    }
  };

  /*
   * Selection
   */

  const galleryItems = useMemo(
    () => items.filter((item) => tabOf(item) === "gallery"),
    [items]
  );

  const fileItems = useMemo(
    () => items.filter((item) => tabOf(item) === "file"),
    [items]
  );

  const tabItems = tab === "gallery" ? galleryItems : fileItems;

  const visibleGalleryItems = useMemo(() => {
    if (albumFilter === "photos") {
      return galleryItems.filter((item) => item.kind === "image");
    }

    if (albumFilter === "videos") {
      return galleryItems.filter((item) => item.kind === "video");
    }

    return galleryItems;
  }, [galleryItems, albumFilter]);

  const tabSelectedItems = useMemo(() => {
    const byId = new Map(tabItems.map((item) => [item.id, item]));

    return selection
      .map((id) => byId.get(id))
      .filter(Boolean);
  }, [selection, tabItems]);

  const selectionIndexOf = useCallback(
    (id) => tabSelectedItems.findIndex((item) => item.id === id),
    [tabSelectedItems]
  );

  const selectedCount = tabSelectedItems.length;
  const hasSelection = selectedCount > 0;
  const allReady = tabSelectedItems.every((item) => item.ready);
  const canSend =
    Boolean(conversationId) &&
    hasSelection &&
    allReady &&
    !isPreparingSend;

  const toggleSelect = useCallback(
    (id) => {
      const current = selectionRef.current;

      if (current.includes(id)) {
        setSelection(current.filter((entry) => entry !== id));
        return;
      }

      const target = itemsRef.current.find((item) => item.id === id);
      if (!target) return;

      const targetTab = tabOf(target);
      const selectedInTab = current.filter((entry) => {
        const found = itemsRef.current.find((item) => item.id === entry);
        return found && tabOf(found) === targetTab;
      }).length;

      if (selectedInTab >= MAX_SELECTION) {
        showToast(
          t(
            `You can select up to ${MAX_SELECTION} items.`,
            `حداکثر ${MAX_SELECTION} مورد را می‌توانید انتخاب کنید.`
          )
        );
        return;
      }

      setSelection([...current, id]);
    },
    [showToast, t]
  );

  const clearSelection = useCallback(() => {
    const ids = new Set(tabItems.map((item) => item.id));
    setSelection((previous) => previous.filter((id) => !ids.has(id)));
  }, [tabItems]);

  /*
   * Sending
   */

  const handleSend = useCallback(async () => {
    if (!canSend || preparingSendRef.current) return;

    preparingSendRef.current = true;
    setIsPreparingSend(true);

    try {
      const hasNativeMedia = tabSelectedItems.some(
        (item) => item.nativeAssetId
      );

      const Capacitor = hasNativeMedia
        ? (await import("@capacitor/core")).Capacitor
        : null;

      const PhotoLibrary = nativePhotoLibraryRef.current;

      const payload = [];

      for (const item of tabSelectedItems) {
        let file = item.file;

        // دریافت فایل اصلی از گالری Native
        if (item.nativeAssetId) {
          if (!PhotoLibrary) {
            throw new Error("Photo library is unavailable");
          }

          const nativeFile = await PhotoLibrary.getPhotoUrl({
            id: item.nativeAssetId,
          });

          const fileUrl =
            nativeFile?.webPath ||
            (
              nativeFile?.path
                ? Capacitor.convertFileSrc(nativeFile.path)
                : ""
            );

          if (!fileUrl) {
            throw new Error("Media URL is unavailable");
          }

          const response = await fetch(fileUrl);

          if (!response.ok) {
            throw new Error("Could not read native media");
          }

          const blob = await response.blob();

          if (!blob.size || blob.size > MAX_UPLOAD_BYTES) {
            throw new Error("Invalid media size");
          }

          file = new File(
            [blob],
            item.file?.name || `media-${item.nativeAssetId}`,
            {
              type:
                nativeFile.mimeType ||
                item.mimeType ||
                blob.type ||
                "application/octet-stream",

              lastModified:
                item.file?.lastModified || Date.now(),
            }
          );
        }

        const kind =
          tab === "gallery" && sendAsFiles
            ? "file"
            : item.kind;

        // The preview stays available even when a photo or video is sent
        // "as file", so its message bubble can still show the thumbnail.
        const keepPreview =
          Boolean(item.previewUrl) &&
          (item.kind === "image" || item.kind === "video");

        if (keepPreview) {
          handedOffRef.current.add(item.id);
        }

        payload.push({
          file,
          kind,
          fileName: file.name,
          mimeType: item.mimeType,
          size: file.size,
          width: item.width,
          height: item.height,
          duration: item.duration,
          previewUrl: keepPreview ? item.previewUrl : "",
        });
      }

      if (!aliveRef.current) return;

      onSend?.({
        items: payload,
        caption: caption.trim().slice(0, MAX_CAPTION_LENGTH),
      });

      onClose?.();
    } catch (error) {
      console.error("Attachment preparation error:", error);

      if (aliveRef.current) {
        showToast(
          t(
            "Could not prepare the selected media. Please try again.",
            "آماده‌سازی فایل‌های انتخاب‌شده ناموفق بود. دوباره تلاش کنید."
          )
        );
      }
    } finally {
      preparingSendRef.current = false;

      if (aliveRef.current) {
        setIsPreparingSend(false);
      }
    }
  }, [
    canSend,
    tabSelectedItems,
    tab,
    sendAsFiles,
    caption,
    onSend,
    onClose,
    showToast,
    t,
  ]);

  const handleCaptionKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    const finePointer =
      typeof window !== "undefined" &&
      window.matchMedia?.("(pointer: fine)").matches;

    if (finePointer) {
      event.preventDefault();
      handleSend();
    }
  };

  /*
   * Dragging the sheet
   */

  const handleDragStart = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    dragStateRef.current = {
      id: event.pointerId,
      startY: event.clientY,
      captured: false,
      target: event.currentTarget,
    };
  };

  const handleDragMove = (event) => {
    const drag = dragStateRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    const delta = event.clientY - drag.startY;

    if (!drag.captured) {
      if (Math.abs(delta) < 8) return;

      drag.captured = true;
      setDragging(true);

      try {
        drag.target.setPointerCapture(event.pointerId);
      } catch {
        // Capturing is only an optimization.
      }
    }

    setDragOffset(delta > 0 ? delta : 0);
  };

  const finishDrag = (event, cancelled) => {
    const drag = dragStateRef.current;
    if (!drag || drag.id !== event.pointerId) return;

    dragStateRef.current = null;

    const delta = event.clientY - drag.startY;

    try {
      drag.target.releasePointerCapture?.(event.pointerId);
    } catch {
      // Nothing to release.
    }

    setDragging(false);
    setDragOffset(0);

    if (!drag.captured || cancelled) return;

    if (delta > 90) {
      requestClose();
    } else if (delta < -45) {
      setExpanded(true);
    }
  };

  const dragHandlers = expanded
    ? {}
    : {
        onPointerDown: handleDragStart,
        onPointerMove: handleDragMove,
        onPointerUp: (event) => finishDrag(event, false),
        onPointerCancel: (event) => finishDrag(event, true),
      };

  const handleWheel = (event) => {
    if (!expanded && event.deltaY > 0) setExpanded(true);
  };

  const handleScroll = (event) => {
    const top = event.currentTarget.scrollTop;
    const delta = top - lastScrollTopRef.current;

    lastScrollTopRef.current = top;

    if (!expanded) return;

    if (delta > 6 && top > 40) {
      setBarHidden(true);
    } else if (delta < -6 || top <= 0) {
      setBarHidden(false);
    }
  };

  /*
   * Rendering
   */

  if (!rendered || typeof document === "undefined") return null;

  const albumLabel =
    albumFilter === "photos"
      ? t("Photos", "عکس‌ها")
      : albumFilter === "videos"
        ? t("Videos", "ویدئوها")
        : t("Gallery", "گالری");

  const headerTitle =
    tab === "gallery" ? albumLabel : t("File", "فایل");

  const topPadding = expanded
    ? "calc(max(12px, env(safe-area-inset-top)) + 62px)"
    : "30px";

  const sheetHeight = expanded ? "100dvh" : "min(72dvh, 640px)";

  const floatStyle = {
    backgroundColor: palette.float,
    border: `1px solid ${palette.floatBorder}`,
    color: palette.text,
  };

  const tabButton = (key, label, icon) => {
    const active = tab === key;

    return (
      <button
        type="button"
        onClick={() => {
          setTab(key);
          setAlbumOpen(false);
          setMenuOpen(false);
          setBarHidden(false);
        }}
        aria-pressed={active}
        className="flex h-[48px] flex-1 flex-col items-center justify-center gap-[1px] rounded-full outline-none transition-colors duration-200"
        style={{
          backgroundColor: active
            ? withAlpha(accentTone, isDark ? 0.2 : 0.12)
            : "transparent",
          color: active ? accentTone : palette.text,
        }}
      >
        {icon}
        <span className="text-[12px] font-medium leading-[14px]">
          {label}
        </span>
      </button>
    );
  };

  const renderGalleryGrid = () => (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: "2px",
      }}
    >
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        aria-label={t("Camera", "دوربین")}
        className="relative block aspect-square w-full overflow-hidden bg-[#0b0b0d] outline-none"
      >
        <span className="absolute right-[9px] top-[8px] text-white">
          <Camera size={26} strokeWidth={1.8} />
        </span>
      </button>

      <button
        type="button"
        onClick={() => mediaInputRef.current?.click()}
        aria-label={t("Choose photos and videos", "انتخاب عکس و ویدئو")}
        className="relative flex aspect-square w-full flex-col items-center justify-center gap-[6px] overflow-hidden outline-none"
        style={{
          backgroundColor: palette.tile,
          color: accentTone,
        }}
      >
        <ImagePlus size={32} strokeWidth={1.6} />
        <span
          dir="auto"
          className="px-[6px] text-center text-[12.5px] font-medium leading-[15px]"
        >
          {t("Browse", "مرور گالری")}
        </span>
      </button>

      {visibleGalleryItems.map((item) => (
        <MediaTile
          key={item.id}
          item={item}
          index={selectionIndexOf(item.id)}
          accent={accentSolid}
          tileColor={palette.tile}
          language={language}
          onToggle={toggleSelect}
        />
      ))}
    </div>
  );

  const renderFileList = () => (
    <div>
      <ActionRow
        palette={palette}
        color="#3b8de8"
        icon={<FolderOpen size={23} strokeWidth={1.9} />}
        title={t("Choose file", "انتخاب فایل")}
        subtitle={t(
          "Browse files on your device",
          "مرور فایل‌های دستگاه"
        )}
        onClick={() => fileInputRef.current?.click()}
      />
      <ActionRow
        palette={palette}
        color="#3fae5e"
        icon={<ImageIcon size={23} strokeWidth={1.9} />}
        title={t("Gallery", "گالری")}
        subtitle={t(
          "Send photos and videos as files",
          "ارسال عکس و ویدئو به‌صورت فایل"
        )}
        onClick={() => fileGalleryInputRef.current?.click()}
      />
      <ActionRow
        palette={palette}
        color="#ee8a38"
        icon={<Music size={23} strokeWidth={1.9} />}
        title={t("Music", "موسیقی")}
        subtitle={t("Send audio files", "ارسال فایل‌های صوتی")}
        onClick={() => musicInputRef.current?.click()}
      />

      {fileItems.length > 0 && (
        <>
          <div
            dir={textDir}
            className="px-[16px] pb-[4px] pt-[14px] text-[14px] font-medium"
            style={{ color: accentTone }}
          >
            {t("Selected files", "فایل‌های انتخاب‌شده")}
          </div>
          {fileItems.map((item) => (
            <FileRow
              key={item.id}
              item={item}
              index={selectionIndexOf(item.id)}
              accent={accentSolid}
              language={language}
              palette={palette}
              onToggle={toggleSelect}
            />
          ))}
        </>
      )}
    </div>
  );

  const popupItem = (label, onClick, { checked = false, disabled = false } = {}) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-[16px] px-[16px] py-[11px] text-left text-[15.5px] outline-none transition-colors duration-150 disabled:opacity-40"
      style={{ color: palette.text }}
    >
      <span dir="auto">{label}</span>
      {checked && <Check size={18} strokeWidth={2.4} style={{ color: accentTone }} />}
    </button>
  );

  const popupStyle = {
    backgroundColor: palette.menu,
    border: `1px solid ${palette.floatBorder}`,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
  };

  return createPortal(
    <div
      dir="ltr"
      role="dialog"
      aria-modal="true"
      aria-label={t("Attach", "پیوست")}
      className="fixed inset-0 z-[120]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        onClick={requestClose}
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          opacity: shown ? 1 : 0,
          transition: `opacity ${SHEET_ANIMATION_MS - 60}ms ease-out`,
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[560px] flex-col overflow-hidden"
        style={{
          height: sheetHeight,
          maxHeight: "100dvh",
          backgroundColor: palette.sheet,
          color: palette.text,
          borderTopLeftRadius: expanded ? "0px" : "20px",
          borderTopRightRadius: expanded ? "0px" : "20px",
          transform: shown
            ? `translate3d(0, ${dragOffset}px, 0)`
            : "translate3d(0, 100%, 0)",
          transition: dragging
            ? "none"
            : `transform ${SHEET_ANIMATION_MS}ms ${SHEET_EASING}, height ${SHEET_ANIMATION_MS}ms ${SHEET_EASING}, border-radius 200ms ease-out`,
          boxShadow: "0 -10px 40px rgba(0,0,0,0.35)",
          willChange: "transform",
        }}
      >
        {/* Drag handle (collapsed state) */}
        {!expanded && (
          <div
            {...dragHandlers}
            className="absolute inset-x-0 top-0 z-20 flex h-[30px] cursor-grab touch-none items-start justify-center pt-[10px]"
          >
            <span
              className="h-[4px] w-[34px] rounded-full"
              style={{ backgroundColor: palette.handle }}
            />
          </div>
        )}

        {/* Scrolling content */}
        <div
          ref={scrollRef}
          {...dragHandlers}
          onWheel={handleWheel}
          onScroll={handleScroll}
          className={`scrollbar-none absolute inset-0 ${
            expanded ? "overflow-y-auto" : "overflow-hidden"
          }`}
          style={{
            paddingTop: topPadding,
            paddingBottom: "104px",
            touchAction: expanded ? "pan-y" : "none",
            overscrollBehavior: "contain",
            transition: `padding-top ${SHEET_ANIMATION_MS}ms ${SHEET_EASING}`,
          }}
        >
          {tab === "gallery" ? renderGalleryGrid() : renderFileList()}
        </div>

        {/* Header (expanded state) */}
        {expanded && (
          <div
            className="absolute inset-x-0 top-0 z-20 flex items-center gap-[8px] px-[12px] pb-[8px]"
            style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
          >
            <button
              type="button"
              onClick={collapse}
              aria-label={t("Back", "بازگشت")}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full outline-none backdrop-blur-xl"
              style={floatStyle}
            >
              <ArrowLeft size={22} strokeWidth={2} />
            </button>

            <button
              type="button"
              disabled={tab !== "gallery"}
              onClick={() => {
                setMenuOpen(false);
                setAlbumOpen((previous) => !previous);
              }}
              aria-haspopup="listbox"
              aria-expanded={albumOpen}
              className="flex h-[44px] min-w-0 flex-1 items-center gap-[6px] rounded-full px-[18px] text-left outline-none backdrop-blur-xl"
              style={floatStyle}
            >
              <span
                dir="auto"
                className="truncate text-[17px] font-medium"
              >
                {headerTitle}
              </span>
              {tab === "gallery" && (
                <ChevronDown
                  size={18}
                  strokeWidth={2.2}
                  className="shrink-0 transition-transform duration-200"
                  style={{
                    transform: albumOpen ? "rotate(180deg)" : "none",
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setAlbumOpen(false);
                setMenuOpen((previous) => !previous);
              }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t("More", "بیشتر")}
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full outline-none backdrop-blur-xl"
              style={floatStyle}
            >
              <MoreVertical size={22} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Header popups */}
        {expanded && (albumOpen || menuOpen) && (
          <>
            <div
              className="absolute inset-0 z-30"
              onClick={() => {
                setAlbumOpen(false);
                setMenuOpen(false);
              }}
            />

            {albumOpen && (
              <div
                role="listbox"
                className="absolute left-[64px] z-40 w-[220px] overflow-hidden rounded-[16px] py-[6px]"
                style={{
                  ...popupStyle,
                  top: "calc(max(12px, env(safe-area-inset-top)) + 52px)",
                }}
              >
                {popupItem(
                  t("Gallery", "گالری"),
                  () => {
                    setAlbumFilter("all");
                    setAlbumOpen(false);
                  },
                  { checked: albumFilter === "all" }
                )}
                {popupItem(
                  t("Photos", "عکس‌ها"),
                  () => {
                    setAlbumFilter("photos");
                    setAlbumOpen(false);
                  },
                  { checked: albumFilter === "photos" }
                )}
                {popupItem(
                  t("Videos", "ویدئوها"),
                  () => {
                    setAlbumFilter("videos");
                    setAlbumOpen(false);
                  },
                  { checked: albumFilter === "videos" }
                )}
              </div>
            )}

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-[12px] z-40 w-[240px] overflow-hidden rounded-[16px] py-[6px]"
                style={{
                  ...popupStyle,
                  top: "calc(max(12px, env(safe-area-inset-top)) + 52px)",
                }}
              >
                {tab === "gallery" &&
                  popupItem(
                    t("Send as files", "ارسال به‌صورت فایل"),
                    () => setSendAsFiles((previous) => !previous),
                    { checked: sendAsFiles }
                  )}
                {popupItem(
                  t("Clear selection", "پاک کردن انتخاب"),
                  () => {
                    clearSelection();
                    setMenuOpen(false);
                  },
                  { disabled: !hasSelection }
                )}
              </div>
            )}
          </>
        )}

        {/* Toast */}
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-0 z-40 flex justify-center px-[16px]"
          style={{
            bottom: "calc(max(12px, env(safe-area-inset-bottom)) + 74px)",
            opacity: toast ? 1 : 0,
            transform: toast ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 180ms ease-out, transform 180ms ease-out",
          }}
        >
          {toast && (
            <span
              dir="auto"
              className="max-w-full rounded-[14px] bg-black/80 px-[14px] py-[9px] text-center text-[13.5px] leading-[18px] text-white"
            >
              {toast}
            </span>
          )}
        </div>

        {/* Bottom bars: tabs <-> caption + send */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
          style={{ height: "calc(max(12px, env(safe-area-inset-bottom)) + 74px)" }}
        >
          <div
            className="absolute inset-x-0 bottom-0 px-[12px]"
            style={{
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              transform:
                hasSelection || barHidden
                  ? "translateY(130%)"
                  : "translateY(0)",
              opacity: hasSelection || barHidden ? 0 : 1,
              pointerEvents: hasSelection || barHidden ? "none" : "auto",
              transition: `transform 240ms ${SHEET_EASING}, opacity 180ms ease-out`,
            }}
          >
            <div
              className="flex items-center gap-[4px] rounded-full p-[5px] backdrop-blur-xl backdrop-saturate-150"
              style={{
                backgroundColor: palette.float,
                border: `1px solid ${palette.floatBorder}`,
                boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
              }}
            >
              {tabButton(
                "gallery",
                t("Gallery", "گالری"),
                <ImageIcon size={24} strokeWidth={1.8} />
              )}
              {tabButton(
                "file",
                t("File", "فایل"),
                <FileIcon size={24} strokeWidth={1.8} />
              )}
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 flex items-end gap-[8px] px-[12px] pt-[10px]"
            style={{
              paddingBottom: "max(12px, env(safe-area-inset-bottom))",
              backgroundColor: palette.sheet,
              borderTop: `1px solid ${palette.hairline}`,
              transform: hasSelection
                ? "translateY(0)"
                : "translateY(130%)",
              opacity: hasSelection ? 1 : 0,
              pointerEvents: hasSelection ? "auto" : "none",
              transition: `transform 240ms ${SHEET_EASING}, opacity 180ms ease-out`,
            }}
          >
            <div
              className="flex min-h-[48px] min-w-0 flex-1 items-center rounded-[24px] px-[16px]"
              style={{ backgroundColor: palette.input }}
            >
              <textarea
                dir="auto"
                rows={1}
                value={caption}
                maxLength={MAX_CAPTION_LENGTH}
                onChange={(event) => setCaption(event.target.value)}
                onKeyDown={handleCaptionKeyDown}
                placeholder={t("Add a caption...", "افزودن توضیح...")}
                aria-label={t("Caption", "توضیح")}
                tabIndex={hasSelection ? 0 : -1}
                className="scrollbar-none field-sizing-content max-h-[104px] min-h-[24px] w-full resize-none border-none bg-transparent py-[12px] text-[16px] leading-[24px] outline-none"
                style={{
                  color: palette.text,
                  caretColor: accentTone,
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              aria-label={t("Send", "ارسال")}
              className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-white outline-none transition-[opacity,transform] duration-150 active:scale-[0.92] disabled:opacity-60"
              style={{
                backgroundColor: accentSolid,
                boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
              }}
            >
              {allReady && !isPreparingSend ? (
                <SendGlyph size={24} />
              ) : (
                <LoaderCircle size={22} className="animate-spin" />
              )}

              <span
                aria-hidden="true"
                className="absolute -right-[3px] -top-[3px] flex h-[21px] min-w-[21px] items-center justify-center rounded-full px-[5px] text-[12px] font-semibold leading-none"
                style={{
                  backgroundColor: palette.text,
                  color: palette.sheet,
                  border: `2px solid ${palette.sheet}`,
                }}
              >
                {selectedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Hidden pickers */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="hidden"
          onChange={handlePicked("media")}
        />
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handlePicked("media")}
        />
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handlePicked("file")}
        />
        <input
          ref={fileGalleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handlePicked("fileGallery")}
        />
        <input
          ref={musicInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={handlePicked("music")}
        />
      </div>
    </div>,
    document.body
  );
}

export default memo(AttachmentSheet);
