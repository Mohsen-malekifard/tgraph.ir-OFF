"use client";

import { memo } from "react";
import { X, RotateCw } from "lucide-react";

const CENTER = 24;
const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function UploadProgressRing({
  status,
  progress = 0,
  onCancel,
  onRetry,
  size = 48,
  background = "rgba(0,0,0,0.5)",
  label,
}) {
  const failed = status === "failed";
  const fraction =
    status === "queued"
      ? 0.1
      : Math.min(1, Math.max(0.08, Number(progress) || 0));

  const stop = (event) => event.stopPropagation();

  const handleClick = (event) => {
    event.stopPropagation();
    if (failed) onRetry?.();
    else onCancel?.();
  };

  return (
    <>
      <style>{`
        @keyframes tg-ring-spin { to { transform: rotate(360deg); } }
        .tg-ring-spin { animation: tg-ring-spin 1s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .tg-ring-spin { animation-duration: 3s; } }
      `}</style>

      <button
        type="button"
        onPointerDown={stop}
        onClick={handleClick}
        aria-label={label || (failed ? "Retry" : "Cancel")}
        className="relative flex shrink-0 items-center justify-center rounded-full text-white outline-none active:scale-95"
        style={{ width: size, height: size, backgroundColor: background }}
      >
        {!failed && (
          <svg
            className="tg-ring-spin absolute inset-0"
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${CIRCUMFERENCE * fraction} ${CIRCUMFERENCE}`}
              style={{ transition: "stroke-dasharray 200ms linear" }}
            />
          </svg>
        )}

        {failed ? (
          <RotateCw size={size * 0.46} strokeWidth={2.2} />
        ) : (
          <X size={size * 0.42} strokeWidth={2.4} />
        )}
      </button>
    </>
  );
}

export default memo(UploadProgressRing);
