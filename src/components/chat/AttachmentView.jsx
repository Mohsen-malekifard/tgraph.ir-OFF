"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Grid2X2,
  LoaderCircle,
  MoreVertical,
  Music,
  Paintbrush,
  Pause,
  Play,
  Reply,
  Share2,
  Smile,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { useTheme } from "@/context/ThemeContext";
import { apiFetch } from "@/lib/api";

import {
  downloadAttachment,
  useInView,
  useMediaUrl,
} from "@/lib/mediaHooks";

import {
  formatDuration,
  formatFileSize,
  getFileExtension,
  getLocalPreview,
  getMediaBoxSize,
} from "@/lib/mediaUtils";

import UploadProgressRing from "./UploadProgressRing";

/*
|--------------------------------------------------------------------------
| Constants and shared media registry
|--------------------------------------------------------------------------
*/

const VIDEO_PLAYBACK_RATES = [
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  1.75,
  2,
];

// Each mounted visual attachment registers itself here. This lets the viewer
// build a gallery from the visual attachments belonging to the same message,
// without requiring changes in the message-list component.
const mountedVisualAttachments = new Map();
let visualAttachmentSequence = 0;

/*
|--------------------------------------------------------------------------
| Attachment layout
|--------------------------------------------------------------------------
*/

export function getAttachmentLayout(info) {
  const kind = info?.kind ?? info?.type;

  if (kind === "image" || kind === "video") {
    const box = getMediaBoxSize(info.width, info.height);

    return {
      width: box.width,
      overlayTime: true,
    };
  }

  return {
    width: 280,
    overlayTime: false,
  };
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const stop = (event) => event.stopPropagation();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getFileName(attachment) {
  return attachment?.fileName || attachment?.name || "";
}

function getViewerDate(value, language) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const english = language === "english";
  const time = date.toLocaleTimeString(english ? "en-US" : "fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return english ? `today at ${time}` : `امروز ساعت ${time}`;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return english ? `yesterday at ${time}` : `دیروز ساعت ${time}`;
  }

  const dateLabel = date.toLocaleDateString(
    english ? "en-US" : "fa-IR",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return `${dateLabel} • ${time}`;
}

function getZoomDistance(first, second) {
  const dx = first.x - second.x;
  const dy = first.y - second.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getSenderName(sender, fallback, language) {
  if (fallback) return fallback;

  if (sender && typeof sender === "object") {
    const fullName = [sender.firstName, sender.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) return fullName;
    if (sender.username) return `@${sender.username}`;
  }

  return language === "english" ? "Unknown" : "کاربر";
}

function getUploadSubtitle({ upload, info, language }) {
  const english = language === "english";

  if (upload?.status === "failed") {
    return english
      ? "Upload failed — tap the retry button"
      : "ارسال ناموفق بود — دکمه تلاش مجدد را بزنید";
  }

  if (upload?.preparingFile) {
    return english ? "Preparing file…" : "در حال آماده‌سازی فایل…";
  }

  if (upload && upload.status !== "sent") {
    const loaded =
      (Number(info.size) || 0) * (Number(upload.progress) || 0);

    return `${formatFileSize(loaded, language)} / ${formatFileSize(info.size, language)}`;
  }

  return "";
}

function collectGalleryItems(currentItem) {
  const conversationId = currentItem?.conversationId;
  const messageId = currentItem?.messageId;
  const mountedItems = [...mountedVisualAttachments.values()];

  // Prefer the current conversation so the gallery can move between media
  // sent in separate messages. Fall back to the current message for callers
  // that do not provide a conversationId.
  let items = mountedItems.filter((item) => {
    if (!item.node?.isConnected || !item.attachment) return false;

    if (conversationId !== undefined && conversationId !== null && conversationId !== "") {
      return String(item.conversationId) === String(conversationId);
    }

    if (messageId !== undefined && messageId !== null && messageId !== "") {
      return String(item.messageId) === String(messageId);
    }

    return false;
  });

  if (!items.some((item) => item.registryId === currentItem.registryId)) {
    items.push(currentItem);
  }

  // Keep the same order as the rendered chat timeline.
  items.sort((first, second) => {
    if (!first.node?.isConnected || !second.node?.isConnected) return 0;

    const position = first.node.compareDocumentPosition(second.node);

    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });

  return items.map((item) => ({
    registryId: item.registryId,
    attachment: item.attachment,
    kind: item.kind,
    fallbackSrc: item.fallbackSrc,
    userId: item.userId,
    language: item.language,
    senderName: item.senderName,
    createdAt: item.createdAt,
    messageId: item.messageId,
    conversationId: item.conversationId,
  }));
}

/*
|--------------------------------------------------------------------------
| Viewer menu item
|--------------------------------------------------------------------------
*/

function ViewerMenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
  language = "english",
  disabled = false,
}) {
  const english = language === "english";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex w-full min-w-0 items-center gap-[12px]
        rounded-[5px] px-[3px] py-[3px]
        text-white transition-colors duration-150
        hover:bg-white/[0.07]
        active:bg-white/[0.12]
        disabled:cursor-default disabled:opacity-50
        ${english ? "flex-row text-left" : "flex-row-reverse text-right"}
      `}
    >
      <Icon
        size={21}
        strokeWidth={1.9}
        className={`shrink-0 ${danger ? "text-[#ff7777]" : "text-white/85"}`}
      />

      <span
        className={`
          min-w-0 flex-1 truncate text-[14px] font-medium
          ${danger ? "text-[#ff7777]" : "text-white"}
          ${english ? "text-left" : "text-right"}
        `}
      >
        {label}
      </span>
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| Viewer header — styled to match the supplied Android gallery reference
|--------------------------------------------------------------------------
*/

function ViewerHeader({
  senderName,
  createdAt,
  language,
  onClose,
  onEdit,
  onShare,
  onToggleMenu,
  menuOpen,
  menuButtonRef,
  visible,
}) {
  const english = language === "english";

  return (
    <header
      className="
        absolute inset-x-0 z-[30]
        flex h-[56px] items-center justify-between
        border-b border-white/[0.10]
        px-[8px]
        text-white
        shadow-[0_1px_7px_rgba(0,0,0,0.07)]
      "
      style={{
        top: "env(safe-area-inset-top, 0px)",
        background: "rgba(76, 76, 76, 0.43)",
        backdropFilter: "blur(4px) saturate(110%)",
        WebkitBackdropFilter: "blur(4px) saturate(110%)",
        transform: visible ? "translateY(0)" : "translateY(-115%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition:
          "transform 230ms cubic-bezier(0.2, 0.75, 0.25, 1), opacity 180ms ease",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-[30px]">
        <button
          type="button"
          onClick={onClose}
          aria-label={english ? "Back" : "بازگشت"}
          className="
            flex h-[44px] w-[48px] shrink-0
            items-center justify-center rounded-full
            text-white transition-colors duration-150
            hover:bg-white/[0.08]
            active:scale-90 active:bg-white/[0.15]
          "
        >
          <ArrowLeft size={25} strokeWidth={2.15} />
        </button>

        <div className="flex min-w-0 flex-col justify-center">
          <span className="truncate text-[16px] font-semibold leading-[21px] tracking-[0.05px] text-white">
            {senderName}
          </span>

          <span className="mt-[1px] truncate text-[14px] font-normal leading-[18px] text-white/75">
            {getViewerDate(createdAt, language)}
          </span>
        </div>
      </div>

      <div className="ml-[8px] flex shrink-0 items-center gap-[18px]">
        <button
          type="button"
          onClick={onEdit}
          aria-label={english ? "Edit media" : "ویرایش رسانه"}
          className="
            flex h-[42px] w-[42px] items-center justify-center rounded-full
            text-white transition-colors duration-150
            hover:bg-white/[0.09]
            active:scale-90 active:bg-white/[0.15]
          "
        >
          <Paintbrush size={23} strokeWidth={2.15} />
        </button>

        <button
          type="button"
          onClick={onShare}
          aria-label={english ? "Share" : "اشتراک‌گذاری"}
          className="
            flex h-[42px] w-[42px] items-center justify-center rounded-full
            text-white transition-colors duration-150
            hover:bg-white/[0.09]
            active:scale-90 active:bg-white/[0.15]
          "
        >
          <Share2 size={23} strokeWidth={2.2} />
        </button>

        <button
          ref={menuButtonRef}
          type="button"
          onClick={onToggleMenu}
          aria-label={english ? "More options" : "گزینه‌های بیشتر"}
          aria-expanded={menuOpen}
          className="
            flex h-[42px] w-[38px] items-center justify-center rounded-full
            text-white transition-colors duration-150
            hover:bg-white/[0.09]
            active:scale-90 active:bg-white/[0.15]
          "
        >
          <MoreVertical size={24} strokeWidth={2.3} />
        </button>
      </div>
    </header>
  );
}

/*
|--------------------------------------------------------------------------
| Fullscreen media viewer
|--------------------------------------------------------------------------
*/

function MediaViewer({
  items,
  initialIndex = 0,
  initialRect = null,
  historyKey = "",
  onClose,
}) {
  const { theme, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [chromeVisible, setChromeVisible] = useState(true);

  const galleryItems = items?.length ? items : [];
  const activeItem = galleryItems[activeIndex] || galleryItems[0] || {};

  const attachment = activeItem.attachment || null;
  const kind = activeItem.kind || attachment?.type || "image";
  const fallbackSrc = activeItem.fallbackSrc || "";
  const userId = activeItem.userId || "";
  const language = activeItem.language || "english";
  const english = language === "english";
  const senderName = getSenderName(null, activeItem.senderName, language);
  const createdAt = activeItem.createdAt;
  const messageId = activeItem.messageId;
  const conversationId = activeItem.conversationId;
  const isVideo = kind === "video";

  const remote = useMediaUrl(attachment, {
    enabled: Boolean(attachment),
    userId,
    persistent: !isVideo,
  });

  const mediaSrc = isVideo
    ? remote.url
    : fallbackSrc || remote.url;

  const menuBackground =
    theme === "blue" && isDark
      ? "#282C3F"
      : theme === "red" && isDark
        ? "#252525"
        : "#252525";

  const viewerRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);
  const closingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pointerMapRef = useRef(new Map());
  const slideDirectionRef = useRef(0);
  const videoControlsTimerRef = useRef(null);

  /* Image state */

  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageRotation, setImageRotation] = useState(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const imageScaleRef = useRef(1);
  imageScaleRef.current = imageScale;

  const gestureRef = useRef({
    mode: "",
    distance: 0,
    scale: 1,
    position: null,
    pointer: null,
    start: null,
    deltaX: 0,
    deltaY: 0,
  });

  /* Video state */

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoBuffering, setVideoBuffering] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoVolume, setVideoVolume] = useState(1);
  const [videoMuted, setVideoMuted] = useState(false);
  const [videoRate, setVideoRate] = useState(1);
  const [videoControlsVisible, setVideoControlsVisible] = useState(true);
  const [videoError, setVideoError] = useState("");
  const [videoFullscreen, setVideoFullscreen] = useState(false);

  /* Menu state */

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState("");

  const toggleMenu = useCallback(() => {
    setMenuOpen((previous) => !previous);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Open / close animation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return undefined;

    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) return undefined;

    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);

    const startTransform = initialRect
      ? `translate3d(${initialRect.left}px, ${initialRect.top}px, 0) scale(${Math.max(initialRect.width / width, 0.02)}, ${Math.max(initialRect.height / height, 0.02)})`
      : "translate3d(0, 16px, 0) scale(0.96)";

    try {
      const animation = viewer.animate(
        [
          {
            transform: startTransform,
            opacity: 0.35,
          },
          {
            transform: "translate3d(0, 0, 0) scale(1, 1)",
            opacity: 1,
          },
        ],
        {
          duration: 280,
          easing: "cubic-bezier(0.18, 0.78, 0.25, 1)",
          fill: "both",
        }
      );

      return () => animation.cancel();
    } catch {
      return undefined;
    }
  }, [initialRect]);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }

    if (document.fullscreenElement) {
      try {
        const exitPromise = document.exitFullscreen?.();
        exitPromise?.catch(() => {});
      } catch {
        // Fullscreen is not available in every Android WebView.
      }
    }

    // Close only this viewer's history entry. When popstate has already fired,
    // the state no longer matches and a second history.back() is not issued.
    if (
      historyKey &&
      window.history.state?.__telegraphMediaViewer === historyKey
    ) {
      try {
        window.history.back();
      } catch {
        // Continue with the visual close even if History API fails.
      }
    }

    const viewer = viewerRef.current;
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (viewer && initialRect && !reducedMotion && viewer.animate) {
      const width = Math.max(window.innerWidth, 1);
      const height = Math.max(window.innerHeight, 1);
      const targetTransform = `translate3d(${initialRect.left}px, ${initialRect.top}px, 0) scale(${Math.max(initialRect.width / width, 0.02)}, ${Math.max(initialRect.height / height, 0.02)})`;

      try {
        const animation = viewer.animate(
          [
            {
              transform: "translate3d(0, 0, 0) scale(1, 1)",
              opacity: 1,
            },
            {
              transform: targetTransform,
              opacity: 0.25,
            },
          ],
          {
            duration: 220,
            easing: "cubic-bezier(0.4, 0, 1, 1)",
            fill: "forwards",
          }
        );

        animation.onfinish = () => onClose?.();
        animation.oncancel = () => onClose?.();
        return;
      } catch {
        // Fall through to an immediate close.
      }
    }

    onClose?.();
  }, [historyKey, initialRect, onClose]);

  /*
  |--------------------------------------------------------------------------
  | Gallery navigation
  |--------------------------------------------------------------------------
  */

  const navigateGallery = useCallback(
    (direction) => {
      if (galleryItems.length < 2) return;

      const nextIndex = clamp(
        activeIndex + direction,
        0,
        galleryItems.length - 1
      );

      if (nextIndex === activeIndex) {
        setSwipeOffset(0);
        return;
      }

      slideDirectionRef.current = direction;
      setActiveIndex(nextIndex);
      setSwipeOffset(0);
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      setImageRotation(0);
      imageScaleRef.current = 1;
      pointerMapRef.current.clear();
      gestureRef.current = {
        mode: "",
        distance: 0,
        scale: 1,
        position: null,
        pointer: null,
        start: null,
        deltaX: 0,
        deltaY: 0,
      };
    },
    [activeIndex, galleryItems.length]
  );

  useEffect(() => {
    const image = imageRef.current;
    const direction = slideDirectionRef.current;

    if (!image || !direction) return;
    slideDirectionRef.current = 0;

    // Move the incoming image far enough to make the gallery change readable,
    // while keeping the movement compact and comfortable on narrow screens.
    const stageWidth = stageRef.current?.clientWidth || window.innerWidth;
    const entryOffset = Math.min(Math.max(stageWidth * 0.18, 54), 104);

    const targetTransform =
      `translate3d(${imagePosition.x}px, ${imagePosition.y}px, 0) ` +
      `scale(${imageScale}) rotate(${imageRotation}deg)`;

    const startTransform =
      `translate3d(${direction * entryOffset}px, ${imagePosition.y}px, 0) ` +
      `scale(${imageScale * 0.985}) rotate(${imageRotation}deg)`;

    try {
      const animation = image.animate(
        [
          {
            transform: startTransform,
            opacity: 0.78,
          },
          {
            transform: targetTransform,
            opacity: 1,
          },
        ],
        {
          duration: 300,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        }
      );

      return () => animation.cancel();
    } catch {
      return undefined;
    }
  }, [activeIndex]);

  /*
  |--------------------------------------------------------------------------
  | Image zoom and swipe gestures
  |--------------------------------------------------------------------------
  */

  const setZoom = useCallback((value) => {
    const nextScale = clamp(value, 1, 5);
    setImageScale(nextScale);
    imageScaleRef.current = nextScale;

    if (nextScale <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  }, []);

  const handleImageWheel = useCallback(
    (event) => {
      if (isVideo) return;
      event.preventDefault();
      setZoom(imageScaleRef.current + (event.deltaY < 0 ? 0.15 : -0.15));
    },
    [isVideo, setZoom]
  );

  const handleImagePointerDown = useCallback(
    (event) => {
      if (
        isVideo ||
        (event.pointerType === "mouse" && event.button !== 0)
      ) {
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      // Prevent the WebView from interpreting the gesture as page navigation.
      if (event.cancelable) event.preventDefault();

      try {
        stage.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional in older Android WebViews.
      }

      pointerMapRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const pointers = [...pointerMapRef.current.values()];

      if (pointers.length >= 2) {
        setSwipeOffset(0);
        gestureRef.current = {
          mode: "pinch",
          distance: getZoomDistance(pointers[0], pointers[1]),
          scale: imageScaleRef.current,
          position: imagePosition,
          pointer: null,
          start: null,
          deltaX: 0,
          deltaY: 0,
        };
        return;
      }

      const point = { x: event.clientX, y: event.clientY };

      if (imageScaleRef.current > 1) {
        gestureRef.current = {
          mode: "pan",
          distance: 0,
          scale: imageScaleRef.current,
          position: imagePosition,
          pointer: point,
          start: point,
          deltaX: 0,
          deltaY: 0,
        };
      } else {
        gestureRef.current = {
          mode: "swipe",
          distance: 0,
          scale: 1,
          position: null,
          pointer: point,
          start: point,
          deltaX: 0,
          deltaY: 0,
        };
      }
    },
    [isVideo, imagePosition]
  );

  const handleImagePointerMove = useCallback(
    (event) => {
      if (isVideo || !pointerMapRef.current.has(event.pointerId)) return;

      if (event.cancelable) event.preventDefault();

      pointerMapRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const pointers = [...pointerMapRef.current.values()];
      const gesture = gestureRef.current;

      if (pointers.length >= 2 && gesture.mode === "pinch") {
        if (!gesture.distance) return;

        const distance = getZoomDistance(pointers[0], pointers[1]);
        setZoom(gesture.scale * (distance / gesture.distance));
        return;
      }

      if (
        pointers.length === 1 &&
        gesture.mode === "pan" &&
        gesture.pointer &&
        gesture.position
      ) {
        const dx = event.clientX - gesture.pointer.x;
        const dy = event.clientY - gesture.pointer.y;

        setImagePosition({
          x: gesture.position.x + dx,
          y: gesture.position.y + dy,
        });
        return;
      }

      if (pointers.length === 1 && gesture.mode === "swipe" && gesture.start) {
        const dx = event.clientX - gesture.start.x;
        const dy = event.clientY - gesture.start.y;

        gesture.deltaX = dx;
        gesture.deltaY = dy;

        if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.08) {
          setSwipeOffset(clamp(dx, -window.innerWidth * 0.72, window.innerWidth * 0.72));
        }
      }
    },
    [isVideo, setZoom]
  );

  const handleImagePointerUp = useCallback(
    (event) => {
      if (isVideo) return;

      // Include the final pointer position. Some WebViews do not dispatch a
      // final pointermove before pointerup, which previously lost the swipe.
      if (pointerMapRef.current.has(event.pointerId)) {
        pointerMapRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }

      const gesture = gestureRef.current;
      const start = gesture.start;
      const deltaX = start ? event.clientX - start.x : gesture.deltaX;
      const deltaY = start ? event.clientY - start.y : gesture.deltaY;

      pointerMapRef.current.delete(event.pointerId);
      const remaining = [...pointerMapRef.current.values()];

      // A finger remains after a pinch: continue with a fresh one-finger mode.
      if (remaining.length === 1) {
        const point = remaining[0];

        if (imageScaleRef.current > 1) {
          gestureRef.current = {
            mode: "pan",
            distance: 0,
            scale: imageScaleRef.current,
            position: imagePosition,
            pointer: point,
            start: point,
            deltaX: 0,
            deltaY: 0,
          };
        } else {
          gestureRef.current = {
            mode: "swipe",
            distance: 0,
            scale: 1,
            position: null,
            pointer: point,
            start: point,
            deltaX: 0,
            deltaY: 0,
          };
        }
        return;
      }

      const isHorizontalSwipe =
        gesture.mode === "swipe" &&
        Math.abs(deltaX) >= Math.max(48, window.innerWidth * 0.12) &&
        Math.abs(deltaX) > Math.abs(deltaY) * 1.15;

      if (isHorizontalSwipe && galleryItems.length > 1) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 450);

        navigateGallery(deltaX < 0 ? 1 : -1);
      } else {
        setSwipeOffset(0);
      }

      gestureRef.current = {
        mode: "",
        distance: 0,
        scale: imageScaleRef.current,
        position: null,
        pointer: null,
        start: null,
        deltaX: 0,
        deltaY: 0,
      };
    },
    [isVideo, imagePosition, navigateGallery, galleryItems.length]
  );

  const handleImagePointerCancel = useCallback(
    (event) => {
      if (isVideo || !pointerMapRef.current.has(event.pointerId)) return;

      pointerMapRef.current.delete(event.pointerId);
      setSwipeOffset(0);

      const remaining = [...pointerMapRef.current.values()];
      if (remaining.length === 1) {
        const point = remaining[0];
        gestureRef.current = {
          mode: imageScaleRef.current > 1 ? "pan" : "swipe",
          distance: 0,
          scale: imageScaleRef.current,
          position: imagePosition,
          pointer: point,
          start: point,
          deltaX: 0,
          deltaY: 0,
        };
      } else {
        gestureRef.current = {
          mode: "",
          distance: 0,
          scale: imageScaleRef.current,
          position: null,
          pointer: null,
          start: null,
          deltaX: 0,
          deltaY: 0,
        };
      }
    },
    [isVideo, imagePosition]
  );

  const handleStageClick = useCallback((event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.target.closest?.("button, input, video")) return;
    setChromeVisible((previous) => !previous);
  }, []);

  const resetImage = useCallback(() => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
    setImageRotation(0);
    setSwipeOffset(0);
    imageScaleRef.current = 1;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Media actions: save, share, edit, show in chat, reply, delete
  |--------------------------------------------------------------------------
  */

  const handleDownload = useCallback(async () => {
    if (!attachment || menuLoading) return;

    setMenuLoading(true);
    setMenuError("");

    try {
      await downloadAttachment(attachment, { userId });
      setMenuOpen(false);
    } catch {
      setMenuError(
        english
          ? "Could not save this media."
          : "ذخیره رسانه ناموفق بود."
      );
    } finally {
      setMenuLoading(false);
    }
  }, [attachment, userId, menuLoading, english]);

  const handleShare = useCallback(async () => {
    if (!attachment || menuLoading) return;

    setMenuLoading(true);
    setMenuError("");

    try {
      let sharedFile = null;
      const sourceUrl = remote.url || fallbackSrc;

      if (sourceUrl) {
        const response = await fetch(sourceUrl);
        if (!response.ok) throw new Error("MEDIA_SHARE_FAILED");

        const blob = await response.blob();
        const filename =
          getFileName(attachment) ||
          (isVideo ? "video.mp4" : "image");

        sharedFile = new File([blob], filename, {
          type:
            blob.type ||
            (isVideo ? "video/mp4" : "image/jpeg"),
        });
      }

      if (
        sharedFile &&
        navigator.share &&
        navigator.canShare?.({ files: [sharedFile] })
      ) {
        await navigator.share({
          files: [sharedFile],
          title: sharedFile.name,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: getFileName(attachment) || "Media",
          text: senderName,
        });
      } else {
        await downloadAttachment(attachment, { userId });
      }

      setMenuOpen(false);
    } catch (error) {
      if (error?.name === "AbortError") {
        setMenuOpen(false);
        return;
      }

      setMenuError(
        english
          ? "Could not share this media."
          : "اشتراک‌گذاری رسانه ناموفق بود."
      );
    } finally {
      setMenuLoading(false);
    }
  }, [
    attachment,
    remote.url,
    fallbackSrc,
    isVideo,
    senderName,
    userId,
    menuLoading,
    english,
  ]);

  const dispatchMediaAction = useCallback(
    (action) => {
      window.dispatchEvent(
        new CustomEvent("telegraph:media-action", {
          detail: {
            action,
            messageId,
            conversationId,
            attachment,
          },
        })
      );

      setMenuOpen(false);
    },
    [messageId, conversationId, attachment]
  );

  const handleShowInChat = useCallback(() => {
    setMenuOpen(false);
    handleClose();

    if (!messageId) return;

    window.setTimeout(() => {
      const target = document.querySelector(
        `[data-message-id="${CSS.escape(String(messageId))}"]`
      );

      target?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 280);
  }, [messageId, handleClose]);

  const handleDelete = useCallback(async () => {
    if (!messageId || menuLoading) return;

    const confirmed = window.confirm(
      english ? "Delete this message?" : "این پیام حذف شود؟"
    );

    if (!confirmed) return;

    setMenuLoading(true);
    setMenuError("");

    try {
      const response = await apiFetch(
        `/api/messages/${encodeURIComponent(messageId)}`,
        { method: "DELETE" }
      );

      if (response?.success !== true) {
        throw new Error(response?.message || "حذف پیام ناموفق بود.");
      }

      window.dispatchEvent(
        new CustomEvent("telegraph:media-message-deleted", {
          detail: {
            messageId,
            conversationId,
          },
        })
      );

      setMenuOpen(false);
      handleClose();
    } catch (error) {
      setMenuError(
        error?.message ||
          (english
            ? "Could not delete this message."
            : "حذف پیام ناموفق بود.")
      );
    } finally {
      setMenuLoading(false);
    }
  }, [messageId, conversationId, menuLoading, english, handleClose]);

  const handleEdit = useCallback(() => {
    dispatchMediaAction("edit-media");
  }, [dispatchMediaAction]);

  /*
  |--------------------------------------------------------------------------
  | Android / browser Back handling
  |--------------------------------------------------------------------------
  */

  const handleViewerBack = useCallback(() => {
    if (closingRef.current) return;

    // First Back closes an open popup and restores the viewer history marker.
    if (menuOpen) {
      setMenuOpen(false);

      if (historyKey) {
        const currentState = window.history.state;

        if (currentState?.__telegraphMediaViewer !== historyKey) {
          try {
            window.history.pushState(
              {
                ...(currentState && typeof currentState === "object"
                  ? currentState
                  : {}),
                __telegraphMediaViewer: historyKey,
              },
              "",
              window.location.href
            );
          } catch {
            // The next Back can still be handled by the host application.
          }
        }
      }

      return;
    }

    handleClose();
  }, [menuOpen, historyKey, handleClose]);

  useEffect(() => {
    const handlePopState = () => handleViewerBack();

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [handleViewerBack]);

  /*
  |--------------------------------------------------------------------------
  | Video controls
  |--------------------------------------------------------------------------
  */

  const toggleVideoPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !remote.url) return;

    setVideoError("");

    if (!video.paused) {
      video.pause();
      return;
    }

    try {
      await video.play();
    } catch {
      setVideoPlaying(false);
      setVideoError(
        english ? "Playback could not start." : "پخش ویدئو شروع نشد."
      );
    }
  }, [remote.url, english]);

  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) setVideoCurrentTime(video.currentTime || 0);
  }, []);

  const handleVideoMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      setVideoDuration(video.duration);
    }
  }, []);

  const handleVideoSeek = useCallback(
    (event) => {
      const video = videoRef.current;
      if (!video) return;

      const nextTime = clamp(
        Number(event.target.value),
        0,
        videoDuration || 0
      );

      video.currentTime = nextTime;
      setVideoCurrentTime(nextTime);
    },
    [videoDuration]
  );

  const toggleVideoMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !videoMuted;
    video.muted = nextMuted;
    setVideoMuted(nextMuted);
  }, [videoMuted]);

  const handleVolumeChange = useCallback((event) => {
    const video = videoRef.current;
    if (!video) return;

    const nextVolume = clamp(Number(event.target.value), 0, 1);
    video.volume = nextVolume;
    video.muted = nextVolume === 0;

    setVideoVolume(nextVolume);
    setVideoMuted(nextVolume === 0);
  }, []);

  const changeVideoRate = useCallback(() => {
    const currentIndex = VIDEO_PLAYBACK_RATES.indexOf(videoRate);
    const nextRate =
      VIDEO_PLAYBACK_RATES[
        (currentIndex + 1) % VIDEO_PLAYBACK_RATES.length
      ];

    if (videoRef.current) videoRef.current.playbackRate = nextRate;
    setVideoRate(nextRate);
  }, [videoRate]);

  const toggleVideoFullscreen = useCallback(async () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    try {
      if (!document.fullscreenElement) {
        await viewer.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Fullscreen is optional in Android WebViews.
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setVideoFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const showVideoControls = useCallback(() => {
    setVideoControlsVisible(true);

    if (videoControlsTimerRef.current !== null) {
      window.clearTimeout(videoControlsTimerRef.current);
    }

    if (videoPlaying) {
      videoControlsTimerRef.current = window.setTimeout(() => {
        setVideoControlsVisible(false);
      }, 3500);
    }
  }, [videoPlaying]);

  useEffect(() => {
    return () => {
      if (videoControlsTimerRef.current !== null) {
        window.clearTimeout(videoControlsTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    setVideoPlaying(false);
    setVideoBuffering(false);
    setVideoDuration(0);
    setVideoCurrentTime(0);
    setVideoError("");
    setVideoRate(1);
    setVideoControlsVisible(true);

    if (video) {
      video.pause();
      video.currentTime = 0;
      video.playbackRate = 1;
    }
  }, [activeItem.registryId, remote.url]);

  /*
  |--------------------------------------------------------------------------
  | Keyboard shortcuts
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Escape") {
        if (menuOpen) {
          setMenuOpen(false);
          return;
        }

        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
          return;
        }

        handleClose();
        return;
      }

      if (!isVideo) {
        if (event.key === "0") resetImage();
        if (event.key === "+" || event.key === "=") {
          setZoom(imageScaleRef.current + 0.25);
        }
        if (event.key === "-") {
          setZoom(imageScaleRef.current - 0.25);
        }
        if (event.key.toLowerCase() === "r") {
          setImageRotation((previous) => (previous + 90) % 360);
        }

        if (event.key === "ArrowRight") navigateGallery(-1);
        if (event.key === "ArrowLeft") navigateGallery(1);
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      if (event.code === "Space") {
        event.preventDefault();
        void toggleVideoPlayback();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        video.currentTime = Math.min(
          video.duration || 0,
          video.currentTime + 5
        );
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
      }

      if (event.key.toLowerCase() === "m") toggleVideoMute();
      if (event.key.toLowerCase() === "f") toggleVideoFullscreen();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    menuOpen,
    isVideo,
    handleClose,
    resetImage,
    setZoom,
    navigateGallery,
    toggleVideoPlayback,
    toggleVideoMute,
    toggleVideoFullscreen,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Menu dismissal, scroll lock and cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!menuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (
        menuRef.current?.contains(event.target) ||
        menuButtonRef.current?.contains(event.target)
      ) {
        return;
      }

      setMenuOpen(false);
    };

    const handleMenuEscape = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleMenuEscape, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleMenuEscape, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Menu actions
  |--------------------------------------------------------------------------
  */

  const menuItems = [
    {
      action: "save",
      icon: Download,
      label: english ? "Save to Gallery" : "ذخیره در گالری",
    },
    {
      action: "all",
      icon: Grid2X2,
      label: english ? "Show All Media" : "نمایش همه رسانه‌ها",
    },
    {
      action: "chat",
      icon: Eye,
      label: english ? "Show in chat" : "نمایش در گفتگو",
    },
    {
      action: "sticker",
      icon: Smile,
      label: english ? "Create Sticker" : "ساخت استیکر",
    },
    {
      action: "reply",
      icon: Reply,
      label: english ? "Reply" : "پاسخ",
    },
    {
      action: "share",
      icon: Share2,
      label: english ? "Share" : "اشتراک‌گذاری",
    },
    {
      action: "delete",
      icon: Trash2,
      label: english ? "Delete" : "حذف",
      danger: true,
    },
  ];

  const handleMenuAction = useCallback(
    (action) => {
      switch (action) {
        case "save":
          void handleDownload();
          break;
        case "all":
          dispatchMediaAction("show-all-media");
          break;
        case "chat":
          handleShowInChat();
          break;
        case "sticker":
          dispatchMediaAction("create-sticker");
          break;
        case "reply":
          dispatchMediaAction("reply");
          break;
        case "share":
          void handleShare();
          break;
        case "delete":
          void handleDelete();
          break;
        default:
          break;
      }
    },
    [
      handleDownload,
      dispatchMediaAction,
      handleShowInChat,
      handleShare,
      handleDelete,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  const galleryCount = galleryItems.length;

  return createPortal(
    <div
      ref={viewerRef}
      className="
        fixed inset-0 z-[200]
        h-[100dvh] w-full overflow-hidden
        bg-black text-white select-none
      "
      dir="ltr"
      style={{
        transformOrigin: "top left",
        contain: "layout paint size",
        WebkitTapHighlightColor: "transparent",
        fontSynthesis: "none",
        textRendering: "optimizeLegibility",
      }}
      onClick={stop}
    >
      {/* The native Android status/navigation bars remain system-owned. */}

      {/* Media stage */}

      <main
        ref={stageRef}
        className="
          absolute inset-x-0 overflow-hidden bg-black
          flex items-center justify-center
        "
        style={{
          top: "env(safe-area-inset-top, 0px)",
          bottom: "env(safe-area-inset-bottom, 0px)",
          touchAction: isVideo ? "auto" : "none",
          overscrollBehavior: "contain",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        onWheel={handleImageWheel}
        onPointerDown={handleImagePointerDown}
        onPointerMove={handleImagePointerMove}
        onPointerUp={handleImagePointerUp}
        onPointerCancel={handleImagePointerCancel}
        onLostPointerCapture={handleImagePointerCancel}
        onClick={handleStageClick}
        onDoubleClick={(event) => {
          if (isVideo) return;
          event.stopPropagation();
          setZoom(imageScale > 1 ? 1 : 2.5);
        }}
      >
        {/* Image */}

        {!isVideo && mediaSrc && (
          <img
            ref={imageRef}
            key={activeItem.registryId || activeIndex}
            src={mediaSrc}
            alt={getFileName(attachment)}
            draggable={false}
            className="
              pointer-events-none absolute inset-0
              h-full w-full object-contain
              will-change-transform
            "
            style={{
              transform: `translate3d(${imagePosition.x + swipeOffset}px, ${imagePosition.y}px, 0) scale(${imageScale}) rotate(${imageRotation}deg)`,
              transition:
                pointerMapRef.current.size > 0
                  ? "none"
                  : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitUserDrag: "none",
            }}
          />
        )}

        {/* Video */}

        {isVideo && remote.url && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black"
            onPointerMove={showVideoControls}
            onClick={showVideoControls}
          >
            <video
              ref={videoRef}
              src={remote.url}
              playsInline
              preload="auto"
              className="max-h-full max-w-full object-contain outline-none"
              onClick={(event) => {
                stop(event);
                void toggleVideoPlayback();
                showVideoControls();
              }}
              onLoadedMetadata={handleVideoMetadata}
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={() => {
                setVideoPlaying(true);
                setVideoBuffering(false);
                showVideoControls();
              }}
              onPause={() => setVideoPlaying(false)}
              onWaiting={() => setVideoBuffering(true)}
              onPlaying={() => setVideoBuffering(false)}
              onCanPlay={() => setVideoBuffering(false)}
              onEnded={() => setVideoPlaying(false)}
              onError={() => {
                setVideoError(
                  english
                    ? "Video playback failed."
                    : "پخش ویدئو ناموفق بود."
                );
              }}
            />

            {!videoPlaying && !videoBuffering && (
              <button
                type="button"
                onClick={(event) => {
                  stop(event);
                  void toggleVideoPlayback();
                }}
                className="
                  absolute left-1/2 top-1/2
                  flex h-[66px] w-[66px]
                  -translate-x-1/2 -translate-y-1/2
                  items-center justify-center rounded-full
                  border border-white/20 bg-black/55
                  text-white shadow-xl backdrop-blur-md
                  transition-transform hover:scale-105 active:scale-90
                "
                aria-label={english ? "Play video" : "پخش ویدئو"}
              >
                <Play
                  size={30}
                  fill="currentColor"
                  strokeWidth={0}
                  className="ml-[3px]"
                />
              </button>
            )}

            {videoBuffering && (
              <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-[54px] w-[54px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/55">
                <LoaderCircle size={29} className="animate-spin" />
              </div>
            )}

            {videoError && (
              <div className="absolute bottom-[90px] left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-4 py-2 text-[12px] text-white/85">
                {videoError}
              </div>
            )}

            {/* Video controls */}

            <div
              className={`
                absolute inset-x-0 bottom-0 z-20
                bg-gradient-to-t from-black/90 via-black/60 to-transparent
                px-[18px] pt-[55px]
                pb-[max(20px,env(safe-area-inset-bottom))]
                transition-opacity duration-200
                ${
                  videoControlsVisible
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }
              `}
              onClick={stop}
              onPointerDown={stop}
            >
              <div className="mb-[14px] flex items-center gap-[9px]">
                <span className="min-w-[42px] text-[11px] tabular-nums text-white/80">
                  {formatDuration(videoCurrentTime)}
                </span>

                <input
                  type="range"
                  min="0"
                  max={videoDuration || 0}
                  step="0.1"
                  value={Math.min(videoCurrentTime, videoDuration || 0)}
                  disabled={!videoDuration}
                  onChange={handleVideoSeek}
                  className="h-[4px] min-w-0 flex-1 cursor-pointer accent-white disabled:opacity-40"
                  aria-label={english ? "Video position" : "موقعیت ویدئو"}
                />

                <span className="min-w-[42px] text-right text-[11px] tabular-nums text-white/80">
                  {formatDuration(videoDuration)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[15px]">
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    className="flex h-[40px] w-[40px] items-center justify-center rounded-full text-white hover:bg-white/10"
                    aria-label={
                      videoPlaying
                        ? english
                          ? "Pause"
                          : "توقف"
                        : english
                          ? "Play"
                          : "پخش"
                    }
                  >
                    {videoPlaying ? (
                      <Pause size={23} fill="currentColor" />
                    ) : (
                      <Play size={23} fill="currentColor" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={toggleVideoMute}
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-white/90 hover:bg-white/10"
                    aria-label={videoMuted ? "Unmute" : "Mute"}
                  >
                    {videoMuted || videoVolume === 0 ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={videoMuted ? 0 : videoVolume}
                    onChange={handleVolumeChange}
                    className="hidden w-[75px] cursor-pointer accent-white sm:block"
                    aria-label="Volume"
                  />
                </div>

                <div className="flex items-center gap-[12px]">
                  <button
                    type="button"
                    onClick={changeVideoRate}
                    className="
                      flex h-[34px] min-w-[49px] items-center justify-center
                      rounded-full bg-white/[0.12] px-[9px]
                      text-[12px] font-semibold tabular-nums text-white
                      hover:bg-white/[0.2]
                    "
                  >
                    {videoRate}×
                  </button>

                  <button
                    type="button"
                    onClick={toggleVideoFullscreen}
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full text-white hover:bg-white/10"
                    aria-label={
                      videoFullscreen ? "Exit fullscreen" : "Fullscreen"
                    }
                  >
                    {videoFullscreen ? (
                      <X size={21} />
                    ) : (
                      <span className="text-[21px]">⛶</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}

        {remote.loading && !mediaSrc && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
            <LoaderCircle size={32} className="animate-spin text-white/70" />
          </div>
        )}

        {/* Loading error */}

        {remote.error && !mediaSrc && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[12px] bg-black px-5 text-center">
            <AlertCircle size={34} className="text-white/45" />

            <p className="text-[13px] text-white/70">
              {english
                ? "Could not load this media."
                : "بارگذاری رسانه ناموفق بود."}
            </p>

            <button
              type="button"
              onClick={() => remote.refresh(true)}
              className="rounded-full bg-white/10 px-5 py-2 text-[12px] text-white hover:bg-white/15"
            >
              {english ? "Try again" : "تلاش مجدد"}
            </button>
          </div>
        )}
      </main>

      {/* Reference-style translucent header */}

      <ViewerHeader
        senderName={senderName}
        createdAt={createdAt}
        language={language}
        onClose={handleClose}
        onEdit={handleEdit}
        onShare={() => void handleShare()}
        onToggleMenu={toggleMenu}
        menuOpen={menuOpen}
        menuButtonRef={menuButtonRef}
        visible={chromeVisible}
      />

      {/* Gallery counter */}

      {galleryCount > 1 && (
        <div
          className="
            pointer-events-none absolute left-1/2 z-[25]
            -translate-x-1/2 rounded-full
            bg-[rgba(24,24,24,0.62)]
            px-[11px] py-[4px]
            text-[13px] font-semibold leading-[18px] tracking-[0.1px]
            text-white shadow-[0_1px_5px_rgba(0,0,0,0.16)]
            backdrop-blur-[4px]
          "
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 68px)",
            opacity: chromeVisible ? 1 : 0,
            transform: `translateX(-50%) translateY(${chromeVisible ? "0" : "-8px"})`,
            transition: "opacity 180ms ease, transform 220ms ease",
          }}
        >
          {activeIndex + 1} {english ? "of" : "از"} {galleryCount}
        </div>
      )}

      {/* Popup backdrop */}

      {menuOpen && (
        <div
          className="fixed inset-0 z-[40]"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Popup menu, positioned directly below the top toolbar */}

      <div
        ref={menuRef}
        dir="ltr"
        aria-hidden={!menuOpen}
        className={`
          fixed z-[100]
          right-[10px]
          flex w-[218px] max-w-[calc(100vw-20px)]
          flex-col gap-[11px]
          overflow-hidden rounded-[6px]
          border border-white/[0.06]
          px-[11px] py-[12px]
          shadow-[0_8px_24px_rgba(0,0,0,0.38)]
          origin-top-right
          transition-all duration-200 ease-out
          ${
            menuOpen
              ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
              : "translate-y-[-7px] scale-95 opacity-0 pointer-events-none"
          }
        `}
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 60px)",
          backgroundColor: menuBackground,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        onClick={stop}
      >
        {menuItems.map((item) => (
          <ViewerMenuItem
            key={item.action}
            icon={item.icon}
            label={item.label}
            danger={item.danger}
            language={language}
            disabled={menuLoading}
            onClick={() => handleMenuAction(item.action)}
          />
        ))}

        {menuLoading && (
          <div className="flex items-center justify-center pt-[2px]">
            <LoaderCircle size={19} className="animate-spin text-white/75" />
          </div>
        )}

        {menuError && (
          <p className="text-[11px] leading-5 text-red-300">{menuError}</p>
        )}
      </div>
    </div>,
    document.body
  );
}

/*
|--------------------------------------------------------------------------
| Visual attachment thumbnail
|--------------------------------------------------------------------------
*/

function VisualAttachment({
  info,
  attachment,
  localSrc,
  userId,
  upload,
  isDark,
  language,
  senderName,
  createdAt,
  messageId,
  conversationId,
  onCancel,
  onRetry,
}) {
  const ref = useRef(null);
  const inView = useInView(ref);
  const retriedRef = useRef(false);
  const registryIdRef = useRef(null);

  if (!registryIdRef.current) {
    visualAttachmentSequence += 1;
    registryIdRef.current = `telegraph-visual-${visualAttachmentSequence}`;
  }

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerHistoryKey, setViewerHistoryKey] = useState("");
  const [viewerItems, setViewerItems] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [viewerInitialRect, setViewerInitialRect] = useState(null);
  const viewerOpenRef = useRef(false);

  const isVideo = info.kind === "video";
  const busy = Boolean(upload) && upload.status !== "sent";
  const canOpen = !busy && Boolean(attachment);

  // Image previews are cached persistently. Videos use short-lived URLs.
  const remote = useMediaUrl(attachment, {
    enabled: !localSrc && Boolean(attachment) && inView,
    userId,
    persistent: !isVideo,
  });

  const box = getMediaBoxSize(info.width, info.height);
  const videoPreview = isVideo && !localSrc && remote.url;
  const imageSrc = localSrc || (!isVideo ? remote.url : "");

  useEffect(() => {
    if (!canOpen || !attachment) return undefined;

    const entry = {
      registryId: registryIdRef.current,
      node: ref.current,
      attachment,
      kind: info.kind,
      fallbackSrc: localSrc,
      userId,
      language,
      senderName,
      createdAt,
      messageId,
      conversationId,
    };

    mountedVisualAttachments.set(entry.registryId, entry);

    return () => {
      const registered = mountedVisualAttachments.get(entry.registryId);
      if (registered === entry) {
        mountedVisualAttachments.delete(entry.registryId);
      }
    };
  }, [
    canOpen,
    attachment,
    info.kind,
    localSrc,
    userId,
    language,
    senderName,
    createdAt,
    messageId,
    conversationId,
  ]);

  const handleOpen = useCallback(
    (event) => {
      if (!canOpen || viewerOpenRef.current) return;
      event.stopPropagation();

      viewerOpenRef.current = true;

      const currentEntry = {
        registryId: registryIdRef.current,
        node: ref.current,
        attachment,
        kind: info.kind,
        fallbackSrc: localSrc,
        userId,
        language,
        senderName,
        createdAt,
        messageId,
        conversationId,
      };

      const gallery = collectGalleryItems(currentEntry);
      const currentIndex = Math.max(
        0,
        gallery.findIndex(
          (item) => item.registryId === currentEntry.registryId
        )
      );

      const rect = ref.current?.getBoundingClientRect();
      const sourceRect = rect
        ? {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }
        : null;

      const historyKey =
        `telegraph-media-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      try {
        const currentState = window.history.state;

        window.history.pushState(
          {
            ...(currentState && typeof currentState === "object"
              ? currentState
              : {}),
            __telegraphMediaViewer: historyKey,
          },
          "",
          window.location.href
        );

        setViewerHistoryKey(historyKey);
      } catch {
        setViewerHistoryKey("");
      }

      setViewerItems(gallery);
      setViewerInitialIndex(currentIndex);
      setViewerInitialRect(sourceRect);
      setViewerOpen(true);
    },
    [
      canOpen,
      attachment,
      info.kind,
      localSrc,
      userId,
      language,
      senderName,
      createdAt,
      messageId,
      conversationId,
    ]
  );

  const closeViewer = useCallback(() => {
    viewerOpenRef.current = false;
    setViewerOpen(false);
    setViewerHistoryKey("");
    setViewerItems([]);
    setViewerInitialIndex(0);
    setViewerInitialRect(null);
  }, []);

  return (
    <div
      ref={ref}
      onClick={handleOpen}
      data-telegraph-media-item=""
      className={`
        group relative block w-full overflow-hidden
        ${canOpen ? "cursor-pointer" : ""}
      `}
      style={{
        aspectRatio: box.ratio,
        backgroundColor: isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.06)",
      }}
    >
      {videoPreview ? (
        <video
          src={`${remote.url}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      ) : imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          draggable={false}
          onError={() => {
            if (!localSrc && !retriedRef.current) {
              retriedRef.current = true;
              remote.refresh(true);
            }
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white/40">
          {remote.loading ? (
            <LoaderCircle size={24} className="animate-spin" />
          ) : (
            <AlertCircle size={22} />
          )}
        </div>
      )}

      {/* Video duration */}

      {isVideo && (
        <span
          dir="ltr"
          className="
            pointer-events-none absolute left-[6px] top-[6px]
            inline-flex items-center rounded-full
            bg-black/60 px-[7px] py-[3px]
            text-[11.5px] font-medium leading-[14px]
            text-white backdrop-blur-sm
          "
        >
          {info.duration ? formatDuration(info.duration) : "Video"}
        </span>
      )}

      {/* Play / upload state */}

      <div className="absolute inset-0 flex items-center justify-center">
        {busy ? (
          <UploadProgressRing
            status={upload.status}
            progress={upload.progress}
            onCancel={onCancel}
            onRetry={onRetry}
            size={52}
            background="rgba(0,0,0,0.58)"
          />
        ) : isVideo && canOpen ? (
          <span
            className="
              flex h-[48px] w-[48px] items-center justify-center
              rounded-full bg-black/55 text-white shadow-lg
              backdrop-blur-sm transition-transform duration-200
              group-hover:scale-110
            "
          >
            <Play
              size={24}
              fill="currentColor"
              strokeWidth={0}
              className="ml-[2px]"
            />
          </span>
        ) : null}
      </div>

      {/* Fullscreen viewer */}

      {viewerOpen && (
        <MediaViewer
          items={viewerItems}
          initialIndex={viewerInitialIndex}
          initialRect={viewerInitialRect}
          historyKey={viewerHistoryKey}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Generic file attachment
|--------------------------------------------------------------------------
*/

function FileAttachment({
  info,
  attachment,
  localSrc,
  userId,
  upload,
  language,
  accent,
  mutedClass,
  onCancel,
  onRetry,
}) {
  const busy = Boolean(upload) && upload.status !== "sent";
  const extension = getFileExtension(info.fileName);

  const subtitle = busy
    ? getUploadSubtitle({ upload, info, language })
    : [extension.toUpperCase(), formatFileSize(info.size, language)]
        .filter(Boolean)
        .join(" • ");

  const failed = upload?.status === "failed";

  const open = async (event) => {
    event.stopPropagation();
    if (busy || !attachment) return;

    try {
      await downloadAttachment(attachment, { userId });
    } catch {
      // Download errors are intentionally kept local to this attachment.
    }
  };

  return (
    <div
      dir="ltr"
      onClick={open}
      className={`
        relative flex min-w-0 items-center gap-[12px]
        overflow-hidden px-[10px] pb-[4px] pt-[10px]
        ${!busy && attachment ? "cursor-pointer" : ""}
      `}
    >
      <span
        className="
          relative flex h-[48px] w-[48px] shrink-0
          items-center justify-center overflow-hidden
          rounded-[12px] text-white
        "
        style={{ backgroundColor: accent }}
      >
        {localSrc ? (
          <img
            src={localSrc}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <FileText size={24} strokeWidth={1.8} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          dir="auto"
          className="block truncate text-[14.5px] font-medium leading-[19px]"
        >
          {info.fileName || (language === "english" ? "File" : "فایل")}
        </span>

        <span
          dir="auto"
          className={`
            block truncate text-[12.5px] leading-[16px]
            ${failed ? "text-[#ff3b30]" : mutedClass}
          `}
        >
          {subtitle ||
            [extension.toUpperCase(), formatFileSize(info.size, language)]
              .filter(Boolean)
              .join(" • ")}
        </span>
      </span>

      {busy && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
          <UploadProgressRing
            status={upload.status}
            progress={upload.progress}
            onCancel={onCancel}
            onRetry={onRetry}
            size={54}
            background="rgba(0,0,0,0.72)"
          />
        </span>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Audio / music attachment
|--------------------------------------------------------------------------
*/

function AudioAttachment({
  info,
  attachment,
  userId,
  upload,
  language,
  accent,
  mutedClass,
  onCancel,
  onRetry,
}) {
  const audioRef = useRef(null);
  const objectUrlRef = useRef("");
  const requestSequenceRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const busy = Boolean(upload) && upload.status !== "sent";
  const failed = upload?.status === "failed";

  useEffect(() => {
    const audio = audioRef.current;

    requestSequenceRef.current += 1;
    setPlaying(false);
    setLoading(false);

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    return () => {
      requestSequenceRef.current += 1;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = "";
      }
    };
  }, [attachment?.url, userId]);

  const toggle = async (event) => {
    event.stopPropagation();

    const audio = audioRef.current;
    if (!audio || busy || !attachment || loading) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      if (!audio.src) {
        const requestId = ++requestSequenceRef.current;
        setLoading(true);

        const { fetchMediaBlob } = await import("@/lib/mediaHooks");
        const blob = await fetchMediaBlob(attachment, {
          userId,
          cache: true,
          compressImage: false,
        });

        const objectUrl = URL.createObjectURL(blob);

        if (requestId !== requestSequenceRef.current) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        objectUrlRef.current = objectUrl;
        audio.src = objectUrl;
        audio.load();
      }

      await audio.play();
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  };

  const subtitle = busy
    ? getUploadSubtitle({ upload, info, language })
    : [
        info.duration ? formatDuration(info.duration) : "",
        formatFileSize(info.size, language),
      ]
        .filter(Boolean)
        .join(" • ");

  return (
    <div
      dir="ltr"
      className="
        relative flex min-w-0 items-center gap-[12px]
        overflow-hidden px-[10px] pb-[4px] pt-[10px]
      "
    >
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <span
        className="
          flex h-[48px] w-[48px] shrink-0
          items-center justify-center overflow-hidden
          rounded-full text-white
        "
        style={{ backgroundColor: accent }}
      >
        <button
          type="button"
          onPointerDown={stop}
          onClick={toggle}
          disabled={busy || !attachment || loading}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-full w-full items-center justify-center disabled:cursor-default"
        >
          {loading ? (
            <LoaderCircle size={22} className="animate-spin" />
          ) : playing ? (
            <Pause size={22} fill="currentColor" strokeWidth={0} />
          ) : attachment ? (
            <Play
              size={22}
              fill="currentColor"
              strokeWidth={0}
              className="ml-[2px]"
            />
          ) : (
            <Music size={22} />
          )}
        </button>
      </span>

      <span className="min-w-0 flex-1">
        <span
          dir="auto"
          className="block truncate text-[14.5px] font-medium leading-[19px]"
        >
          {info.fileName || (language === "english" ? "Music" : "آهنگ")}
        </span>

        <span
          dir="auto"
          className={`
            block truncate text-[12.5px] leading-[16px]
            ${failed ? "text-[#ff3b30]" : mutedClass}
          `}
        >
          {subtitle}
        </span>
      </span>

      {busy && (
        <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/25">
          <UploadProgressRing
            status={upload.status}
            progress={upload.progress}
            onCancel={onCancel}
            onRetry={onRetry}
            size={54}
            background="rgba(0,0,0,0.72)"
          />
        </span>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Attachment entry
|--------------------------------------------------------------------------
*/

function AttachmentView({
  attachment = null,
  local = null,
  upload = null,

  userId = "",
  language = "english",

  senderName = "",
  createdAt = null,

  messageId = "",
  conversationId = "",

  onCancel,
  onRetry,
}) {
  const { theme, isDark } = useTheme();

  const source = local || attachment || {};

  const info = {
    kind: local?.kind ?? attachment?.type ?? "file",
    fileName: source.fileName || "",
    size: Number(source.size) || 0,
    width: source.width,
    height: source.height,
    duration: source.duration,
  };

  const localSrc = local?.previewUrl || getLocalPreview(attachment?.url);

  const accent = theme === "blue" ? "#1278e6" : "#d93636";
  const mutedClass = isDark ? "text-white/60" : "text-black/50";

  if (info.kind === "image" || info.kind === "video") {
    return (
      <VisualAttachment
        info={info}
        attachment={attachment}
        localSrc={localSrc}
        userId={userId}
        upload={upload}
        isDark={isDark}
        language={language}
        senderName={senderName}
        createdAt={createdAt}
        messageId={messageId}
        conversationId={conversationId}
        onCancel={onCancel}
        onRetry={onRetry}
      />
    );
  }

  if (info.kind === "audio") {
    return (
      <AudioAttachment
        info={info}
        attachment={attachment}
        userId={userId}
        upload={upload}
        language={language}
        accent={accent}
        mutedClass={mutedClass}
        onCancel={onCancel}
        onRetry={onRetry}
      />
    );
  }

  return (
    <FileAttachment
      info={info}
      attachment={attachment}
      localSrc={localSrc}
      userId={userId}
      upload={upload}
      language={language}
      accent={accent}
      mutedClass={mutedClass}
      onCancel={onCancel}
      onRetry={onRetry}
    />
  );
}

export default memo(AttachmentView);
