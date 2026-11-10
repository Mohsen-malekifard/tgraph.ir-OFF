"use client";

import { useRef } from "react";
import { BellOff, Check, Pin, Users, Megaphone } from "lucide-react";

export default function Conver({
  title,
  category,
  username,
  lastMessageText,
  avatarUrl,
  unreadCount = 0,
  dateE,
  dateP,
  isPinned,
  isMuted,
  colorClasses,
  selected,
  checked,
  accentColor,
  checkBorderColor,
  onClick,
  onLongPress,
  language,
}) {
  const pressTimer = useRef(null);
  const pressStart = useRef({ x: 0, y: 0 });
  const longPressed = useRef(false);

  const clearPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerDown = (e) => {
    longPressed.current = false;

    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }

    pressStart.current = { x: e.clientX, y: e.clientY };

    clearPress();

    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      longPressed.current = true;

      if (onLongPress) {
        onLongPress();
      }
    }, 450);
  };

  const handlePointerMove = (e) => {
    if (!pressTimer.current) {
      return;
    }

    const dx = Math.abs(e.clientX - pressStart.current.x);
    const dy = Math.abs(e.clientY - pressStart.current.y);

    if (dx > 10 || dy > 10) {
      clearPress();
    }
  };

  const handleClick = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }

    if (onClick) {
      onClick();
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();

    if (longPressed.current) {
      return;
    }

    clearPress();
    longPressed.current = true;

    if (onLongPress) {
      onLongPress();
    }
  };

  return (
    <div
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
      onContextMenu={handleContextMenu}
      className={`
        w-full h-[75px] flex ${
          language == "english" ? "flex-row" : "flex-row-reverse"
        } items-center justify-between relative px-[12.5px] py-[10px] 
        cursor-pointer select-none [-webkit-touch-callout:none]
        transition-colors duration-200 ease-out
        border-b-1 border-gray-300/10 
        ${
          checked
            ? "bg-white/[0.08]"
            : selected
              ? "bg-white/[0.08]"
              : "bg-transparent hover:bg-white/[0.03]"
        }
      `}
      style={
        checked
          ? {
              backgroundColor: `${accentColor}18`,
              boxShadow: `inset 0 0 0 1px ${accentColor}4D`,
            }
          : undefined
      }
    >
      <div
        className={`flex ${
          language == "english" ? "flex-row" : "flex-row-reverse"
        } gap-[15px]`}
      >
        <div className="relative w-[55px] h-[55px] shrink-0">
          <div className="relative h-[55px] w-[55px] shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" draggable={false} className="h-[55px] w-[55px] rounded-full object-cover" />
            ) : (
              <div className={`flex h-[55px] w-[55px] items-center justify-center rounded-full bg-conic-180 ${colorClasses} text-white`}>
                {category === "Group" ? <Users size={21} /> : category === "Channel" ? <Megaphone size={21} /> : null}
              </div>
            )}
            {unreadCount > 0 && (
              <span className="absolute -bottom-[2px] -left-[3px] flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-[2px] border-[#1d202e] bg-[#3f86dc] px-[4px] text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div
            className={`absolute -bottom-[2px] -right-[2px] flex h-[24px] w-[24px] items-center justify-center rounded-full border-[2px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.32)] ring-[2px] ring-black/20 transition-all duration-200 ease-out ${
              checked ? "scale-100 opacity-100" : "scale-0 opacity-0"
            }`}
            style={{
              backgroundColor: accentColor,
              borderColor: checkBorderColor,
            }}
          >
            <Check size={13} strokeWidth={3} />
          </div>
        </div>

        <div
          className={`flex flex-col ${
            language == "english" ? "text-left" : "text-right"
          } justify-center leading-[23px]`}
        >
          <div className={`flex min-w-0 items-center gap-[7px] ${language === "english" ? "flex-row" : "flex-row-reverse"}`}>
            <span className="truncate text-white font-semibold">{title}</span>
            {category === "Group" && <span className="shrink-0 rounded-full bg-white/[0.07] px-[6px] py-[1px] text-[9px] text-white/45">{language === "english" ? "GROUP" : "گروه"}</span>}
            {category === "Channel" && <span className="shrink-0 rounded-full bg-white/[0.07] px-[6px] py-[1px] text-[9px] text-white/45">{language === "english" ? "CHANNEL" : "کانال"}</span>}
          </div>

          <span
            dir={language === "english" ? "ltr" : "rtl"}
            className={`line-clamp-1 text-[13px] text-gray-500 ${language === "english" ? "pr-[20px] text-left" : "pl-[20px] text-right"}`}
          >
            {lastMessageText || (category === "Channel"
              ? username ? `@${username}` : (language === "english" ? "Channel" : "کانال")
              : category === "Group"
                ? (language === "english" ? "Group conversation" : "گفتگوی گروهی")
                : (language === "english" ? "No messages yet" : "هنوز پیامی ارسال نشده است"))}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-[5px] text-nowrap">
        <div className="flex items-center gap-[4px]">
          {isMuted && (
            <span className="text-gray-500">
              <BellOff size={14} />
            </span>
          )}

          {language == "english" ? (
            <span className="text-gray-500 font-normal text-sm" dir="ltr">
              {dateE}
            </span>
          ) : (
            <span className="text-gray-500 font-normal text-sm" dir="rtl">
              {dateP}
            </span>
          )}
        </div>

        <div
          className={`${
            isPinned ? "" : "hidden"
          } w-[22px] h-[22px] flex items-center justify-center rounded-full border-[0.9px] border-gray-500`}
        >
          <span className="text-gray-500">
            <Pin size={12} className="fill-current rotate-45" />
          </span>
        </div>
      </div>
    </div>
  );
}
