"use client";

import { memo } from "react";
import { Pin, Bookmark } from "lucide-react";

import Gap from "../Gap";
import AttachmentView, { getAttachmentLayout } from "../chat/AttachmentView";
import PendingUploads from "../chat/PendingUploads";
import { useUploads } from "@/lib/uploadQueue";
import VoiceMessagePlayer from "./VoiceMessagePlayer";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function getId(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }

  return String(value);
}

function getAttachments(message) {
  if (Array.isArray(message?.attachments) && message.attachments.length) {
    return message.attachments.filter(Boolean);
  }

  if (message?.attachment && typeof message.attachment === "object") {
    return [message.attachment];
  }

  return [];
}

function getPrimaryAttachment(message) {
  const attachments = getAttachments(message);
  if (!attachments.length) return null;

  const messageType = String(message?.type || "").toLowerCase();
  const matching = attachments.find((attachment) => {
    const type = String(attachment?.type || attachment?.kind || "").toLowerCase();
    return type === messageType;
  });

  return matching || attachments[0];
}

function getAttachmentKind(message, attachment) {
  return String(
    attachment?.type ||
      attachment?.kind ||
      message?.type ||
      ""
  ).toLowerCase();
}

function getDisplayText(message, language, hasAttachment = false) {
  if (typeof message?.text === "string" && message.text) {
    return message.text;
  }

  // Media captions are optional. Do not inject placeholder text into a media bubble.
  if (hasAttachment) return "";

  if (message?.type === "image") {
    return language === "english" ? "Image" : "تصویر";
  }

  if (message?.type === "video") {
    return language === "english" ? "Video" : "ویدئو";
  }

  if (message?.type === "voice" || message?.type === "audio") {
    return language === "english" ? "Audio message" : "پیام صوتی";
  }

  if (message?.type === "file") {
    return language === "english" ? "File" : "فایل";
  }

  return "";
}

function formatTime(value, language) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString(
    language === "english" ? "en-US" : "fa-IR",
    { hour: "2-digit", minute: "2-digit" }
  );
}

function getDateKey(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-");
}

function formatDateLabel(value, language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  if (getDateKey(date) === getDateKey(today)) {
    return language === "english" ? "Today" : "امروز";
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (getDateKey(date) === getDateKey(yesterday)) {
    return language === "english" ? "Yesterday" : "دیروز";
  }

  return date.toLocaleDateString(
    language === "english" ? "en-US" : "fa-IR",
    { year: "numeric", month: "short", day: "numeric" }
  );
}

function getReplyData(message, language) {
  const reply = message?.replyTo;
  if (!reply || typeof reply !== "object") return null;

  const sender = reply.sender;
  const senderName =
    typeof sender === "object" && sender !== null
      ? [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim() ||
        (sender.username ? `@${sender.username}` : "")
      : "";

  const replyText = typeof reply.text === "string" ? reply.text : "";

  return {
    name:
      senderName ||
      (language === "english" ? "Reply" : "پاسخ به پیام"),
    text: reply.deletedAt
      ? language === "english"
        ? "Message deleted"
        : "پیام حذف شده است"
      : replyText || (language === "english" ? "Message" : "پیام"),
  };
}

function getForwardedFrom(message, language) {
  const forwardedFrom = message?.forwardedFrom;
  if (!forwardedFrom || typeof forwardedFrom !== "object") return "";

  const sender = forwardedFrom.sender;
  const senderName =
    typeof sender === "object" && sender
      ? [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim() ||
        (sender.username ? `@${sender.username}` : "")
      : "";

  if (forwardedFrom.deletedAt || !senderName) {
    return language === "english"
      ? "Forwarded message"
      : "پیام بازفرستاده‌شده";
  }

  return language === "english"
    ? `Forwarded from ${senderName}`
    : `ارسال‌شده از طرف ${senderName}`;
}

function getReactionGroups(message, currentUserId) {
  const reactions = Array.isArray(message?.reactions) ? message.reactions : [];
  const groups = new Map();

  for (const entry of reactions) {
    const emoji = String(entry?.reaction || "").trim();
    if (!emoji) continue;

    if (!groups.has(emoji)) {
      groups.set(emoji, { emoji, count: 0, selected: false });
    }

    const group = groups.get(emoji);
    group.count += 1;

    if (currentUserId && getId(entry.user) === currentUserId) {
      group.selected = true;
    }
  }

  return [...groups.values()];
}

function getVoiceAttachment(message) {
  const attachments = getAttachments(message);
  const voice = attachments.find((attachment) => {
    const type = String(attachment?.type || attachment?.kind || "").toLowerCase();
    return type === "voice";
  });

  // Some server message shapes mark the message as voice while the stored
  // attachment itself retains the generic audio kind.
  return voice || (message?.type === "voice" ? attachments[0] || null : null);
}

/*
|--------------------------------------------------------------------------
| Message Bubble
|--------------------------------------------------------------------------
*/

const MessageItem = memo(function MessageItem({
  item,
  currentUserId,
  language,
  onMessageMenu,
  onToggleMessage,
  onToggleReaction,
  selected,
  selectionMode,
  textSize,
  cornerSize,
  isSaved,
  theme,
  isDark,
  showSenderName = false,
}) {
  const messageId = getId(item._id ?? item.id);
  const senderId = getId(item.sender);
  const isOwnMessage = Boolean(currentUserId && senderId && senderId === currentUserId);
  const side = isOwnMessage ? "right" : "left";
  const sender = item.sender && typeof item.sender === "object" ? item.sender : null;
  const senderName = sender
    ? [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim() || (sender.username ? `@${sender.username}` : "")
    : "";

  const attachment = getPrimaryAttachment(item);
  const attachmentKind = getAttachmentKind(item, attachment);
  const hasMediaAttachment = Boolean(
    item.type !== "voice" &&
      attachmentKind !== "voice" &&
      attachment &&
      ["image", "video", "file", "audio"].includes(attachmentKind) &&
      typeof attachment.url === "string" &&
      attachment.url
  );

  const isVoiceMessage =
    item.type === "voice" ||
    String(attachment?.type || attachment?.kind || "").toLowerCase() === "voice";

  const content = getDisplayText(item, language, hasMediaAttachment);
  const time = formatTime(item.createdAt, language);
  const replyTo = getReplyData(item, language);
  const forwardedLabel = getForwardedFrom(item, language);
  const reactionGroups = getReactionGroups(item, currentUserId);
  const voiceAttachment = getVoiceAttachment(item);
  const normalizedAttachment = hasMediaAttachment
    ? {
        ...attachment,
        type: attachment.type || attachment.kind || attachmentKind,
      }
    : null;

  const mediaLayout = normalizedAttachment
    ? getAttachmentLayout(normalizedAttachment)
    : null;

  const mediaNode = normalizedAttachment ? (
    <AttachmentView
      attachment={normalizedAttachment}
      language={language}
    />
  ) : null;

  const hasMessageBody = Boolean(
    (isVoiceMessage && voiceAttachment) ||
      forwardedLabel ||
      content ||
      item.editedAt
  );

  const messageBody = hasMessageBody
    ? isVoiceMessage && voiceAttachment
      ? (
          <VoiceMessagePlayer
            attachment={voiceAttachment}
            language={language}
            theme={theme}
            isDark={isDark}
          />
        )
      : (
          <>
            {forwardedLabel && (
              <span className="mb-[3px] block text-[10px] font-medium opacity-60">
                {forwardedLabel}
              </span>
            )}

            {content}

            {item.editedAt && (
              <span className="ms-[5px] text-[10px] opacity-55">
                {language === "english" ? "(edited)" : "(ویرایش‌شده)"}
              </span>
            )}
          </>
        )
    : null;

  return (
    <div className="flex min-w-0 w-full flex-col">
      {showSenderName && !isOwnMessage && senderName && (
        <span className="mb-[3px] px-[17px] text-[11px] font-semibold text-white/55">
          {senderName}
        </span>
      )}
      {(item.isPinned || isSaved) && (
        <div
          className={`flex items-center gap-[5px] px-[17px] pb-[2px] text-[11px] ${
            side === "right" ? "justify-end" : "justify-start"
          } text-white/55`}
        >
          {item.isPinned && (
            <span className="inline-flex items-center gap-[3px]">
              <Pin size={11} />
              {language === "english" ? "Pinned" : "سنجاق‌شده"}
            </span>
          )}
          {isSaved && (
            <span className="inline-flex items-center gap-[3px]">
              <Bookmark size={11} />
              {language === "english" ? "Saved" : "ذخیره‌شده"}
            </span>
          )}
        </div>
      )}

      <Gap
        messageId={messageId}
        onMessageMenu={onMessageMenu}
        side={side}
        time={time}
        status={isOwnMessage ? item.sendStatus || "sent" : "read"}
        selected={selected}
        selectionMode={selectionMode}
        onSelect={() => onToggleMessage(messageId)}
        messageTextSize={textSize}
        messageCornerSize={cornerSize}
        replyTo={replyTo}
        media={mediaNode}
        mediaWidth={mediaLayout?.width ?? null}
        timeOverlay={Boolean(mediaLayout?.overlayTime && !hasMessageBody)}
        bubbleClassName={`
          transition-all
          duration-200
          ease-out
          ${
            item.visible === false
              ? "translate-y-[10px] scale-[0.96] opacity-0"
              : "translate-y-0 scale-100 opacity-100"
          }
        `}
      >
        {messageBody}
      </Gap>

      {reactionGroups.length > 0 && (
        <div
          className={`flex flex-wrap gap-[4px] px-[14px] pt-[2px] ${
            side === "right" ? "justify-end" : "justify-start"
          }`}
        >
          {reactionGroups.map((group) => (
            <button
              type="button"
              key={group.emoji}
              onClick={() => onToggleReaction?.(messageId, group.emoji)}
              aria-label={`${group.emoji} ${group.count}`}
              className={`inline-flex min-h-[25px] items-center gap-[4px] rounded-full border px-[7px] text-[12px] transition-colors ${
                group.selected
                  ? "border-[#91a8ef]/60 bg-[#91a8ef]/20"
                  : "border-white/10 bg-black/10"
              }`}
            >
              <span>{group.emoji}</span>
              <span className="text-white/75">{group.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

/*
|--------------------------------------------------------------------------
| Message List
|--------------------------------------------------------------------------
*/

function MessageList({
  messages = [],
  conversationId,
  currentUserId,
  language,
  selectedMessages = [],
  onToggleMessage,
  onMessageMenu,
  onToggleReaction,
  savedMessageIds = [],
  textSize,
  cornerSize,
  theme = "blue",
  isDark = true,
  showSenderName = false,
}) {
  let previousDateKey = null;

  const validMessages = Array.isArray(messages)
    ? messages.filter((item) => item && getId(item._id ?? item.id))
    : [];

  const existingMessageIds = new Set(
    validMessages.map((item) => getId(item._id ?? item.id))
  );
  const uploads = useUploads();
  const hasPendingUploads = Boolean(conversationId) && uploads.some(
    (upload) => upload.conversationId === String(conversationId)
  );

  return (
    <div className="space-y-1 overflow-y-scroll py-[90px]">
      {validMessages.length === 0 && !hasPendingUploads && (
        <div
          className="flex justify-center px-5 py-8 text-center text-sm text-white/40"
          dir="auto"
        >
          {language === "english"
            ? "No messages yet. Send the first message."
            : "هنوز پیامی وجود ندارد. اولین پیام را بفرستید."}
        </div>
      )}

      {validMessages.map((item) => {
        const messageId = getId(item._id ?? item.id);
        const dateKey = getDateKey(item.createdAt);
        const showDate = Boolean(dateKey) && dateKey !== previousDateKey;

        if (dateKey) previousDateKey = dateKey;

        return (
          <div key={messageId}>
            {showDate && (
              <div className="flex justify-center py-2">
                <span className="rounded-full bg-[#3a3a3a] px-4 py-1 text-[13px] font-bold text-white">
                  {formatDateLabel(item.createdAt, language)}
                </span>
              </div>
            )}

            <MessageItem
              item={item}
              currentUserId={currentUserId}
              language={language}
              onMessageMenu={onMessageMenu}
              onToggleMessage={onToggleMessage}
              onToggleReaction={onToggleReaction}
              selected={selectedMessages.includes(messageId)}
              selectionMode={selectedMessages.length > 0}
              textSize={textSize}
              cornerSize={cornerSize}
              isSaved={savedMessageIds.includes(messageId)}
              theme={theme}
              isDark={isDark}
              showSenderName={showSenderName}
            />
          </div>
        );
      })}

      {conversationId && (
        <PendingUploads
          conversationId={conversationId}
          language={language}
          existingMessageIds={existingMessageIds}
        />
      )}
    </div>
  );
}

export default memo(MessageList);
