"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { apiFetch } from "@/lib/api";

function getId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }

  return String(value);
}

export default function MessageForwardDialog({
  message,
  language,
  theme,
  isDark,
  onClose,
  onSelectConversation,
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingTo, setSendingTo] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setLoading(true);
      setError("");

      try {
        const [privateResponse, groupChannelResponse] = await Promise.all([
          apiFetch("/api/conversations?limit=100"),
          apiFetch("/api/conversations/groups-channels?limit=100"),
        ]);

        if (cancelled) {
          return;
        }

        const privateItems = Array.isArray(privateResponse?.conversations)
          ? privateResponse.conversations
          : [];
        const groupChannelItems = Array.isArray(groupChannelResponse?.conversations)
          ? groupChannelResponse.conversations
          : [];

        const normalized = [...privateItems, ...groupChannelItems]
          .map((item) => {
            const conversation = item?.conversation;
            const peer = item?.peer;
            const conversationId = getId(conversation);
            const type = conversation?.type || "private";

            if (!conversationId) return null;
            if (type === "private" && !peer) return null;

            if (type === "private") {
              const fullName = [peer.firstName, peer.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
              return {
                conversationId,
                title: fullName || (peer.username
                  ? `@${peer.username}`
                  : (language === "english" ? "Unknown user" : "کاربر ناشناس")),
                subtitle: peer.username ? `@${peer.username}` : "",
              };
            }

            return {
              conversationId,
              title: conversation.title || (language === "english" ? "Conversation" : "گفتگو"),
              subtitle: type === "channel"
                ? (language === "english" ? "Channel" : "کانال")
                : (language === "english" ? "Group" : "گروه"),
            };
          })
          .filter(Boolean);

        setConversations(normalized);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError?.message ||
              (language === "english"
                ? "Could not load conversations."
                : "دریافت مکالمه‌ها ناموفق بود.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [language]);

  const panelClass = isDark
    ? theme === "blue"
      ? "bg-[#212641]"
      : "bg-[#252525]"
    : theme === "blue"
      ? "bg-[#dceaff]"
      : "bg-[#ffe0e0]";

  const textClass = isDark ? "text-white" : "text-[#253651]";

  const handleSelect = async (conversationId) => {
    if (sendingTo) {
      return;
    }

    setSendingTo(conversationId);

    try {
      await onSelectConversation(conversationId, message);
    } catch (selectError) {
      setError(
        selectError?.message ||
          (language === "english"
            ? "Could not forward this message."
            : "ارسال پیام به مکالمهٔ مقصد ناموفق بود.")
      );
      setSendingTo("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/65 px-[20px] backdrop-blur-md"
      onClick={onClose}
    >
      <div
        dir={language === "english" ? "ltr" : "rtl"}
        className={`w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl ${panelClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/10 px-[18px] py-[15px]">
          <h2 className={`text-[17px] font-semibold ${textClass}`}>
            {language === "english" ? "Forward message" : "ارسال پیام به مکالمهٔ دیگر"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(sendingTo)}
            className={`${textClass} opacity-70 disabled:opacity-40`}
            aria-label={language === "english" ? "Close" : "بستن"}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-[18px] py-[12px]">
          <p className={`line-clamp-3 break-words text-[13px] opacity-70 ${textClass}`}>
            {message?.text || (language === "english" ? "This message has no text to forward." : "این پیام متن قابل ارسالی ندارد.")}
          </p>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-[8px] pb-[8px]">
          {loading ? (
            <div className={`px-[12px] py-[24px] text-center text-sm opacity-65 ${textClass}`}>
              {language === "english" ? "Loading conversations..." : "در حال دریافت مکالمه‌ها..."}
            </div>
          ) : error ? (
            <div role="alert" className="px-[12px] py-[20px] text-center text-sm text-red-500">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className={`px-[12px] py-[24px] text-center text-sm opacity-65 ${textClass}`}>
              {language === "english" ? "No conversations available." : "مکالمه‌ای برای انتخاب وجود ندارد."}
            </div>
          ) : (
            conversations.map((item) => (
              <button
                type="button"
                key={item.conversationId}
                disabled={Boolean(sendingTo)}
                onClick={() => void handleSelect(item.conversationId)}
                className={`flex w-full items-center gap-[12px] rounded-xl px-[12px] py-[11px] text-start transition-colors hover:bg-black/5 disabled:opacity-50 ${textClass}`}
              >
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-black/10 text-[15px] font-semibold">
                  {item.title.trim().charAt(0).toUpperCase() || "?"}
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[14px] font-medium">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="truncate text-[12px] opacity-60">
                      {item.subtitle}
                    </span>
                  )}
                </span>

                {sendingTo === item.conversationId && (
                  <span className="h-[17px] w-[17px] shrink-0 animate-spin rounded-full border-2 border-current/20 border-t-current" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
