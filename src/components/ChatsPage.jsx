"use client";

import { Archive } from "lucide-react";
import Conver from "./Conver";

export default function ChatsPage({
  data,
  chatsRef,
  isScrolled,
  selectedConversation,
  selectedConversationId,
  setSelectedConversation,
  setSelectedData,
  setIsScrolled,
  setActiveMenu,
  language,
  isSelectionMode,
  selectedChatIds,
  onToggleSelect,
  accentColor,
  checkBorderColor,
  archivedRow,
}) {
  const checkedIds = Array.isArray(selectedChatIds) ? selectedChatIds : [];
  const isEnglish = language === "english";

  const toggleSelect = (conversationId) => {
    if (conversationId && onToggleSelect) {
      onToggleSelect(conversationId);
    }
  };

  const archivedCount = Number(archivedRow?.count) || 0;
  const archivedPreview = isEnglish
    ? "Your archived conversations"
    : "مکالمه‌هایی که بایگانی کرده‌اید";

  return (
    <div
      ref={chatsRef}
      onScroll={(event) => {
        setIsScrolled(event.currentTarget.scrollTop > 10);
      }}
      className={`
        w-full
        min-h-0
        flex-1
        flex flex-col
        overflow-y-auto
        overflow-x-hidden
        scrollbar-none
        gap-0
        transition-[padding]
        duration-300
        ease-out
        ${isScrolled || isSelectionMode ? "pt-[45px]" : "pt-[50px]"}
      `}
    >
      {archivedRow?.visible && (
        <button
          type="button"
          onClick={archivedRow.onClick}
          className={`
            group
            relative
            flex
            min-h-[78px]
            w-full
            flex-row
            items-center
            gap-[14px]
            px-[14px]
            py-[9px]
            text-left
            select-none
            border-b border-white/[0.055]
            transition-colors duration-200 ease-out
            ${
              archivedRow.active
                ? "bg-[#30364d]"
                : "bg-transparent hover:bg-white/[0.035] active:bg-white/[0.055]"
            }
          `}
        >
          <span className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-[#41485f] text-[#f1f3fa] shadow-[0_3px_12px_rgba(0,0,0,0.18)]">
            <Archive size={25} strokeWidth={2.15} />
          </span>

          <span
            className={`flex min-w-0 flex-1 flex-col justify-center gap-[5px] ${
              isEnglish ? "text-left" : "text-right"
            }`}
          >
            <span className="truncate text-[16px] font-semibold leading-[21px] tracking-[-0.2px] text-[#f3f4f8]">
              {archivedRow.active
                ? isEnglish
                  ? "Back to Chats"
                  : "بازگشت به مکالمه‌ها"
                : isEnglish
                  ? "Archived Chats"
                  : "مکالمه‌های بایگانی‌شده"}
            </span>
            <span
              dir={isEnglish ? "ltr" : "rtl"}
              className="truncate text-[14px] font-normal leading-[19px] text-[#9da3b5]"
            >
              {archivedPreview}
            </span>
          </span>

          <span className="flex h-[25px] min-w-[25px] shrink-0 items-center justify-center rounded-full bg-[#46506f] px-[7px] text-[12px] font-semibold leading-none text-[#e4e9ff]">
            {archivedCount.toLocaleString(isEnglish ? "en-US" : "fa-IR")}
          </span>
        </button>
      )}

      {data.map((item, index) => (
        <div
          key={item.conversationId ?? index}
          className={index === data.length - 1 ? "mb-[120px]" : ""}
        >
          <Conver
            language={language}
            title={item.title}
            category={item.category}
            username={item.username}
            dateE={item.dateE}
            dateP={item.dateP}
            lastMessageText={item.lastMessageText}
            avatarUrl={item.avatarUrl}
            unreadCount={item.unreadCount}
            isPinned={item.isPinned}
            isMuted={item.isMuted}
            colorClasses={item.colorClasses}
            selected={
              item.conversationId
                ? selectedConversationId === item.conversationId
                : selectedConversation === index
            }
            checked={checkedIds.includes(item.conversationId)}
            accentColor={accentColor}
            checkBorderColor={checkBorderColor}
            onLongPress={() => toggleSelect(item.conversationId)}
            onClick={() => {
              if (isSelectionMode) {
                toggleSelect(item.conversationId);
                return;
              }

              setSelectedConversation(index);
              setActiveMenu("chat");
              setSelectedData(item);
            }}
          />
        </div>
      ))}
    </div>
  );
}
