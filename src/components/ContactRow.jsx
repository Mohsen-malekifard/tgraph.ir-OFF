"use client";

import { useState } from "react";

import { Check } from "lucide-react";

import {
  formatLastSeen,
  getAvatarGradient,
  getContactInitials,
  getPhoneKey,
} from "@/lib/contacts";

export function ContactAvatar({
  item,
  size = 44,
  selected = false,
  palette,
}) {
  const [broken, setBroken] = useState(false);

  const source = item.avatar || item.photo || item.avatarUrl || "";

  const showImage = Boolean(source) && !broken;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={source}
          alt=""
          draggable={false}
          onError={() => setBroken(true)}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full select-none items-center justify-center rounded-full bg-linear-to-b font-medium text-white ${getAvatarGradient(
            getPhoneKey(item.mobile)
          )}`}
          style={{ fontSize: Math.round(size * 0.45) }}
        >
          {getContactInitials(item.title)}
        </div>
      )}

      {/* Selection badge (always mounted so it can pop in and out) */}

      <span
        aria-hidden={!selected}
        className={`absolute -bottom-[2px] -right-[2px] flex h-[20px] w-[20px] items-center justify-center rounded-full border-2 text-white ${
          palette?.accentFill || "bg-[#4f7df0]"
        }`}
        style={{
          borderColor: palette?.pageHex || "#212641",
          transform: selected ? "scale(1)" : "scale(0)",
          opacity: selected ? 1 : 0,
          transition:
            "transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 120ms ease-out",
        }}
      >
        <Check size={12} strokeWidth={3.5} />
      </span>
    </div>
  );
}

export default function ContactRow({
  item,
  language,
  palette,
  avatarSize = 44,
  selected = false,
  highlighted = false,
  loading = false,
  onClick,
}) {
  const isEnglish = language === "english";

  const lastSeenText = formatLastSeen(item.lastSeen, language);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
      className={`flex w-full cursor-pointer items-center gap-[14px] px-[13px] py-[6px] transition-colors duration-200 hover:bg-white/[0.05] active:bg-white/10 ${
        isEnglish ? "flex-row" : "flex-row-reverse"
      } ${highlighted ? "bg-white/[0.08]" : ""}`}
    >
      <ContactAvatar
        item={item}
        size={avatarSize}
        selected={selected}
        palette={palette}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <span
          dir="auto"
          className={`truncate text-[16px] font-medium leading-[22px] text-white ${
            isEnglish ? "text-left" : "text-right"
          }`}
        >
          {item.title}
        </span>

        <span
          dir={lastSeenText ? "auto" : "ltr"}
          className={`truncate text-[14px] leading-[22px] text-white/50 ${
            lastSeenText && !isEnglish ? "text-right" : "text-left"
          }`}
        >
          {lastSeenText || item.mobile}
        </span>
      </div>

      {loading && (
        <div className="h-[17px] w-[17px] shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white" />
      )}
    </div>
  );
}
