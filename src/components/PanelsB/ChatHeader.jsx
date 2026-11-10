"use client";

import { memo } from "react";
import { X, EllipsisVertical, Search, Reply } from "lucide-react";

function ChatHeader({
  selectedData,
  language,
  isClicked,
  selectedMessages,
  onClearSelection,
  onCloseChat,
  onOpenPreview,
  onOpenMenu,
}) {
  return (
    <div
      className={`fixed z-40 flex ${
        language == "english" ? "flex-row" : "flex-row"
      } w-full gap-[10px] pt-[20px] px-[10px]`}
    >
      {selectedMessages.length > 0 ? (
        <>
          {/* لغو انتخاب همه */}
          <div
            onClick={onClearSelection}
            className="
                    text-white
                    flex
                    items-center
                    justify-center
                    w-[45px]
                    h-[45px]
                    flex-none
                    rounded-full
                    backdrop-blur-xl
                    backdrop-saturate-150
                    border
                    border-white/[0.04]
                    bg-[#2b2b2b]/50
                    cursor-pointer
                  "
          >
            <X size={24} />
          </div>

          {/* تعداد پیام‌های انتخاب‌شده */}
          <div
            className="
                    flex
                    items-center
                    px-[15px]
                    h-[45px]
                    grow
                    rounded-full
                    backdrop-blur-xl
                    backdrop-saturate-150
                    border
                    border-white/[0.04]
                    bg-[#2b2b2b]/50
                    text-white
                    text-[16px]
                    font-semibold
                  "
          >
            {selectedMessages.length}
          </div>

          {/* Reply */}
          <div
            className="
                    text-white
                    flex
                    items-center
                    justify-center
                    w-[45px]
                    h-[45px]
                    flex-none
                    rounded-full
                    backdrop-blur-xl
                    backdrop-saturate-150
                    border
                    border-white/[0.04]
                    bg-[#2b2b2b]/50
                    cursor-pointer
                  "
          >
            <Reply size={22} />
          </div>
        </>
      ) : (
        <>
          {/* Close */}
          <div
            onClick={onCloseChat}
            className="
                    text-white
                    flex
                    items-center
                    justify-center
                    w-[45px]
                    h-[45px]
                    flex-none
                    rounded-full
                    backdrop-blur-xl
                    backdrop-saturate-150
                    border
                    border-white/[0.04]
                    bg-[#2b2b2b]/50
                  "
          >
            <X />
          </div>

          {/* Chat name */}
          <div
            onClick={onOpenPreview}
            className={`
                    ${isClicked ? "px-[25px]" : "px-[2.5px]"}
                    transition-all
                    duration-700
                    flex

                    ${
                      language == "english"
                        ? "flex-row justify-start"
                        : "flex-row justify-start"
                    }

                    items-center

                    gap-[10px]
                    h-[45px]
                    grow
                    rounded-full
                    backdrop-blur-xl
                    backdrop-saturate-150
                    border
                    border-white/[0.04]
                    bg-[#2b2b2b]/50
                  `}
          >
            <div
              className={`
                      shrink-0
                      w-[40px]
                      h-[40px]
                      ml-[2px]
                      rounded-full
                      bg-conic-180
                      ${selectedData?.colorClasses}
                    `}
            />

            <span
              className="text-white line-clamp-1 text-start max-md:pr-[12.5px]"
              dir="rtl"
            >
              {selectedData?.title}
            </span>
          </div>

          {/* Search + Menu */}
          <div
            className={`
                    relative
                    text-white
                    flex

                    ${language == "english" ? "flex-row" : "flex-row"}

                    items-center
                    justify-around
                    w-[100px]
                    h-[45px]
                    flex-none
                    rounded-full
                    backdrop-blur-xl
                    backdrop-saturate-150
                    border
                    border-white/[0.04]
                    bg-[#2b2b2b]/50
                  `}
          >
            <Search />

            <span onClick={onOpenMenu}>
              <EllipsisVertical />
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default memo(ChatHeader);
