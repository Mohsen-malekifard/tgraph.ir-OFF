"use client";

import { memo, useEffect, useState } from "react";

import {
  Reply,
  Copy,
  Forward,
  CircleCheck,
  Pin,
  Bookmark,
  Pencil,
  Trash,
  CircleAlert,
  SmilePlus,
} from "lucide-react";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function MessageContextMenu({
  messageMenu,
  messageMenuRef,
  language,
  theme,
  isDark,
  onClose,
  onSelectMessage,
  onReply,
  onCopy,
  onForward,
  onPin,
  onEdit,
  onDelete,
  onSave,
  onReact,
  onReport,
  isPinned = false,
  isSaved = false,
  canEdit = false,
}) {
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);

  useEffect(() => {
    setReactionPickerOpen(false);
  }, [messageMenu.key]);

  const selectMessage = () => {
    onSelectMessage(messageMenu.id);
    onClose();
  };

  const actionClass = `
    flex
    ${language === "english" ? "" : "flex-row-reverse"}
    w-full
    items-center
    gap-[12px]
    px-[14px]
    py-[11px]
    text-white
    transition-colors
    hover:bg-white/[0.06]
    active:bg-white/[0.1]
  `;

  const destructiveActionClass = `
    flex
    ${language === "english" ? "" : "flex-row-reverse"}
    w-full
    items-center
    gap-[12px]
    px-[14px]
    py-[11px]
    text-red-400
    transition-colors
    hover:bg-red-500/[0.06]
    active:bg-red-500/[0.1]
  `;

  const textColor = isDark
    ? "#ffffff"
    : "#252a38";

  const iconColor = isDark
    ? "#9ca3af"
    : "#667085";

  const isOwnMessage = Boolean(
    messageMenu.isOwnMessage
  );

  const invoke = (handler) => {
    onClose();
    handler?.(messageMenu.id);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] ${
          messageMenu.open
            ? "panels-a-backdrop-enter"
            : "panels-a-backdrop-exit"
        }`}
        onClick={onClose}
      />

      <div
        key={`panels-a-${messageMenu.key}`}
        ref={messageMenuRef}
        className={`
          message-context-menu
          fixed
          z-[100]
          w-[210px]
          overflow-hidden
          rounded-[10px]
          border
          border-white/[0.06]
          ${
            theme === "blue" && isDark
              ? "bg-[#31374F]"
              : theme === "red" && isDark
                ? "bg-[#252525]"
                : "bg-white"
          }
          py-[6px]
          shadow-[0_10px_35px_rgba(0,0,0,0.45)]
          visible
          origin-bottom
          transition-all
          duration-200
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            messageMenu.open
              ? "scale-y-100 opacity-100"
              : "scale-y-0 opacity-0"
          }
          ${
            messageMenu.open
              ? "panels-a-enter"
              : "panels-a-exit"
          }
        `}
        style={{
          left: `${messageMenu.x}px`,
          top: `${messageMenu.y}px`,
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <button
          type="button"
          className={actionClass}
          style={{ color: textColor }}
          onClick={() => invoke(onReply)}
        >
          <Reply size={20} style={{ color: iconColor }} />
          <span>{language === "english" ? "Reply" : "پاسخ"}</span>
        </button>

        <button
          type="button"
          className={actionClass}
          style={{ color: textColor }}
          onClick={() => setReactionPickerOpen((previous) => !previous)}
        >
          <SmilePlus size={20} style={{ color: iconColor }} />
          <span>{language === "english" ? "React" : "واکنش"}</span>
        </button>

        {reactionPickerOpen && (
          <div className="flex items-center justify-between gap-[2px] px-[10px] py-[7px]">
            {QUICK_REACTIONS.map((reaction) => (
              <button
                type="button"
                key={reaction}
                title={reaction}
                aria-label={`${language === "english" ? "React with" : "واکنش با"} ${reaction}`}
                onClick={() => {
                  onClose();
                  onReact?.(messageMenu.id, reaction);
                }}
                className="flex h-[29px] w-[29px] items-center justify-center rounded-full text-[19px] transition-transform hover:scale-125 hover:bg-white/10"
              >
                {reaction}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className={actionClass}
          style={{ color: textColor }}
          onClick={() => invoke(onCopy)}
        >
          <Copy size={20} style={{ color: iconColor }} />
          <span>{language === "english" ? "Copy" : "کپی"}</span>
        </button>

        <button
          type="button"
          className={actionClass}
          style={{ color: textColor }}
          onClick={() => invoke(onForward)}
        >
          <Forward size={20} style={{ color: iconColor }} />
          <span>{language === "english" ? "Forward" : "ارسال به مکالمهٔ دیگر"}</span>
        </button>

        <button
          type="button"
          className={actionClass}
          style={{ color: textColor }}
          onClick={selectMessage}
        >
          <CircleCheck
            size={20}
            style={{ color: iconColor }}
          />
          <span>{language === "english" ? "Select" : "انتخاب"}</span>
        </button>

        <div
          className={`mx-[10px] my-[5px] h-px ${
            isDark
              ? "bg-white/[0.06]"
              : theme === "blue"
                ? "bg-[#1278e6]/15"
                : "bg-[#d93636]/15"
          }`}
        />

        <button
          type="button"
          className={actionClass}
          style={{ color: textColor }}
          onClick={() => invoke(onPin)}
        >
          <Pin size={20} style={{ color: iconColor }} />
          <span>
            {isPinned
              ? language === "english" ? "Unpin" : "برداشتن سنجاق"
              : language === "english" ? "Pin" : "سنجاق پیام"}
          </span>
        </button>

        <button
          type="button"
          className={actionClass}
          style={{ color: textColor }}
          onClick={() => invoke(onSave)}
        >
          <Bookmark
            size={20}
            style={{ color: iconColor }}
            fill={isSaved ? iconColor : "none"}
          />
          <span>
            {isSaved
              ? language === "english" ? "Remove saved message" : "حذف از ذخیره‌شده‌ها"
              : language === "english" ? "Save message" : "ذخیره پیام"}
          </span>
        </button>

        {isOwnMessage && (
          <>
            <button
              type="button"
              className={actionClass}
              style={{ color: textColor }}
              disabled={!canEdit}
              onClick={() => invoke(onEdit)}
            >
              <Pencil
                size={20}
                style={{ color: iconColor }}
              />
              <span>{language === "english" ? "Edit" : "ویرایش"}</span>
            </button>

            <button
              type="button"
              className={destructiveActionClass}
              style={{
                color: isDark
                  ? "#f87171"
                  : "#dc2626",
              }}
              onClick={() => invoke(onDelete)}
            >
              <Trash size={20} />

              <span>
                {language === "english"
                  ? "Delete"
                  : "حذف پیام"}
              </span>
            </button>
          </>
        )}

        {!isOwnMessage && (
          <button
            type="button"
            className={destructiveActionClass}
            style={{
              color: isDark
                ? "#f87171"
                : "#dc2626",
            }}
            onClick={() => invoke(onReport)}
          >
            <CircleAlert size={20} />

            <span>
              {language === "english"
                ? "Report"
                : "گزارش"}
            </span>
          </button>
        )}
      </div>
    </>
  );
}

export default memo(MessageContextMenu);
