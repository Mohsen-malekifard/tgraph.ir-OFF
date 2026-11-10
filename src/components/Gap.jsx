"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Clock, AlertCircle } from "lucide-react";

export default function Gap({
  children,

  // Unique message ID
  messageId,

  // Message side
  side = "right",

  // Timestamp
  time = "",

  // Font size for message text
  messageTextSize = 14,

  // Bubble corner size
  messageCornerSize = 16,

  // Selection state
  selected = false,
  onSelect,

  // Long Press callback
  onLongPress,

  // Selection mode flag
  selectionMode = false,

  // Delivery status: "sending" | "failed" | "sent" | "delivered" | "read"
  status = "read",

  // Show checkmarks
  showChecks = true,

  // Reply object { name, text }
  replyTo = null,

  // Media view node
  media = null,

  // Media width in px
  mediaWidth = null,

  // Time overlay on media (when there's no caption)
  timeOverlay = false,

  // Message menu opener
  onMessageMenu,

  // Custom classNames
  className = "",
  bubbleClassName = "",
}) {
  const { theme, isDark } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef(null);

  const isRight = side === "right";
  const isBlueTheme = theme === "blue";

  // Telegram-inspired Color Accents
  const accentColor = isBlueTheme
    ? isDark
      ? "#64b5f6"
      : "#2481cc"
    : isDark
      ? "#e57373"
      : "#d32f2f";

  // Dynamic Theme Styling Classes
  const messageTextClass = isDark
    ? "text-white"
    : isBlueTheme
      ? "text-[#111827]"
      : "text-[#2d1515]";

  const messageBackgroundClass = isDark
    ? isBlueTheme
      ? isRight
        ? "bg-[#2b5278]"
        : "bg-[#18222d]"
      : isRight
        ? "bg-[#5c2d30]"
        : "bg-[#1f1f1f]"
    : isBlueTheme
      ? isRight
        ? "bg-[#eeffde] md:bg-[#effedd]"
        : "bg-[#ffffff]"
      : isRight
        ? "bg-[#ffebee]"
        : "bg-[#ffffff]";

  const messageBorderClass = isDark
    ? "border-transparent"
    : isBlueTheme
      ? isRight
        ? "border-[#d0f5be]"
        : "border-[#e0e0e0]"
      : isRight
        ? "border-[#ffcdd2]"
        : "border-[#e0e0e0]";

  const messageTimeClass = isDark
    ? isRight
      ? "text-[#87bba2] md:text-white/65"
      : "text-white/45"
    : isBlueTheme
      ? isRight
        ? "text-[#6c9c58]"
        : "text-[#9ca3af]"
      : isRight
        ? "text-[#c67c7c]"
        : "text-[#9ca3af]";

  const replyBackgroundClass = isDark
    ? "bg-black/20"
    : isBlueTheme
      ? "bg-[#000000]/[0.04]"
      : "bg-[#000000]/[0.04]";

  const replyNameClass = isDark
    ? "text-[#64b5f6]"
    : isBlueTheme
      ? "text-[#2481cc]"
      : "text-[#d32f2f]";

  const replyTextClass = isDark
    ? "text-white/70"
    : "text-[#6b7280]";

  const selectedBackgroundColor = isDark
    ? "rgba(100, 181, 246, 0.16)"
    : "rgba(36, 129, 204, 0.12)";

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (e) => {
    if (selectionMode) {
      longPressTriggered.current = false;
      setIsPressed(false);
      return;
    }

    pointerStart.current = { x: e.clientX, y: e.clientY };
    longPressTriggered.current = false;

    if (bubbleRef.current?.contains(e.target)) {
      setIsPressed(true);
    } else {
      setIsPressed(false);
    }

    clearLongPress();

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setIsPressed(false);
      onSelect?.();
      onLongPress?.();
    }, 500);
  };

  const handlePointerMove = (e) => {
    if (selectionMode) return;

    const diffX = Math.abs(e.clientX - pointerStart.current.x);
    const diffY = Math.abs(e.clientY - pointerStart.current.y);

    if (diffX > 8 || diffY > 8) {
      clearLongPress();
      setIsPressed(false);
    }
  };

  const handlePointerUp = () => {
    clearLongPress();
    setIsPressed(false);
  };

  const handleClick = (e) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    if (selectionMode) {
      onSelect?.();
      return;
    }

    if (!onMessageMenu || !messageId || !bubbleRef.current) return;

    const bubbleRect = bubbleRef.current.getBoundingClientRect();
    onMessageMenu({
      id: messageId,
      y: e.clientY,
      side,
      bubbleRect: {
        left: bubbleRect.left,
        right: bubbleRect.right,
        top: bubbleRect.top,
        bottom: bubbleRect.bottom,
      },
    });
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType === "mouse" && !selectionMode) {
      clearLongPress();
      setIsPressed(false);
    }
  };

  useEffect(() => {
    return () => clearLongPress();
  }, []);

  const renderStatus = (overlay = false) => {
    if (!isRight || !showChecks || !time) return null;

    const idleColor = overlay
      ? "#ffffff"
      : isDark
        ? "rgba(255,255,255,0.6)"
        : isBlueTheme
          ? "#58a74c"
          : "#e53935";

    if (status === "sending") {
      return (
        <span className="ms-[4px] inline-flex h-[12px] w-[12px] shrink-0 items-center justify-center align-middle" aria-label="Sending">
          <Clock size={11} strokeWidth={2} color={idleColor} />
        </span>
      );
    }

    if (status === "failed") {
      return (
        <span className="ms-[4px] inline-flex h-[12px] w-[12px] shrink-0 items-center justify-center align-middle" aria-label="Failed">
          <AlertCircle size={11} strokeWidth={2.2} color="#ef4444" />
        </span>
      );
    }

    if (status === "sent") {
      return (
        <span className="ms-[4px] inline-flex h-[12px] shrink-0 items-center align-middle" aria-label="Sent">
          <CheckIcon color={idleColor} />
        </span>
      );
    }

    const checkColor = overlay
      ? "#ffffff"
      : status === "read"
        ? isDark
          ? "#4ade80"
          : "#22c55e"
        : idleColor;

    return (
      <span className="ms-[4px] inline-flex h-[12px] shrink-0 items-center align-middle" aria-label={status === "read" ? "Read" : "Delivered"}>
        <CheckIcon className="relative z-[1]" color={checkColor} />
        <CheckIcon className="-ms-[7px]" color={checkColor} />
      </span>
    );
  };

  return (
    <div
      className={`relative flex w-full min-w-0 px-[10px] py-[2.5px] ${isRight ? "justify-end" : "justify-start"} ${className}`}
      style={{ touchAction: "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
    >
      {/* Selection Highlight Backdrop */}
      {selected && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-colors"
          style={{ backgroundColor: selectedBackgroundColor }}
        />
      )}

      {/* Interactive Bubble Element */}
      <div
        ref={bubbleRef}
        dir="auto"
        className={`
          relative z-10 min-w-0 max-w-[85%] sm:max-w-[70%] overflow-hidden select-none border
          ${messageBorderClass} ${messageBackgroundClass} ${messageTextClass}
          shadow-[0_1px_2.5px_rgba(0,0,0,0.08)]
          transition-transform duration-100 ease-out motion-reduce:transition-none
          ${isPressed ? "scale-[0.98]" : "scale-100"}
          ${bubbleClassName}
        `}
        style={{
          borderRadius: `${messageCornerSize}px`,
          ...(media && mediaWidth ? { width: `${mediaWidth}px` } : {}),
          ...(isRight
            ? { borderBottomRightRadius: "4px" }
            : { borderBottomLeftRadius: "4px" }),
        }}
      >
        {/* Reply Quote Section */}
        {replyTo && (
          <div
            className={`
              relative mx-[6px] mt-[6px] min-w-0 overflow-hidden rounded-[8px]
              ${replyBackgroundClass} px-[10px] py-[5px] border-s-[3px]
            `}
            style={{ borderInlineStartColor: accentColor }}
          >
            <div className="min-w-0 space-y-[1px]">
              {replyTo.name && (
                <div className={`truncate text-[12.5px] font-semibold leading-[1.3] ${replyNameClass}`}>
                  {replyTo.name}
                </div>
              )}
              {replyTo.text && (
                <div className={`truncate text-[11.5px] font-normal leading-[1.35] ${replyTextClass}`}>
                  {replyTo.text}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Media Container */}
        {media && (
          <div className={`relative ${replyTo ? "mt-[5px]" : ""}`}>
            {media}
            {timeOverlay && !children && time && (
              <span
                dir="ltr"
                className="pointer-events-none absolute bottom-[6px] right-[6px] inline-flex items-center gap-[2px] rounded-full bg-black/50 px-[8px] py-[3px] text-[10.5px] font-medium leading-[12px] text-white backdrop-blur-md"
              >
                <span>{time}</span>
                {renderStatus(true)}
              </span>
            )}
          </div>
        )}

        {/* Message Content & Timestamp Flow */}
        {(!media || children) && (
          <div
            dir="auto"
            className="min-w-0 whitespace-pre-wrap break-words px-[11px] pt-[7px] pb-[6px] font-normal leading-[1.45]"
            style={{ fontSize: `${messageTextSize}px` }}
          >
            {children}

            {/* Inline Meta Timestamp */}
            {time && (
              <span
                className={`
                  relative top-[1.5px] ms-[6px] inline-flex shrink-0 items-center whitespace-nowrap align-baseline text-[10.5px] font-normal leading-[11px] ${messageTimeClass}
                `}
              >
                <span>{time}</span>
                {renderStatus()}
              </span>
            )}
          </div>
        )}

        {/* Separate Timestamp for Media with No Caption */}
        {media && !children && !timeOverlay && time && (
          <div className={`flex justify-end px-[10px] pb-[6px] pt-[2px] text-[10.5px] leading-[11px] ${messageTimeClass}`}>
            <span className="inline-flex items-center whitespace-nowrap">
              <span>{time}</span>
              {renderStatus()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckIcon({ className = "", color = "currentColor" }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.5 8.5L5.5 11.5L13.5 3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
