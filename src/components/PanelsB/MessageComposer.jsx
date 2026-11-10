"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import EmojiPicker from "emoji-picker-react";
import {
  Mic,
  X,
  Pencil,
  Reply,
  Square,
  LoaderCircle,
  Paperclip,
  Trash2,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFaceSmile } from "@fortawesome/free-regular-svg-icons";

import { apiFetch } from "@/lib/api";
import { enqueueUploads } from "@/lib/uploadQueue";
import AttachmentSheet from "./AttachmentSheet";

const MAX_RECORDING_SECONDS = 600;
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const AUDIO_BITRATE = 64000;
const RECORDING_TIMESLICE_MS = 1000;

// Telegram waveform metrics: 2px bars, 1px gap, silence is drawn as dots.
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const BAR_MIN_HEIGHT = 2;
const FALLBACK_BAR_COUNT = 40;

const RECORD_RED = "#ff3b30";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function getSenderName(message, language) {
  const sender = message?.sender;

  if (sender && typeof sender === "object") {
    const fullName = [sender.firstName, sender.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) return fullName;
    if (sender.username) return `@${sender.username}`;
  }

  return language === "english" ? "Message" : "پیام";
}

function formatDuration(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

// Telegram shows the recording timer with tenths of a second: 0:05,3
function formatRecordingClock(milliseconds) {
  const tenths = Math.max(0, Math.floor((Number(milliseconds) || 0) / 100));
  const totalSeconds = Math.floor(tenths / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")},${tenths % 10}`;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function withAlpha(hex, alpha) {
  const normalized = String(hex).replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const value = parseInt(expanded, 16);

  if (!Number.isFinite(value)) return hex;

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

// Resamples the recorded waveform to the number of bars that fit the
// available width and normalizes it so the loudest bar reaches full height.
function buildBarHeights(samples, count, maxHeight, minHeight = BAR_MIN_HEIGHT) {
  const total = Math.max(1, Math.floor(count));
  const range = Math.max(0, maxHeight - minHeight);
  const toEven = (height) => Math.max(minHeight, Math.round(height / 2) * 2);
  const values = Array.isArray(samples)
    ? samples
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map(clamp01)
    : [];

  if (!values.length) {
    return Array.from({ length: total }, (_, index) => {
      const rhythm = Math.abs(
        Math.sin((index + 1) * 1.37) * Math.cos((index + 1) * 0.41)
      );
      return toEven(minHeight + (0.18 + rhythm * 0.82) * range);
    });
  }

  let peak = 0;
  for (const value of values) peak = Math.max(peak, value);
  const gain = peak > 0.04 ? 1 / peak : 1;

  const heights = [];
  for (let index = 0; index < total; index += 1) {
    let level;

    if (values.length >= total) {
      const start = Math.floor((index * values.length) / total);
      const end = Math.max(
        start + 1,
        Math.floor(((index + 1) * values.length) / total)
      );
      let bucketPeak = 0;

      for (let cursor = start; cursor < Math.min(end, values.length); cursor += 1) {
        bucketPeak = Math.max(bucketPeak, values[cursor]);
      }

      level = bucketPeak;
    } else {
      const position = ((index + 0.5) * values.length) / total - 0.5;
      const lower = Math.max(0, Math.floor(position));
      const upper = Math.min(values.length - 1, Math.ceil(position));
      const mix = clamp01(position - lower);
      level = values[lower] * (1 - mix) + values[Math.max(0, upper)] * mix;
    }

    heights.push(toEven(minHeight + clamp01(level * gain) * range));
  }

  return heights;
}

function normalizeMimeType(value) {
  return String(value || "audio/webm")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

function getSupportedRecordingType() {
  if (typeof MediaRecorder === "undefined") return "";

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/ogg;codecs=opus",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/webm",
    "audio/ogg",
  ];

  return candidates.find((type) => {
    try {
      return MediaRecorder.isTypeSupported(type);
    } catch {
      return false;
    }
  }) || "";
}

function getFileExtension(mimeType) {
  switch (normalizeMimeType(mimeType)) {
    case "audio/ogg":
      return "ogg";
    case "audio/mp4":
      return "m4a";
    case "audio/mpeg":
      return "mp3";
    default:
      return "webm";
  }
}

function getId(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }
  return String(value);
}

function getRecordingErrorMessage(error, language) {
  const english = language === "english";
  switch (error?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return english
        ? "Microphone permission was denied. Allow microphone access and try again."
        : "دسترسی میکروفون رد شد. اجازهٔ استفاده از میکروفون را بدهید و دوباره تلاش کنید.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return english
        ? "No microphone was found on this device."
        : "میکروفونی در این دستگاه پیدا نشد.";
    case "NotReadableError":
    case "TrackStartError":
      return english
        ? "The microphone is busy or unavailable. Close other apps using it and try again."
        : "میکروفون مشغول یا در دسترس نیست. برنامه‌های دیگرِ استفاده‌کننده از میکروفون را ببندید و دوباره تلاش کنید.";
    case "NotSupportedError":
      return english
        ? "This browser cannot record audio in a supported format. Try an up-to-date browser."
        : "این مرورگر نمی‌تواند صدا را با قالب پشتیبانی‌شده ضبط کند. مرورگر را به‌روز یا از مرورگر دیگری استفاده کنید.";
    default:
      return english
        ? "Could not start recording. Check microphone access and try again."
        : "شروع ضبط صدا ممکن نشد. دسترسی میکروفون را بررسی و دوباره تلاش کنید.";
  }
}

function getEmojiPickerStyle(isDark, accent) {
  const shared = {
    "--epr-picker-border-radius": "18px",
    "--epr-horizontal-padding": "12px",
    "--epr-emoji-size": "29px",
    "--epr-emoji-padding": "14px",
    "--epr-search-input-border-radius": "12px",
    "--epr-search-input-height": "38px",
    "--epr-category-navigation-button-size": "32px",
    "--epr-category-label-height": "34px",
    "--epr-preview-height": "0px",
    "--epr-skin-tone-size": "18px",
    "--epr-highlight-color": accent,
    "--epr-category-icon-active-color": accent,
    "--epr-search-border-color-active": withAlpha(accent, 0.5),
  };

  if (isDark) {
    return {
      ...shared,
      "--epr-bg-color": "transparent",
      "--epr-dark-bg-color": "transparent",
      "--epr-text-color": "rgba(255,255,255,0.84)",
      "--epr-dark-text-color": "rgba(255,255,255,0.84)",
      "--epr-picker-border-color": "transparent",
      "--epr-dark-picker-border-color": "transparent",
      "--epr-hover-bg-color": "rgba(255,255,255,0.08)",
      "--epr-focus-bg-color": "rgba(255,255,255,0.09)",
      "--epr-search-input-bg-color": "rgba(255,255,255,0.06)",
      "--epr-search-input-bg-color-active": "rgba(255,255,255,0.08)",
      "--epr-search-input-text-color": "#ffffff",
      "--epr-search-input-placeholder-color": "rgba(255,255,255,0.4)",
      "--epr-search-border-color": "rgba(255,255,255,0.06)",
      "--epr-search-icon-color": "rgba(255,255,255,0.45)",
      "--epr-category-label-bg-color": "rgba(28,29,34,0.94)",
      "--epr-category-label-text-color": "rgba(255,255,255,0.55)",
      "--epr-skin-tone-picker-menu-color": "rgba(36,37,43,0.98)",
    };
  }

  return {
    ...shared,
    "--epr-bg-color": "transparent",
    "--epr-dark-bg-color": "transparent",
    "--epr-text-color": "rgba(0,0,0,0.82)",
    "--epr-dark-text-color": "rgba(0,0,0,0.82)",
    "--epr-picker-border-color": "transparent",
    "--epr-dark-picker-border-color": "transparent",
    "--epr-hover-bg-color": "rgba(0,0,0,0.055)",
    "--epr-focus-bg-color": "rgba(0,0,0,0.065)",
    "--epr-search-input-bg-color": "rgba(0,0,0,0.05)",
    "--epr-search-input-bg-color-active": "rgba(0,0,0,0.065)",
    "--epr-search-input-text-color": "#202a3c",
    "--epr-search-input-placeholder-color": "rgba(0,0,0,0.42)",
    "--epr-search-border-color": "rgba(0,0,0,0.05)",
    "--epr-search-icon-color": "rgba(0,0,0,0.42)",
    "--epr-category-label-bg-color": "rgba(255,255,255,0.95)",
    "--epr-category-label-text-color": "rgba(0,0,0,0.5)",
    "--epr-skin-tone-picker-menu-color": "#ffffff",
  };
}

function PlayGlyph({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8.2 5.9v12.2L18.6 12z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PauseGlyph({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="5.8" y="4.5" width="4.4" height="15" rx="1.5" fill="currentColor" />
      <rect x="13.8" y="4.5" width="4.4" height="15" rx="1.5" fill="currentColor" />
    </svg>
  );
}

function SendGlyph({ size = 22 }) {
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

function AlertGlyph({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.6v5.4" />
      <path d="M12 16.4h.01" />
    </svg>
  );
}

const Waveform = memo(function Waveform({
  samples,
  progress = 0,
  activeColor,
  idleColor,
  height = 26,
}) {
  const containerRef = useRef(null);
  const [count, setCount] = useState(FALLBACK_BAR_COUNT);

  useIsomorphicLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const measure = () => {
      const width = node.clientWidth;
      if (width > 0) {
        setCount(
          Math.max(8, Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP)))
        );
      }
    };

    measure();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const heights = useMemo(
    () => buildBarHeights(samples, count, height),
    [samples, count, height]
  );

  const clamped = clamp01(progress);

  const renderBars = (color) =>
    heights.map((barHeight, index) => (
      <span
        key={index}
        className="shrink-0 rounded-full"
        style={{
          width: `${BAR_WIDTH}px`,
          height: `${barHeight}px`,
          backgroundColor: color,
        }}
      />
    ));

  return (
    <div
      ref={containerRef}
      className="pointer-events-none relative w-full"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 flex items-center justify-between">
        {renderBars(idleColor)}
      </div>
      <div
        className="absolute inset-0 flex items-center justify-between"
        style={{
          clipPath: `inset(0 ${(1 - clamped) * 100}% 0 0)`,
          transition: "clip-path 240ms linear",
        }}
      >
        {renderBars(activeColor)}
      </div>
    </div>
  );
});

// Purely visual: polls the recorder clock so the timer can show tenths of a
// second without re-rendering the whole composer ten times per second.
const RecordingClock = memo(function RecordingClock({
  getElapsed,
  running,
  className,
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(getElapsed());

    tick();
    if (!running) return undefined;

    const timer = window.setInterval(tick, 100);
    return () => window.clearInterval(timer);
  }, [getElapsed, running]);

  return <span className={className}>{formatRecordingClock(elapsed)}</span>;
});

// Purely visual: scrolling live waveform that reads the existing sample buffer.
const LiveWaveform = memo(function LiveWaveform({
  samplesRef,
  running,
  color,
}) {
  const containerRef = useRef(null);
  const [capacity, setCapacity] = useState(48);
  const [levels, setLevels] = useState([]);

  useIsomorphicLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const measure = () => {
      const width = node.clientWidth;
      if (width > 0) {
        setCapacity(
          Math.max(8, Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP)))
        );
      }
    };

    measure();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const read = () => {
      const samples = samplesRef.current || [];
      setLevels(samples.slice(-capacity));
    };

    read();
    if (!running) return undefined;

    const timer = window.setInterval(read, 100);
    return () => window.clearInterval(timer);
  }, [samplesRef, running, capacity]);

  const placeholderCount = Math.max(0, capacity - levels.length);

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-end overflow-hidden"
      style={{ gap: `${BAR_GAP}px` }}
    >
      {Array.from({ length: placeholderCount }, (_, index) => (
        <span
          key={`dot-${index}`}
          className="shrink-0 rounded-full"
          style={{
            width: `${BAR_WIDTH}px`,
            height: `${BAR_MIN_HEIGHT}px`,
            backgroundColor: color,
            opacity: 0.3,
          }}
        />
      ))}
      {levels.map((level, index) => {
        const eased = Math.pow(clamp01(Number(level) * 1.25), 0.85);
        const barHeight = Math.max(
          BAR_MIN_HEIGHT,
          Math.round((BAR_MIN_HEIGHT + eased * 22) / 2) * 2
        );

        return (
          <span
            key={`bar-${index}`}
            className="shrink-0 rounded-full"
            style={{
              width: `${BAR_WIDTH}px`,
              height: `${barHeight}px`,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
});

// Purely visual: Telegram's pulsing halo behind the mic button that follows
// the microphone level.
const LevelHalo = memo(function LevelHalo({ samplesRef, active, color }) {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return undefined;
    }

    const read = () => {
      const samples = samplesRef.current || [];
      const last = samples.length ? samples[samples.length - 1] : 0;
      const previous = samples.length > 1 ? samples[samples.length - 2] : last;
      setLevel(clamp01(((last + previous) / 2) * 1.5));
    };

    read();

    const timer = window.setInterval(read, 80);
    return () => window.clearInterval(timer);
  }, [samplesRef, active]);

  const outerScale = active ? 1.2 + level * 0.5 : 1;
  const innerScale = active ? 1.08 + level * 0.26 : 1;

  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full transition-[transform,opacity] duration-200 ease-out"
        style={{
          backgroundColor: color,
          opacity: active ? 0.14 : 0,
          transform: `scale(${outerScale})`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full transition-[transform,opacity] duration-200 ease-out"
        style={{
          backgroundColor: color,
          opacity: active ? 0.2 : 0,
          transform: `scale(${innerScale})`,
        }}
      />
    </>
  );
});

function MessageComposer({
  conversationId,
  theme,
  isDark,
  message,
  setMessage,
  isEmojiOpen,
  setIsEmojiOpen,
  messageInputRef,
  messageSelectionRef,
  onSendMessage,
  onEmojiClick,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  language = "english",
}) {
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessingRecording, setIsProcessingRecording] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceDraft, setVoiceDraft] = useState(null);
  const [voiceError, setVoiceError] = useState("");
  const [previewIsPlaying, setPreviewIsPlaying] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewActualDuration, setPreviewActualDuration] = useState(0);
  const [previewError, setPreviewError] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingMimeTypeRef = useRef("audio/webm");
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const waveformDataRef = useRef(null);
  const waveformGainRef = useRef(null);
  const waveformSourceRef = useRef(null);
  const waveformSamplingTimerRef = useRef(null);
  const waveformSamplesRef = useRef([]);
  const draftObjectUrlRef = useRef(null);
  const playbackPreviewRef = useRef(null);
  const startLockRef = useRef(false);
  const mountedRef = useRef(false);
  const recordingDiscardRef = useRef(false);
  const recordingFailedRef = useRef(false);
  const activeMillisecondsRef = useRef(0);
  const activeSegmentStartedAtRef = useRef(0);
  const activeSegmentRef = useRef(false);

  const accentClass = theme === "blue"
    ? "text-[#1278e6]"
    : "text-[#d93636]";

  const accentBackgroundClass = theme === "blue"
    ? "bg-[#1278e6]"
    : "bg-[#d93636]";

  const isBlue = theme === "blue";
  const accentSolid = isBlue ? "#1278e6" : "#d93636";
  const accentSoft = isBlue ? "#91a8ef" : "#f08080";
  const accentTone = isDark ? accentSoft : accentSolid;
  const idleBarColor = withAlpha(accentTone, 0.32);
  const textDir = language === "english" ? "ltr" : "rtl";

  const primaryTextClass = isDark ? "text-white" : "text-[#202a3c]";
  const mutedTextClass = isDark ? "text-white/55" : "text-black/50";
  const errorTextClass = isDark ? "text-[#ff7a70]" : "text-[#d92d20]";
  const idleIconClass = isDark
    ? "text-gray-400"
    : isBlue
      ? "text-[#54708d]"
      : "text-[#956060]";

  const contextMode = editingMessage
    ? "edit"
    : replyingTo
      ? "reply"
      : null;

  const contextMessage = editingMessage || replyingTo;

  const voicePanelVisible =
    isStartingRecording ||
    isRecording ||
    isPaused ||
    isProcessingRecording ||
    Boolean(voiceDraft) ||
    Boolean(voiceError);

  const getActiveElapsedMilliseconds = useCallback(() => {
    const currentSegment = activeSegmentRef.current
      ? Math.max(0, performance.now() - activeSegmentStartedAtRef.current)
      : 0;

    return Math.min(
      MAX_RECORDING_SECONDS * 1000,
      activeMillisecondsRef.current + currentSegment
    );
  }, []);

  const settleActiveSegment = useCallback(() => {
    if (activeSegmentRef.current) {
      activeMillisecondsRef.current = Math.min(
        MAX_RECORDING_SECONDS * 1000,
        activeMillisecondsRef.current + Math.max(
          0,
          performance.now() - activeSegmentStartedAtRef.current
        )
      );
      activeSegmentRef.current = false;
    }

    return activeMillisecondsRef.current;
  }, []);

  const stopStreamTracks = useCallback(() => {
    const stream = mediaStreamRef.current;
    mediaStreamRef.current = null;

    if (!stream) return;

    for (const track of stream.getTracks()) {
      try {
        track.stop();
      } catch {
        // Continue releasing the remaining tracks.
      }
    }
  }, []);

  const stopWaveformSampler = useCallback(() => {
    if (waveformSamplingTimerRef.current !== null) {
      window.clearInterval(waveformSamplingTimerRef.current);
      waveformSamplingTimerRef.current = null;
    }
  }, []);

  const startWaveformSampler = useCallback(() => {
    stopWaveformSampler();
    const analyser = analyserRef.current;
    const data = waveformDataRef.current;

    if (!analyser || !data || typeof window === "undefined") return;

    waveformSamplingTimerRef.current = window.setInterval(() => {
      const context = audioContextRef.current;
      const activeAnalyser = analyserRef.current;
      const activeData = waveformDataRef.current;

      if (!context || context.state !== "running" || !activeAnalyser || !activeData) {
        return;
      }

      activeAnalyser.getByteTimeDomainData(activeData);
      let squaredTotal = 0;

      for (let index = 0; index < activeData.length; index += 1) {
        const sample = (activeData[index] - 128) / 128;
        squaredTotal += sample * sample;
      }

      const rms = Math.sqrt(squaredTotal / activeData.length);
      waveformSamplesRef.current.push(
        Math.round(Math.min(1, Math.max(0, rms * 2.8)) * 1000) / 1000
      );
    }, 100);
  }, [stopWaveformSampler]);

  const startWaveformAnalysis = useCallback((stream) => {
    stopWaveformSampler();

    const AudioContextConstructor =
      typeof window !== "undefined"
        ? window.AudioContext || window.webkitAudioContext
        : null;

    if (!AudioContextConstructor) return;

    try {
      const context = new AudioContextConstructor({
        latencyHint: "interactive",
      });
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      const silentGain = context.createGain();

      analyser.fftSize = 256;
      silentGain.gain.value = 0;
      source.connect(analyser);
      analyser.connect(silentGain);
      silentGain.connect(context.destination);

      audioContextRef.current = context;
      waveformSourceRef.current = source;
      analyserRef.current = analyser;
      waveformGainRef.current = silentGain;
      waveformDataRef.current = new Uint8Array(analyser.fftSize);
      waveformSamplesRef.current = [];

      if (context.state === "suspended") {
        void context.resume().then(() => {
          if (audioContextRef.current === context && activeSegmentRef.current) {
            startWaveformSampler();
          }
        }).catch(() => {
          // Recording remains functional even if waveform analysis is unavailable.
        });
      } else {
        startWaveformSampler();
      }
    } catch {
      // Audio analysis is optional; MediaRecorder remains the source of truth.
      stopWaveformSampler();
    }
  }, [startWaveformSampler, stopWaveformSampler]);

  const stopWaveformAnalysis = useCallback(() => {
    stopWaveformSampler();

    const source = waveformSourceRef.current;
    const analyser = analyserRef.current;
    const gain = waveformGainRef.current;
    const context = audioContextRef.current;

    waveformSourceRef.current = null;
    analyserRef.current = null;
    waveformGainRef.current = null;
    waveformDataRef.current = null;
    audioContextRef.current = null;

    try { source?.disconnect(); } catch {}
    try { analyser?.disconnect(); } catch {}
    try { gain?.disconnect(); } catch {}

    if (context && context.state !== "closed") {
      void context.close().catch(() => {});
    }
  }, [stopWaveformSampler]);

  const buildWaveform = useCallback((durationSeconds) => {
    const samples = waveformSamplesRef.current;
    if (!samples.length) return [];

    const count = Math.max(
      24,
      Math.min(120, Math.ceil(Math.max(1, durationSeconds) * 1.5))
    );

    const waveform = [];
    for (let bucket = 0; bucket < count; bucket += 1) {
      const start = Math.floor((bucket * samples.length) / count);
      const end = Math.max(
        start + 1,
        Math.floor(((bucket + 1) * samples.length) / count)
      );
      let peak = 0;

      for (let index = start; index < Math.min(end, samples.length); index += 1) {
        peak = Math.max(peak, samples[index] || 0);
      }

      waveform.push(Math.round(Math.min(1, peak) * 1000) / 1000);
    }

    return waveform;
  }, []);

  const togglePreviewPlayback = useCallback(async () => {
    const audio = playbackPreviewRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      await audio.play();
      setPreviewError("");
    } catch {
      setPreviewError(
        language === "english"
          ? "Preview could not start. Tap play to try again."
          : "پخش پیش‌نمایش شروع نشد. دوباره روی پخش بزنید."
      );
    }
  }, [language]);

  const handlePreviewSeek = useCallback((event) => {
    const audio = playbackPreviewRef.current;
    const nextTime = Number(event.target.value) || 0;

    if (!audio || !Number.isFinite(audio.duration)) return;

    try {
      audio.currentTime = Math.min(audio.duration, Math.max(0, nextTime));
      setPreviewCurrentTime(audio.currentTime);
    } catch {
      // Some browsers cannot seek until media metadata is ready.
    }
  }, []);

  const resetPreviewState = useCallback(() => {
    setPreviewIsPlaying(false);
    setPreviewCurrentTime(0);
    setPreviewActualDuration(0);
    setPreviewError("");
  }, []);

  const clearVoiceDraft = useCallback(() => {
    if (playbackPreviewRef.current) {
      playbackPreviewRef.current.pause();
      playbackPreviewRef.current.removeAttribute("src");
      playbackPreviewRef.current.load();
    }

    if (draftObjectUrlRef.current) {
      URL.revokeObjectURL(draftObjectUrlRef.current);
      draftObjectUrlRef.current = null;
    }

    setVoiceDraft(null);
    setRecordingDuration(0);
    setVoiceError("");
    resetPreviewState();
  }, [resetPreviewState]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") return;

    const elapsed = settleActiveSegment();
    setRecordingDuration(Math.floor(elapsed / 1000));
    setIsRecording(false);
    setIsPaused(false);
    setIsProcessingRecording(true);

    try {
      recorder.stop();
    } catch {
      recordingFailedRef.current = true;
      stopWaveformAnalysis();
      stopStreamTracks();
      mediaRecorderRef.current = null;
      recordingChunksRef.current = [];
      waveformSamplesRef.current = [];
      setIsProcessingRecording(false);
      setVoiceError(
        language === "english"
          ? "Could not finish the recording. Please try again."
          : "پایان ضبط صدا ناموفق بود. دوباره تلاش کنید."
      );
    }
  }, [language, settleActiveSegment, stopStreamTracks, stopWaveformAnalysis]);

  const startRecording = useCallback(async () => {
    if (
      startLockRef.current ||
      isStartingRecording ||
      isRecording ||
      isPaused ||
      isProcessingRecording ||
      isUploadingVoice ||
      voiceDraft
    ) {
      return;
    }

    setVoiceError("");
    setIsEmojiOpen(false);

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setVoiceError(
        language === "english"
          ? "Voice recording is unavailable. Open the app over HTTPS in a supported browser."
          : "ضبط صدا در دسترس نیست. برنامه را از طریق HTTPS و در مرورگر سازگار باز کنید."
      );
      return;
    }

    startLockRef.current = true;
    setIsStartingRecording(true);
    let stream = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!mountedRef.current) {
        for (const track of stream.getTracks()) {
          try { track.stop(); } catch {}
        }
        return;
      }

      const preferredType = getSupportedRecordingType();
      const recorderOptions = {
        audioBitsPerSecond: AUDIO_BITRATE,
      };

      if (preferredType) {
        recorderOptions.mimeType = preferredType;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      const mimeType = normalizeMimeType(
        recorder.mimeType || preferredType || "audio/webm"
      );

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      waveformSamplesRef.current = [];
      recordingMimeTypeRef.current = mimeType;
      recordingDiscardRef.current = false;
      recordingFailedRef.current = false;
      activeMillisecondsRef.current = 0;
      activeSegmentStartedAtRef.current = performance.now();
      activeSegmentRef.current = true;
      startWaveformAnalysis(stream);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("error", () => {
        recordingFailedRef.current = true;
        if (mountedRef.current) setVoiceError(
          language === "english"
            ? "An audio recording error occurred. Please record again."
            : "هنگام ضبط صدا خطایی رخ داد. دوباره ضبط کنید."
        );

        if (recorder.state !== "inactive") {
          try {
            recorder.stop();
          } catch {
            stopStreamTracks();
          }
        }
      });

      recorder.addEventListener("stop", () => {
        const elapsed = settleActiveSegment();
        stopWaveformAnalysis();
        stopStreamTracks();
        recordingChunksRef.current = recordingChunksRef.current.slice();
        mediaRecorderRef.current = null;

        if (!mountedRef.current) {
          recordingChunksRef.current = [];
          waveformSamplesRef.current = [];
          return;
        }

        setIsStartingRecording(false);
        setIsRecording(false);
        setIsPaused(false);
        setIsProcessingRecording(false);
        setRecordingDuration(Math.floor(elapsed / 1000));

        if (recordingDiscardRef.current) {
          recordingDiscardRef.current = false;
          recordingChunksRef.current = [];
          waveformSamplesRef.current = [];
          setRecordingDuration(0);
          return;
        }

        if (recordingFailedRef.current) {
          recordingChunksRef.current = [];
          waveformSamplesRef.current = [];
          return;
        }

        const recordedMimeType = normalizeMimeType(
          recorder.mimeType || recordingMimeTypeRef.current
        );
        const blob = new Blob(recordingChunksRef.current, {
          type: recordedMimeType,
        });
        recordingChunksRef.current = [];

        if (!blob.size) {
          setRecordingDuration(0);
          setVoiceError(
            language === "english"
              ? "The recording is empty. Please record again."
              : "فایل ضبط‌شده خالی است. دوباره ضبط کنید."
          );
          return;
        }

        if (blob.size > MAX_UPLOAD_BYTES) {
          setRecordingDuration(0);
          setVoiceError(
            language === "english"
              ? "This recording exceeds the 50 MB upload limit. Record a shorter message."
              : "حجم فایل ضبط‌شده بیشتر از سقف ۵۰ مگابایت است. پیام کوتاه‌تری ضبط کنید."
          );
          return;
        }

        const duration = Math.min(
          MAX_RECORDING_SECONDS,
          Math.max(1, Math.round(elapsed / 1000))
        );
        const waveform = buildWaveform(duration);
        waveformSamplesRef.current = [];
        const fileName = `voice-${Date.now()}.${getFileExtension(recordedMimeType)}`;
        const previewUrl = URL.createObjectURL(blob);

        if (draftObjectUrlRef.current) {
          URL.revokeObjectURL(draftObjectUrlRef.current);
        }

        draftObjectUrlRef.current = previewUrl;
        setRecordingDuration(duration);
        setVoiceDraft({
          blob,
          fileName,
          duration,
          previewUrl,
          mimeType: recordedMimeType,
          size: blob.size,
          waveform,
        });
        setVoiceError("");
      });

      stream.getAudioTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (
            mountedRef.current &&
            mediaStreamRef.current === stream &&
            recorder.state !== "inactive"
          ) {
            recordingFailedRef.current = true;
            setVoiceError(
              language === "english"
                ? "The microphone disconnected during recording. Please try again."
                : "ارتباط میکروفون هنگام ضبط قطع شد. دوباره تلاش کنید."
            );
            stopRecording();
          }
        }, { once: true });
      });

      recorder.start(RECORDING_TIMESLICE_MS);
      setRecordingDuration(0);
      setIsRecording(true);
    } catch (error) {
      if (stream) {
        for (const track of stream.getTracks()) {
          try {
            track.stop();
          } catch {
            // Best-effort cleanup.
          }
        }
      }

      stopWaveformAnalysis();
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      recordingChunksRef.current = [];
      waveformSamplesRef.current = [];
      activeSegmentRef.current = false;
      activeMillisecondsRef.current = 0;
      if (mountedRef.current) {
        setIsRecording(false);
        setIsPaused(false);
        setIsProcessingRecording(false);
        setVoiceError(getRecordingErrorMessage(error, language));
      }
    } finally {
      startLockRef.current = false;
      if (mountedRef.current) setIsStartingRecording(false);
    }
  }, [
    isStartingRecording,
    isRecording,
    isPaused,
    isProcessingRecording,
    isUploadingVoice,
    voiceDraft,
    setIsEmojiOpen,
    language,
    settleActiveSegment,
    stopStreamTracks,
    stopRecording,
    startWaveformAnalysis,
    stopWaveformAnalysis,
    buildWaveform,
  ]);

  const togglePauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || isProcessingRecording) return;

    try {
      if (recorder.state === "recording") {
        recorder.pause();
        stopWaveformSampler();
        settleActiveSegment();
        setRecordingDuration(Math.floor(activeMillisecondsRef.current / 1000));
        setIsRecording(false);
        setIsPaused(true);
        return;
      }

      if (recorder.state === "paused") {
        recorder.resume();
        activeSegmentStartedAtRef.current = performance.now();
        activeSegmentRef.current = true;
        startWaveformSampler();
        setIsPaused(false);
        setIsRecording(true);
      }
    } catch {
      setVoiceError(
        language === "english"
          ? "Could not pause or resume recording. Stop and try again."
          : "مکث یا ادامه ضبط ناموفق بود. ضبط را متوقف و دوباره تلاش کنید."
      );
    }
  }, [
    isProcessingRecording,
    language,
    settleActiveSegment,
    startWaveformSampler,
    stopWaveformSampler,
  ]);

  const cancelRecording = useCallback(() => {
    recordingDiscardRef.current = true;
    setVoiceError("");

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      stopRecording();
      return;
    }

    stopStreamTracks();
    mediaRecorderRef.current = null;
    recordingChunksRef.current = [];
    activeSegmentRef.current = false;
    activeMillisecondsRef.current = 0;
    setIsStartingRecording(false);
    setIsRecording(false);
    setIsPaused(false);
    setIsProcessingRecording(false);
    setRecordingDuration(0);
    recordingDiscardRef.current = false;
  }, [stopRecording, stopStreamTracks]);

  const sendVoiceDraft = useCallback(async () => {
    if (!voiceDraft?.blob || !conversationId || isUploadingVoice) return;

    const formData = new FormData();
    formData.append("conversationId", String(conversationId));
    formData.append("type", "voice");
    formData.append("duration", String(voiceDraft.duration));
    if (Array.isArray(voiceDraft.waveform) && voiceDraft.waveform.length) {
      formData.append("waveform", JSON.stringify(voiceDraft.waveform));
    }
    formData.append("file", voiceDraft.blob, voiceDraft.fileName);

    const replyToId = getId(replyingTo);
    if (replyToId) formData.append("replyTo", replyToId);

    setIsUploadingVoice(true);
    setVoiceError("");

    try {
      const response = await apiFetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      if (response?.success !== true || !response?.message) {
        const serverMessage = typeof response?.message === "string"
          ? response.message
          : language === "english"
            ? "Could not send the voice message."
            : "ارسال پیام صوتی ناموفق بود.";
        throw new Error(serverMessage);
      }

      if (mountedRef.current) {
        clearVoiceDraft();
        onCancelReply?.();
        setIsEmojiOpen(false);
      }
    } catch (error) {
      if (mountedRef.current) {
        setVoiceError(
          error?.message ||
            (language === "english"
              ? "Could not send the voice message. Check your connection and retry."
              : "ارسال پیام صوتی ناموفق بود. اتصال را بررسی و دوباره تلاش کنید.")
        );
      }
    } finally {
      if (mountedRef.current) setIsUploadingVoice(false);
    }
  }, [
    voiceDraft,
    conversationId,
    isUploadingVoice,
    replyingTo,
    language,
    clearVoiceDraft,
    onCancelReply,
    setIsEmojiOpen,
  ]);

  // Hands the selected files to the upload queue. The bubbles appear in the
  // chat immediately (with a progress ring) and upload in the background.
  const sendAttachments = useCallback((payload = {}) => {
    const selectedItems = Array.isArray(payload?.items)
      ? payload.items.filter((item) => item?.file)
      : [];

    if (!conversationId || !selectedItems.length) return;

    enqueueUploads({
      conversationId,
      items: selectedItems,
      caption:
        typeof payload.caption === "string" ? payload.caption.trim() : "",
      replyTo: getId(replyingTo),
    });

    onCancelReply?.();
    setIsEmojiOpen(false);
  }, [conversationId, replyingTo, onCancelReply, setIsEmojiOpen]);

  useEffect(() => {
    if (!isRecording) return undefined;

    const timer = window.setInterval(() => {
      const elapsed = getActiveElapsedMilliseconds();
      setRecordingDuration(Math.floor(elapsed / 1000));

      if (elapsed >= MAX_RECORDING_SECONDS * 1000) {
        stopRecording();
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [isRecording, getActiveElapsedMilliseconds, stopRecording]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      recordingDiscardRef.current = true;
      activeSegmentRef.current = false;

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Best-effort cleanup during unmount.
        }
      }

      stopWaveformAnalysis();
      stopStreamTracks();

      if (draftObjectUrlRef.current) {
        URL.revokeObjectURL(draftObjectUrlRef.current);
        draftObjectUrlRef.current = null;
      }
    };
  }, [stopStreamTracks, stopWaveformAnalysis]);

  const handlePrimaryAction = useCallback(() => {
    if (isUploadingVoice || isProcessingRecording || isStartingRecording) return;

    if (isRecording || isPaused) {
      stopRecording();
      return;
    }

    if (voiceDraft) {
      void sendVoiceDraft();
      return;
    }

    if (message.trim()) {
      onSendMessage();
      return;
    }

    void startRecording();
  }, [
    isUploadingVoice,
    isProcessingRecording,
    isStartingRecording,
    isRecording,
    isPaused,
    voiceDraft,
    message,
    stopRecording,
    sendVoiceDraft,
    onSendMessage,
    startRecording,
  ]);

  const handleClearVoiceDraft = useCallback(() => {
    clearVoiceDraft();
  }, [clearVoiceDraft]);

  const emojiPickerNode = useMemo(
    () => (
      <EmojiPicker
        onEmojiClick={onEmojiClick}
        theme={isDark ? "dark" : "light"}
        emojiStyle="native"
        width="100%"
        height={430}
        lazyLoadEmojis={true}
        searchPlaceholder="Search emoji"
        previewConfig={{ showPreview: false }}
        style={getEmojiPickerStyle(isDark, accentTone)}
      />
    ),
    [onEmojiClick, isDark, accentTone]
  );

  const previewDuration = previewActualDuration || voiceDraft?.duration || 0;
  const previewProgress = previewDuration > 0
    ? Math.min(1, Math.max(0, previewCurrentTime / previewDuration))
    : 0;
  const previewTimeLabel = formatDuration(
    previewIsPlaying || previewCurrentTime > 0
      ? previewCurrentTime
      : previewDuration
  );
  const draftNotice = previewError || voiceError;

  const isRecordingActive = isRecording || isPaused;

  const voiceView = isStartingRecording
    ? "starting"
    : isRecordingActive
      ? "recording"
      : isProcessingRecording
        ? "processing"
        : voiceDraft
          ? "draft"
          : "error";

  const primaryLabel = isRecording || isPaused
    ? language === "english" ? "Stop recording" : "توقف ضبط"
    : voiceDraft
      ? language === "english" ? "Send voice message" : "ارسال پیام صوتی"
      : message.trim()
        ? language === "english" ? "Send message" : "ارسال پیام"
        : language === "english" ? "Record voice message" : "ضبط پیام صوتی";

  const primaryDisabled =
    isStartingRecording ||
    isUploadingVoice ||
    isProcessingRecording ||
    (!conversationId && !message.trim());

  const primaryMode = isStartingRecording || isUploadingVoice || isProcessingRecording
    ? "loading"
    : isRecording || isPaused
      ? "stop"
      : voiceDraft || message.trim().length > 0
        ? "send"
        : "mic";

  const primarySlotClass = (active) =>
    `absolute inset-0 flex items-center justify-center transition-all duration-200 ease-out ${
      active ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
    }`;

  return (
    <div
      className={`
        z-40 flex flex-row-reverse justify-between items-center mx-[15px]
        absolute bottom-[15px] rounded-[22.5px] min-h-[45px] max-h-[150px]
        inset-x-0 border backdrop-blur-xl backdrop-saturate-150
        transition-all duration-200
        ${
          isDark
            ? theme === "blue"
              ? "border-white/[0.08] bg-[#172033]/60 shadow-[0_8px_28px_rgba(0,0,0,0.24)]"
              : "border-white/[0.08] bg-[#241719]/60 shadow-[0_8px_28px_rgba(0,0,0,0.24)]"
            : theme === "blue"
              ? "border-[#1278e6]/30 bg-white/65 shadow-[0_8px_30px_rgba(18,120,230,0.16)]"
              : "border-[#d93636]/30 bg-white/65 shadow-[0_8px_30px_rgba(217,54,54,0.13)]"
        }
      `}
    >
      <style>{`
        @keyframes tgc-view-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tgc-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .tgc-view-in { animation: tgc-view-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .tgc-blink { animation: tgc-blink 1.1s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .tgc-view-in, .tgc-blink { animation: none; }
        }
      `}</style>

      {contextMode && !voicePanelVisible && (
        <div
          dir="ltr"
          className={`absolute inset-x-0 bottom-[calc(100%+8px)] flex items-center gap-[10px] rounded-[18px] border py-[7px] pl-[13px] pr-[6px] backdrop-blur-xl backdrop-saturate-150 ${
            isDark
              ? theme === "blue"
                ? "border-white/10 bg-[#172033]/90"
                : "border-white/10 bg-[#241719]/90"
              : theme === "blue"
                ? "border-[#1278e6]/20 bg-[#edf4ff]/95"
                : "border-[#d93636]/20 bg-[#fff1f1]/95"
          }`}
        >
          {contextMode === "edit" ? (
            <Pencil size={21} strokeWidth={1.75} className={`shrink-0 ${accentClass}`} />
          ) : (
            <Reply size={22} strokeWidth={1.75} className={`shrink-0 ${accentClass}`} />
          )}

          <span
            aria-hidden="true"
            className={`h-[34px] w-[2px] shrink-0 rounded-full ${accentBackgroundClass}`}
          />

          <div dir={textDir} className="flex min-w-0 flex-1 flex-col gap-px">
            <span className={`truncate text-left text-[13.5px] font-medium leading-[18px] ${accentClass}`}>
              {contextMode === "edit"
                ? language === "english" ? "Editing message" : "ویرایش پیام"
                : language === "english"
                  ? `Reply to ${getSenderName(contextMessage, language)}`
                  : `پاسخ به ${getSenderName(contextMessage, language)}`}
            </span>
            <span className={`line-clamp-1 break-words text-left text-[13.5px] leading-[18px] ${isDark ? "text-white/65" : "text-black/60"}`}>
              {contextMessage?.text || (language === "english" ? "Message" : "پیام")}
            </span>
          </div>

          <button
            type="button"
            onClick={contextMode === "edit" ? onCancelEdit : onCancelReply}
            className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
              isDark
                ? "text-white/60 hover:bg-white/[0.08]"
                : "text-black/50 hover:bg-black/[0.06]"
            }`}
            aria-label={language === "english" ? "Cancel" : "لغو"}
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {voicePanelVisible && (
        <div
          key={voiceView}
          dir="ltr"
          className="tgc-view-in flex min-h-[45px] w-full min-w-0 flex-1 items-center py-[3px] pl-[2.5px] pr-[50px]"
        >
          {voiceView === "starting" ? (
            <div className="flex min-w-0 flex-1 items-center gap-[11px] pl-[11px]">
              <LoaderCircle
                size={20}
                className="shrink-0 animate-spin"
                style={{ color: accentTone }}
              />
              <div className="min-w-0 flex-1">
                <p dir={textDir} className={`truncate text-left text-[14px] font-medium leading-[18px] ${primaryTextClass}`}>
                  {language === "english" ? "Connecting microphone" : "در حال اتصال به میکروفون"}
                </p>
                <p dir={textDir} className={`truncate text-left text-[12px] leading-[15px] ${mutedTextClass}`}>
                  {language === "english" ? "Allow microphone access to start recording" : "برای شروع ضبط، اجازهٔ میکروفون را بدهید"}
                </p>
              </div>
            </div>
          ) : voiceView === "recording" ? (
            <>
              <button
                type="button"
                onClick={cancelRecording}
                disabled={isProcessingRecording}
                aria-label={language === "english" ? "Discard recording" : "حذف ضبط"}
                title={language === "english" ? "Discard recording" : "حذف ضبط"}
                className="flex h-[39.5px] w-[39.5px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#ff3b30]/10 active:bg-[#ff3b30]/15 disabled:opacity-40"
                style={{ color: RECORD_RED }}
              >
                <Trash2 size={22} strokeWidth={1.75} />
              </button>

              <div
                role="timer"
                aria-label={formatDuration(recordingDuration)}
                className="ml-[3px] flex shrink-0 items-center gap-[8px]"
              >
                <span
                  aria-hidden="true"
                  className={`h-[10px] w-[10px] shrink-0 rounded-full transition-opacity duration-200 ${isPaused ? "" : "tgc-blink"}`}
                  style={{
                    backgroundColor: RECORD_RED,
                    opacity: isPaused ? 0.5 : undefined,
                  }}
                />
                <RecordingClock
                  getElapsed={getActiveElapsedMilliseconds}
                  running={isRecording}
                  className={`text-[16px] font-normal leading-[20px] tabular-nums ${primaryTextClass}`}
                />
              </div>

              <div
                aria-hidden="true"
                className={`mx-[10px] h-[30px] min-w-0 flex-1 transition-opacity duration-200 ${isPaused ? "opacity-45" : "opacity-100"}`}
              >
                <LiveWaveform
                  samplesRef={waveformSamplesRef}
                  running={isRecording}
                  color={accentTone}
                />
              </div>

              <button
                type="button"
                onClick={togglePauseRecording}
                disabled={isProcessingRecording}
                aria-label={isPaused
                  ? language === "english" ? "Resume recording" : "ادامه ضبط"
                  : language === "english" ? "Pause recording" : "مکث ضبط"}
                title={isPaused
                  ? language === "english" ? "Resume recording" : "ادامه ضبط"
                  : language === "english" ? "Pause recording" : "مکث ضبط"}
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 active:scale-95 disabled:opacity-40 ${
                  isPaused
                    ? ""
                    : isDark
                      ? "bg-white/[0.09] text-white hover:bg-white/[0.14]"
                      : "bg-black/[0.06] text-[#202a3c] hover:bg-black/[0.09]"
                }`}
                style={isPaused ? {
                  backgroundColor: withAlpha(accentTone, 0.16),
                  color: accentTone,
                } : undefined}
              >
                {isPaused
                  ? <Mic size={19} strokeWidth={2} />
                  : <PauseGlyph size={20} />}
              </button>
            </>
          ) : voiceView === "processing" ? (
            <div className="flex min-w-0 flex-1 items-center gap-[11px] pl-[11px]">
              <LoaderCircle
                size={20}
                className="shrink-0 animate-spin"
                style={{ color: accentTone }}
              />
              <p dir={textDir} className={`min-w-0 flex-1 truncate text-left text-[14px] leading-[18px] ${mutedTextClass}`}>
                {language === "english" ? "Finalizing voice message…" : "در حال آماده‌سازی پیام صوتی…"}
              </p>
            </div>
          ) : voiceView === "draft" && voiceDraft ? (
            <>
              <audio
                ref={playbackPreviewRef}
                className="hidden"
                preload="metadata"
                src={voiceDraft.previewUrl}
                onTimeUpdate={() => setPreviewCurrentTime(playbackPreviewRef.current?.currentTime || 0)}
                onLoadedMetadata={() => {
                  const audio = playbackPreviewRef.current;
                  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
                    setPreviewActualDuration(audio.duration);
                  }
                }}
                onDurationChange={() => {
                  const audio = playbackPreviewRef.current;
                  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
                    setPreviewActualDuration(audio.duration);
                  }
                }}
                onPlay={() => setPreviewIsPlaying(true)}
                onPause={() => setPreviewIsPlaying(false)}
                onEnded={() => {
                  setPreviewIsPlaying(false);
                  setPreviewCurrentTime(0);
                  if (playbackPreviewRef.current) playbackPreviewRef.current.currentTime = 0;
                }}
                onError={() => setPreviewError(
                  language === "english"
                    ? "The preview could not be loaded. Delete this draft and record again."
                    : "پیش‌نمایش بارگذاری نشد. پیش‌نویس را حذف و دوباره ضبط کنید."
                )}
              />

              <button
                type="button"
                onClick={handleClearVoiceDraft}
                disabled={isUploadingVoice}
                aria-label={language === "english" ? "Discard voice message" : "حذف پیام صوتی"}
                title={language === "english" ? "Discard draft" : "حذف پیش‌نویس"}
                className="flex h-[39.5px] w-[39.5px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[#ff3b30]/10 active:bg-[#ff3b30]/15 disabled:opacity-40"
                style={{ color: RECORD_RED }}
              >
                <Trash2 size={22} strokeWidth={1.75} />
              </button>

              <div
                className={`ml-[3px] flex h-[38px] min-w-0 flex-1 items-center gap-[9px] rounded-full pl-[3px] pr-[13px] transition-opacity duration-200 ${isUploadingVoice ? "opacity-70" : "opacity-100"}`}
                style={{ backgroundColor: withAlpha(accentTone, isDark ? 0.18 : 0.12) }}
              >
                <button
                  type="button"
                  onClick={() => void togglePreviewPlayback()}
                  aria-label={previewIsPlaying
                    ? language === "english" ? "Pause preview" : "توقف موقت پیش‌نمایش"
                    : language === "english" ? "Play preview" : "پخش پیش‌نمایش"}
                  className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-white transition-transform duration-150 active:scale-90"
                  style={{ backgroundColor: accentSolid }}
                >
                  {previewIsPlaying ? <PauseGlyph size={20} /> : <PlayGlyph size={20} />}
                </button>

                {draftNotice ? (
                  <p
                    role="alert"
                    dir={textDir}
                    className={`line-clamp-2 min-w-0 flex-1 break-words text-left text-[11.5px] leading-[14px] ${errorTextClass}`}
                  >
                    {draftNotice}
                  </p>
                ) : (
                  <>
                    <div className="relative h-[26px] min-w-0 flex-1">
                      <Waveform
                        samples={voiceDraft.waveform}
                        progress={previewProgress}
                        activeColor={accentTone}
                        idleColor={idleBarColor}
                        height={26}
                      />
                      <input
                        type="range"
                        min="0"
                        max={previewDuration > 0 ? previewDuration : voiceDraft.duration}
                        step="0.1"
                        value={Math.min(previewCurrentTime, previewDuration || voiceDraft.duration)}
                        onChange={handlePreviewSeek}
                        aria-label={language === "english" ? "Preview position" : "موقعیت پیش‌نمایش"}
                        className="absolute inset-x-0 w-full cursor-pointer opacity-0"
                        style={{ top: "-6px", height: "38px" }}
                      />
                    </div>

                    <span
                      className="shrink-0 whitespace-nowrap text-[12px] font-medium leading-[16px] tabular-nums"
                      style={{ color: accentTone }}
                    >
                      {previewTimeLabel}
                    </span>
                  </>
                )}
              </div>

              {isUploadingVoice && (
                <span role="status" className="sr-only">
                  {language === "english" ? "Sending voice message…" : "در حال ارسال پیام صوتی…"}
                </span>
              )}
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-[10px] py-[3px] pl-[8px]">
              <span
                className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#ff3b30]/12"
                style={{ color: RECORD_RED }}
              >
                <AlertGlyph size={19} />
              </span>
              <p
                role="alert"
                dir={textDir}
                className={`min-w-0 flex-1 break-words text-left text-[12.5px] leading-[16px] ${errorTextClass}`}
              >
                {voiceError}
              </p>
              <button
                type="button"
                onClick={() => setVoiceError("")}
                aria-label={language === "english" ? "Dismiss error" : "بستن خطا"}
                title={language === "english" ? "Dismiss" : "بستن"}
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
                  isDark
                    ? "text-white/60 hover:bg-white/10"
                    : "text-black/50 hover:bg-black/5"
                }`}
              >
                <X size={19} strokeWidth={1.75} />
              </button>
            </div>
          )}
        </div>
      )}

      <div
        onPointerDown={(event) => event.preventDefault()}
        className={`absolute left-0 right-0 bottom-[calc(100%+10px)] z-40 overflow-hidden rounded-[18px] border backdrop-blur-2xl backdrop-saturate-150 transition-all duration-200 ease-out ${
          isDark
            ? "border-white/[0.08] bg-[#1c1d22]/90 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/[0.025]"
            : "border-black/[0.06] bg-white/95 shadow-[0_16px_48px_rgba(0,0,0,0.16)]"
        } ${
          isEmojiOpen && !voicePanelVisible
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-[10px] scale-[0.98] opacity-0"
        }`}
      >
        {emojiPickerNode}
      </div>

      <div className="absolute bottom-[2.5px] right-[5px] flex flex-row-reverse gap-[5px] items-center">
        <div className="relative h-[39.5px] w-[39.5px] shrink-0">
          <LevelHalo
            samplesRef={waveformSamplesRef}
            active={isRecording}
            color={accentSolid}
          />

          <button
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={handlePrimaryAction}
            disabled={primaryDisabled}
            aria-label={primaryLabel}
            title={primaryLabel}
            className={`relative flex h-[39.5px] w-[39.5px] cursor-pointer items-center justify-center overflow-hidden rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.92] disabled:cursor-not-allowed disabled:opacity-60 ${
              primaryMode === "mic"
                ? `bg-transparent ${idleIconClass} ${isDark ? "hover:bg-white/[0.06]" : "hover:bg-black/[0.045]"}`
                : `${accentBackgroundClass} text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]`
            }`}
          >
            <span className={primarySlotClass(primaryMode === "mic")}>
              <Mic size={24} strokeWidth={1.75} />
            </span>
            <span className={primarySlotClass(primaryMode === "send")}>
              <SendGlyph size={22} />
            </span>
            <span className={primarySlotClass(primaryMode === "stop")}>
              <Square size={16} fill="currentColor" strokeWidth={2} />
            </span>
            <span className={primarySlotClass(primaryMode === "loading")}>
              <LoaderCircle size={22} className="animate-spin" />
            </span>
          </button>
        </div>

        <button
          type="button"
          disabled={voicePanelVisible || isUploadingVoice}
          onClick={() => {
            setIsEmojiOpen(false);
            setIsAttachmentOpen(true);
          }}
          aria-label={language === "english" ? "Attach file" : "پیوست فایل"}
          className={`transition-all duration-300 h-[39.5px] w-[39.5px] rounded-full flex items-center justify-center font-semibold disabled:pointer-events-none ${
            message.length > 0 || voicePanelVisible || isUploadingVoice
              ? "opacity-0 scale-75"
              : "opacity-100 scale-100"
          } ${idleIconClass}`}
        >
          <Paperclip size={24} strokeWidth={1.75} />
        </button>
      </div>

      <div className={`${voicePanelVisible ? "hidden" : "flex"} w-full mr-[150px] gap-[5px] items-center`}>
        <button
          type="button"
          disabled={voicePanelVisible}
          onClick={() => setIsEmojiOpen((previous) => !previous)}
          aria-label={language === "english" ? "Open emoji picker" : "باز کردن شکلک‌ها"}
          className={`absolute bottom-[2.2px] left-[2.5px] h-[39.5px] w-[39.5px] rounded-full flex items-center justify-center text-[22.5px] font-normal cursor-pointer transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 ${
            isEmojiOpen
              ? isDark
                ? theme === "blue"
                  ? "text-[#91a8ef] bg-white/[0.06]"
                  : "text-[#f08080] bg-white/[0.06]"
                : theme === "blue"
                  ? "text-[#1278e6] bg-[#1278e6]/10"
                  : "text-[#d93636] bg-[#d93636]/10"
              : isDark
                ? "text-gray-500"
                : theme === "blue"
                  ? "text-[#64748b]"
                  : "text-[#946565]"
          }`}
        >
          <FontAwesomeIcon icon={faFaceSmile} />
        </button>

        <textarea
          ref={messageInputRef}
          disabled={isRecording || isPaused || isStartingRecording || isProcessingRecording || Boolean(voiceDraft) || isUploadingVoice}
          className={`ml-[50px] my-[11px] text-[16px] leading-[23px] outline-none border-none bg-transparent min-w-full max-w-full field-sizing-content max-h-[128px] scrollbar-none transition-colors duration-200 disabled:opacity-55 ${
            isDark
              ? "text-white placeholder:text-gray-400 caret-gray-200"
              : theme === "blue"
                ? "text-[#202a3c] placeholder:text-[#64748b] caret-[#1278e6]"
                : "text-[#302226] placeholder:text-[#956565] caret-[#d93636]"
          }`}
          placeholder={
            isRecording
              ? language === "english" ? "Recording voice message..." : "در حال ضبط پیام صوتی..."
              : isPaused
                ? language === "english" ? "Recording paused" : "ضبط متوقف است"
                : voiceDraft
                  ? language === "english" ? "Voice message ready to send" : "پیام صوتی آمادهٔ ارسال است"
                  : editingMessage
                    ? language === "english" ? "Edit message" : "ویرایش پیام"
                    : replyingTo
                      ? language === "english" ? "Reply" : "پاسخ"
                      : language === "english" ? "Message" : "پیام"
          }
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onSelect={(event) => {
            messageSelectionRef.current = {
              start: event.target.selectionStart,
              end: event.target.selectionEnd,
            };
          }}
          onClick={(event) => {
            messageSelectionRef.current = {
              start: event.target.selectionStart,
              end: event.target.selectionEnd,
            };
          }}
        />
      </div>

      <AttachmentSheet
        open={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        onSend={sendAttachments}
        theme={theme}
        isDark={isDark}
        language={language}
        conversationId={conversationId}
      />
    </div>
  );
}

export default memo(MessageComposer);
