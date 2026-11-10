"use client";

import {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  fetchMediaBlob,
} from "@/lib/mediaHooks";

const PLAYBACK_RATES = [
  1,
  1.25,
  1.5,
  2,
];

// Telegram waveform metrics.
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const BAR_MIN_HEIGHT = 2;
const WAVEFORM_HEIGHT = 22;
const FALLBACK_BAR_COUNT = 40;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined"
    ? useLayoutEffect
    : useEffect;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatDuration(value) {
  const seconds = Math.max(
    0,
    Math.floor(Number(value) || 0)
  );

  const minutes = Math.floor(
    seconds / 60
  );

  const remainder = seconds % 60;

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function getAttachmentFileId(attachment) {
  if (attachment?.fileId) {
    return String(attachment.fileId);
  }

  const value = String(
    attachment?.url || ""
  );

  const match = value.match(
    /\/api\/media\/files\/([^/?#]+)/
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

function clamp01(value) {
  return Math.min(
    1,
    Math.max(0, value)
  );
}

function withAlpha(hex, alpha) {
  const normalized = String(hex).replace(
    "#",
    ""
  );

  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const value = parseInt(
    expanded,
    16
  );

  if (!Number.isFinite(value)) {
    return hex;
  }

  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/*
|--------------------------------------------------------------------------
| Waveform
|--------------------------------------------------------------------------
*/

function buildBarHeights(
  samples,
  count,
  maxHeight,
  minHeight = BAR_MIN_HEIGHT
) {
  const total = Math.max(
    1,
    Math.floor(count)
  );

  const range = Math.max(
    0,
    maxHeight - minHeight
  );

  const toEven = (height) =>
    Math.max(
      minHeight,
      Math.round(height / 2) * 2
    );

  const values = Array.isArray(samples)
    ? samples
        .map((value) => Number(value))
        .filter(Number.isFinite)
        .map(clamp01)
    : [];

  if (!values.length) {
    return Array.from(
      {
        length: total,
      },
      (_, index) => {
        const rhythm = Math.abs(
          Math.sin((index + 1) * 1.37) *
            Math.cos((index + 1) * 0.41)
        );

        return toEven(
          minHeight +
            (0.18 + rhythm * 0.82) *
              range
        );
      }
    );
  }

  let peak = 0;

  for (const value of values) {
    peak = Math.max(peak, value);
  }

  const gain =
    peak > 0.04
      ? 1 / peak
      : 1;

  const heights = [];

  for (
    let index = 0;
    index < total;
    index += 1
  ) {
    let level;

    if (values.length >= total) {
      const start = Math.floor(
        (index * values.length) / total
      );

      const end = Math.max(
        start + 1,
        Math.floor(
          ((index + 1) * values.length) / total
        )
      );

      let bucketPeak = 0;

      for (
        let cursor = start;
        cursor < Math.min(end, values.length);
        cursor += 1
      ) {
        bucketPeak = Math.max(
          bucketPeak,
          values[cursor]
        );
      }

      level = bucketPeak;
    } else {
      const position =
        ((index + 0.5) * values.length) /
          total -
        0.5;

      const lower = Math.max(
        0,
        Math.floor(position)
      );

      const upper = Math.min(
        values.length - 1,
        Math.ceil(position)
      );

      const mix = clamp01(
        position - lower
      );

      level =
        values[lower] * (1 - mix) +
        values[Math.max(0, upper)] * mix;
    }

    heights.push(
      toEven(
        minHeight +
          clamp01(level * gain) * range
      )
    );
  }

  return heights;
}

/*
|--------------------------------------------------------------------------
| Play / Pause Icons
|--------------------------------------------------------------------------
*/

function PlayGlyph({
  size = 26,
}) {
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

function PauseGlyph({
  size = 26,
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="5.8"
        y="4.5"
        width="4.4"
        height="15"
        rx="1.5"
        fill="currentColor"
      />

      <rect
        x="13.8"
        y="4.5"
        width="4.4"
        height="15"
        rx="1.5"
        fill="currentColor"
      />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| Waveform Component
|--------------------------------------------------------------------------
*/

const Waveform = memo(
  function Waveform({
    samples,
    progress = 0,
    activeColor,
    idleColor,
    height = WAVEFORM_HEIGHT,
  }) {
    const containerRef = useRef(null);

    const [count, setCount] = useState(
      FALLBACK_BAR_COUNT
    );

    useIsomorphicLayoutEffect(() => {
      const node = containerRef.current;

      if (!node) {
        return undefined;
      }

      const measure = () => {
        const width = node.clientWidth;

        if (width > 0) {
          setCount(
            Math.max(
              8,
              Math.floor(
                (width + BAR_GAP) /
                  (BAR_WIDTH + BAR_GAP)
              )
            )
          );
        }
      };

      measure();

      if (
        typeof ResizeObserver === "undefined"
      ) {
        return undefined;
      }

      const observer = new ResizeObserver(
        measure
      );

      observer.observe(node);

      return () => {
        observer.disconnect();
      };
    }, []);

    const heights = useMemo(
      () =>
        buildBarHeights(
          samples,
          count,
          height
        ),
      [
        samples,
        count,
        height,
      ]
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
        style={{
          height: `${height}px`,
        }}
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
  }
);

/*
|--------------------------------------------------------------------------
| Voice Message Player
|--------------------------------------------------------------------------
*/

function VoiceMessagePlayer({
  attachment,
  userId = "",
  language = "english",
  theme = "blue",
  isDark = true,
}) {
  const [
    sourceUrl,
    setSourceUrl,
  ] = useState("");

  const [
    sourceRevision,
    setSourceRevision,
  ] = useState(0);

  const [
    isPlaying,
    setIsPlaying,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isBuffering,
    setIsBuffering,
  ] = useState(false);

  const [
    hasMetadata,
    setHasMetadata,
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);

  const [
    actualDuration,
    setActualDuration,
  ] = useState(0);

  const [
    playbackRate,
    setPlaybackRate,
  ] = useState(1);

  const [
    playbackError,
    setPlaybackError,
  ] = useState("");

  const audioRef = useRef(null);

  const attachmentRef = useRef(
    attachment
  );

  const playbackRateRef = useRef(1);

  const autoPlayRef = useRef(false);

  const objectUrlRef = useRef(null);

  const sourceRequestRef = useRef(0);

  const restorePositionRef = useRef(0);

  const playerId = useId();

  attachmentRef.current = attachment;

  const fileId = getAttachmentFileId(
    attachment
  );

  const declaredDuration =
    Number(attachment?.duration) || 0;

  const duration =
    actualDuration || declaredDuration;

  const rawWaveform = attachment?.waveform;

  const savedWaveform = useMemo(
    () =>
      Array.isArray(rawWaveform)
        ? rawWaveform
            .filter((value) =>
              Number.isFinite(Number(value))
            )
            .slice(0, 120)
            .map((value) =>
              Math.min(
                1,
                Math.max(0, Number(value))
              )
            )
        : [],
    [rawWaveform]
  );

  const isBlue = theme === "blue";

  const accentSolid = isBlue
    ? "#1278e6"
    : "#d93636";

  const accentSoft = isBlue
    ? "#91a8ef"
    : "#f08080";

  const accentColor = isDark
    ? accentSoft
    : accentSolid;

  const idleBarColor = withAlpha(
    accentColor,
    0.38
  );

  const playButtonGlyphColor = isDark
    ? "#10131c"
    : "#ffffff";

  const textMutedClass = isDark
    ? "text-white/60"
    : isBlue
      ? "text-[#46658b]"
      : "text-[#8c5050]";

  /*
  |--------------------------------------------------------------------------
  | Object URL Cleanup
  |--------------------------------------------------------------------------
  */

  const revokeObjectUrl = useCallback(() => {
    if (!objectUrlRef.current) {
      return;
    }

    URL.revokeObjectURL(
      objectUrlRef.current
    );

    objectUrlRef.current = null;
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Fetch Playback Blob
  |--------------------------------------------------------------------------
  |
  | fetchMediaBlob first checks IndexedDB.
  | If the audio has already been cached, no server download is needed.
  |
  */

  const getPlaybackSource = useCallback(
    async () => {
      if (!fileId) {
        throw new Error(
          language === "english"
            ? "Audio attachment is unavailable."
            : "فایل صوتی در دسترس نیست."
        );
      }

      return fetchMediaBlob(
        attachmentRef.current,
        {
          userId,
          cache: true,
          compressImage: false,
        }
      );
    },
    [
      fileId,
      userId,
      language,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Pause Other Voice Players
  |--------------------------------------------------------------------------
  */

  const notifyOtherPlayers = useCallback(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent(
        "telegraph:voice-play",
        {
          detail: {
            playerId,
          },
        }
      )
    );
  }, [
    playerId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Toggle Playback
  |--------------------------------------------------------------------------
  */

  const handleTogglePlayback = useCallback(
    async () => {
      const audio = audioRef.current;

      if (
        !audio ||
        isLoading
      ) {
        return;
      }

      setPlaybackError("");

      if (!audio.paused) {
        audio.pause();

        setIsPlaying(false);
        setIsBuffering(false);

        return;
      }

      /*
       * A cached Blob URL does not expire.
       */

      if (sourceUrl) {
        notifyOtherPlayers();

        try {
          audio.playbackRate = playbackRate;

          await audio.play();

          setIsPlaying(true);
        } catch (error) {
          setIsPlaying(false);

          setPlaybackError(
            error?.name === "NotAllowedError"
              ? language === "english"
                ? "Playback was blocked by the browser. Tap play again."
                : "مرورگر پخش صدا را مسدود کرد. دوباره روی پخش بزنید."
              : language === "english"
                ? "Playback could not start. Tap play to try again."
                : "پخش صدا شروع نشد. دوباره روی پخش بزنید."
          );
        }

        return;
      }

      const requestId =
        ++sourceRequestRef.current;

      restorePositionRef.current =
        Number(audio.currentTime) || 0;

      autoPlayRef.current = true;

      setIsLoading(true);
      setIsBuffering(false);

      try {
        const blob = await getPlaybackSource();

        const objectUrl =
          URL.createObjectURL(blob);

        if (
          requestId !==
          sourceRequestRef.current
        ) {
          URL.revokeObjectURL(
            objectUrl
          );

          return;
        }

        revokeObjectUrl();

        objectUrlRef.current = objectUrl;

        autoPlayRef.current = true;

        setHasMetadata(false);
        setActualDuration(0);

        setSourceUrl(objectUrl);

        setSourceRevision(
          (revision) => revision + 1
        );

        notifyOtherPlayers();
      } catch (error) {
        if (
          requestId !==
          sourceRequestRef.current
        ) {
          return;
        }

        autoPlayRef.current = false;

        setIsPlaying(false);
        setIsLoading(false);

        setPlaybackError(
          error?.message ||
            (language === "english"
              ? "Could not load this voice message."
              : "بارگذاری پیام صوتی ناموفق بود.")
        );
      }
    },
    [
      isLoading,
      sourceUrl,
      playbackRate,
      language,
      getPlaybackSource,
      notifyOtherPlayers,
      revokeObjectUrl,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Start Playback After Source Update
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !sourceUrl ||
      !audioRef.current
    ) {
      return undefined;
    }

    const audio = audioRef.current;

    let cancelled = false;

    audio.pause();
    audio.load();

    audio.playbackRate =
      playbackRateRef.current;

    if (!autoPlayRef.current) {
      setIsLoading(false);
      return undefined;
    }

    autoPlayRef.current = false;

    audio
      .play()
      .then(() => {
        if (cancelled) {
          return;
        }

        setIsPlaying(true);
        setIsBuffering(false);
        setPlaybackError("");
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setIsPlaying(false);

        setPlaybackError(
          error?.name === "NotAllowedError"
            ? language === "english"
              ? "Playback was blocked by the browser. Tap play again."
              : "مرورگر پخش صدا را مسدود کرد. دوباره روی پخش بزنید."
            : language === "english"
              ? "Playback could not start. Tap play to try again."
              : "پخش صدا شروع نشد. دوباره روی پخش بزنید."
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    sourceUrl,
    sourceRevision,
    language,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Stop Other Players
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOtherPlayer = (event) => {
      if (
        event.detail?.playerId === playerId
      ) {
        return;
      }

      const audio = audioRef.current;

      if (
        audio &&
        !audio.paused
      ) {
        audio.pause();

        setIsPlaying(false);
        setIsBuffering(false);
      }
    };

    window.addEventListener(
      "telegraph:voice-play",
      handleOtherPlayer
    );

    return () => {
      window.removeEventListener(
        "telegraph:voice-play",
        handleOtherPlayer
      );
    };
  }, [
    playerId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Reset When Attachment / User Changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    sourceRequestRef.current += 1;

    autoPlayRef.current = false;

    restorePositionRef.current = 0;

    setSourceUrl("");

    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);

    setHasMetadata(false);

    setCurrentTime(0);
    setActualDuration(0);

    setPlaybackError("");

    if (audioRef.current) {
      audioRef.current.pause();

      audioRef.current.removeAttribute(
        "src"
      );

      audioRef.current.load();
    }

    revokeObjectUrl();
  }, [
    fileId,
    userId,
    revokeObjectUrl,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Component Cleanup
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      sourceRequestRef.current += 1;

      autoPlayRef.current = false;

      if (audioRef.current) {
        audioRef.current.pause();

        audioRef.current.removeAttribute(
          "src"
        );

        audioRef.current.load();
      }

      revokeObjectUrl();
    };
  }, [
    revokeObjectUrl,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Audio Events
  |--------------------------------------------------------------------------
  */

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      setCurrentTime(
        Number(audio.currentTime) || 0
      );
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setHasMetadata(true);

    if (
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    ) {
      setActualDuration(
        audio.duration
      );
    }

    const restorePosition =
      restorePositionRef.current;

    if (
      restorePosition > 0 &&
      Number.isFinite(audio.duration) &&
      restorePosition < audio.duration
    ) {
      try {
        audio.currentTime =
          restorePosition;
      } catch {
        // The browser may not have a seekable range ready yet.
      }
    }

    restorePositionRef.current = 0;
  }, []);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setIsBuffering(false);
    setCurrentTime(0);

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleAudioError = useCallback(() => {
    if (!sourceUrl) {
      return;
    }

    setIsPlaying(false);
    setIsLoading(false);
    setIsBuffering(false);

    autoPlayRef.current = false;

    setSourceUrl("");

    if (
      objectUrlRef.current === sourceUrl
    ) {
      revokeObjectUrl();
    }

    setPlaybackError(
      language === "english"
        ? "Audio could not be loaded. Check your connection and tap play to retry."
        : "بارگذاری صدا ناموفق بود. اتصال را بررسی و برای تلاش مجدد روی پخش بزنید."
    );
  }, [
    sourceUrl,
    language,
    revokeObjectUrl,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Seek
  |--------------------------------------------------------------------------
  */

  const handleSeek = (event) => {
    event.stopPropagation();

    const nextTime =
      Number(event.target.value) || 0;

    const audio = audioRef.current;

    if (
      !audio ||
      !hasMetadata ||
      !Number.isFinite(audio.duration)
    ) {
      return;
    }

    try {
      audio.currentTime = Math.min(
        audio.duration,
        Math.max(0, nextTime)
      );

      setCurrentTime(
        audio.currentTime
      );
    } catch {
      setPlaybackError(
        language === "english"
          ? "Seeking is not available yet. Wait for the audio to load."
          : "امکان جابه‌جایی در صدا هنوز فراهم نیست. منتظر بارگذاری صدا بمانید."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Playback Speed
  |--------------------------------------------------------------------------
  */

  const handlePlaybackRate = (event) => {
    event.stopPropagation();

    const currentIndex =
      PLAYBACK_RATES.indexOf(
        playbackRate
      );

    const nextRate =
      PLAYBACK_RATES[
        (currentIndex + 1) %
          PLAYBACK_RATES.length
      ];

    playbackRateRef.current = nextRate;

    setPlaybackRate(nextRate);

    if (audioRef.current) {
      audioRef.current.playbackRate =
        nextRate;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UI Values
  |--------------------------------------------------------------------------
  */

  const progress =
    duration > 0
      ? Math.min(
          1,
          Math.max(
            0,
            currentTime / duration
          )
        )
      : 0;

  const durationLabel =
    formatDuration(duration);

  const elapsedLabel =
    formatDuration(currentTime);

  const barCount = Math.round(
    Math.min(
      60,
      Math.max(
        40,
        30 + duration * 0.9
      )
    )
  );

  const waveformWidth =
    barCount * (BAR_WIDTH + BAR_GAP) -
    BAR_GAP;

  const showElapsed =
    isPlaying ||
    currentTime > 0;

  const showRate =
    isPlaying ||
    isLoading ||
    isBuffering ||
    currentTime > 0 ||
    playbackRate !== 1;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="flex min-h-[44px] w-fit min-w-0 max-w-full items-center gap-[10px]"
      onPointerDown={(event) =>
        event.stopPropagation()
      }
      onClick={(event) =>
        event.stopPropagation()
      }
      dir="ltr"
    >
      <audio
        ref={audioRef}
        className="hidden"
        preload="none"
        src={sourceUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
      />

      <button
        type="button"
        onClick={handleTogglePlayback}
        disabled={isLoading}
        aria-label={
          isPlaying
            ? language === "english"
              ? "Pause voice message"
              : "توقف موقت پیام صوتی"
            : language === "english"
              ? "Play voice message"
              : "پخش پیام صوتی"
        }
        title={
          playbackError ||
          (language === "english"
            ? "Voice message"
            : "پیام صوتی")
        }
        className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.93] disabled:cursor-wait"
        style={{
          backgroundColor: accentColor,
          color: playButtonGlyphColor,
        }}
      >
        {isPlaying ? (
          <PauseGlyph size={26} />
        ) : (
          <PlayGlyph size={26} />
        )}

        {(isLoading || isBuffering) && (
          <svg
            className="pointer-events-none absolute inset-0 animate-spin"
            viewBox="0 0 44 44"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="22"
              cy="22"
              r="19.5"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeDasharray="30 93"
            />
          </svg>
        )}
      </button>

      <div
        className="flex min-w-0 shrink flex-col gap-[3px]"
        style={{
          width: `${waveformWidth}px`,
          maxWidth: "100%",
        }}
      >
        <div
          className="relative"
          style={{
            height: `${WAVEFORM_HEIGHT}px`,
          }}
        >
          <Waveform
            samples={savedWaveform}
            progress={progress}
            activeColor={accentColor}
            idleColor={idleBarColor}
            height={WAVEFORM_HEIGHT}
          />

          <input
            type="range"
            min="0"
            max={
              duration > 0
                ? duration
                : 0
            }
            step="0.1"
            value={Math.min(
              currentTime,
              duration || currentTime
            )}
            disabled={
              !hasMetadata ||
              !duration
            }
            onChange={handleSeek}
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onClick={(event) =>
              event.stopPropagation()
            }
            aria-label={
              language === "english"
                ? "Voice message position"
                : "موقعیت پیام صوتی"
            }
            className="absolute inset-x-0 w-full cursor-pointer opacity-0 disabled:cursor-default"
            style={{
              top: "-6px",
              height: `${WAVEFORM_HEIGHT + 12}px`,
            }}
          />
        </div>

        <div className="flex h-[18px] items-center justify-between gap-[6px]">
          <span
            className={`whitespace-nowrap text-[12px] font-normal leading-[16px] tabular-nums ${textMutedClass}`}
          >
            {showElapsed
              ? `${elapsedLabel} / ${durationLabel}`
              : durationLabel}
          </span>

          <button
            type="button"
            onClick={handlePlaybackRate}
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            tabIndex={
              showRate ? 0 : -1
            }
            aria-hidden={!showRate}
            aria-label={
              language === "english"
                ? "Change playback speed"
                : "تغییر سرعت پخش"
            }
            title={
              language === "english"
                ? "Playback speed"
                : "سرعت پخش"
            }
            className={`flex h-[18px] min-w-[30px] shrink-0 items-center justify-center rounded-full px-[6px] text-[11px] font-bold leading-none tabular-nums transition-all duration-200 ${
              showRate
                ? "scale-100 opacity-100"
                : "pointer-events-none scale-75 opacity-0"
            }`}
            style={{
              color: accentColor,

              backgroundColor: withAlpha(
                accentColor,
                isDark ? 0.2 : 0.14
              ),
            }}
          >
            {playbackRate}×
          </button>
        </div>
      </div>

      {playbackError && (
        <span
          role="status"
          className="sr-only"
        >
          {playbackError}
        </span>
      )}
    </div>
  );
}

export default memo(VoiceMessagePlayer);
