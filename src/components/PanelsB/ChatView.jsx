"use client";

import { memo, useCallback, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageComposer from "./MessageComposer";
import ChatMenu from "./ChatMenu";
import ConversationManager from "./ConversationManager";
import { useChat } from "@/context/ChatContext";
import { useB } from "@/context/BContext";

function ChatView({
  selectedData,
  language,
  theme,
  isDark,
  isOpen,
  setIsOpen,
  isClicked,
  selectedMessages,
  onToggleMessage,
  onClearSelection,
  onCloseChat,
  onOpenPreview,
  onOpenMenu,
  onMessageMenu,
  onToggleReaction,
  messages,
  currentUserId,
  messagesLoading,
  messagesError,
  onRetryMessages,
  isSending,
  textSize,
  cornerSize,
  message,
  setMessage,
  isEmojiOpen,
  setIsEmojiOpen,
  messageInputRef,
  messageSelectionRef,
  onSendMessage,
  onEmojiClick,
  chatScrollRef,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  savedMessageIds,
}) {
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState("members");
  const { setSelectedData } = useChat();
  const { setActiveB } = useB();

  const conversationId =
    selectedData?.conversationId ??
    selectedData?.conversation?._id ??
    selectedData?.conversation?.id ??
    "";

  const conversationType = selectedData?.conversation?.type ||
    (selectedData?.category === "Channel" ? "channel" : selectedData?.category === "Group" ? "group" : "private");
  const membershipRole = selectedData?.membership?.role || "member";
  const isReadOnlyChannel = conversationType === "channel" && !["owner", "admin"].includes(membershipRole);
  const isMutedMember = Boolean(selectedData?.membership?.isMuted);
  const isReadOnly = isReadOnlyChannel || isMutedMember;
  const isGroup = conversationType === "group";

  const openManager = useCallback((nextTab = "members") => {
    setManagerTab(nextTab);
    setIsOpen(false);
    setManagerOpen(true);
  }, [setIsOpen]);

  const handleConversationUpdated = useCallback((nextConversation, nextMembership) => {
    setSelectedData((previous) => {
      if (!previous || String(previous.conversationId) !== String(conversationId)) return previous;
      const updatedConversation = { ...(previous.conversation || {}), ...(nextConversation || {}) };
      return {
        ...previous,
        title: updatedConversation.title || previous.title,
        description: updatedConversation.description || "",
        username: updatedConversation.username || "",
        avatarUrl: updatedConversation.avatar || "",
        conversation: updatedConversation,
        membership: nextMembership || previous.membership,
      };
    });
  }, [conversationId, setSelectedData]);

  const handleConversationRemoved = useCallback(() => {
    setSelectedData(null);
    setActiveB(null);
    window.dispatchEvent(new Event("telegraph:conversations:refresh"));
  }, [setActiveB, setSelectedData]);

  return (
    <div
      className="relative"
      data-app-theme={isDark ? "dark" : "light"}
      data-app-color={theme === "blue" ? "blue" : "red"}
    >
      <div className="absolute pointer-events-none bottom-[0px] inset-x-0 h-[130px] z-30 bg-linear-to-t from-black/80 via-black/60 to-transparent" />

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[40]"
        />
      )}

      <div
        ref={chatScrollRef}
        className="app-chat-background w-full h-screen scrollbar-none overflow-y-scroll"
      >
        <ChatHeader
          selectedData={selectedData}
          language={language}
          isClicked={isClicked}
          selectedMessages={selectedMessages}
          onClearSelection={onClearSelection}
          onCloseChat={onCloseChat}
          onOpenPreview={onOpenPreview}
          onOpenMenu={onOpenMenu}
        />

        {messagesError && (
          <div
            role="alert"
            className="relative z-40 mx-4 mt-[78px] rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <span>{messagesError}</span>

            <button
              type="button"
              onClick={onRetryMessages}
              className="ms-3 underline underline-offset-4"
            >
              {language === "english" ? "Retry" : "تلاش مجدد"}
            </button>
          </div>
        )}

        {messagesLoading && messages.length === 0 && (
          <div
            role="status"
            className="relative z-10 flex justify-center py-8 text-sm text-white/50"
          >
            {language === "english" ? "Loading messages..." : "در حال دریافت پیام‌ها..."}
          </div>
        )}

        <MessageList
          messages={messages}
          conversationId={conversationId}
          showSenderName={isGroup}
          currentUserId={currentUserId}
          language={language}
          selectedMessages={selectedMessages}
          onToggleMessage={onToggleMessage}
          onMessageMenu={onMessageMenu}
          onToggleReaction={onToggleReaction}
          savedMessageIds={savedMessageIds}
          textSize={textSize}
          cornerSize={cornerSize}
          theme={theme}
          isDark={isDark}
        />

        {isReadOnly ? (
          <div className="sticky bottom-0 z-30 border-t border-white/10 bg-black/35 px-[16px] py-[15px] text-center text-[13px] text-white/55 backdrop-blur-xl">
            {isMutedMember
              ? (language === "english" ? "You cannot send messages in this conversation." : "در حال حاضر اجازهٔ ارسال پیام در این گفتگو را نداری.")
              : (language === "english" ? "Only channel administrators can publish messages." : "فقط مالک و مدیران کانال می‌توانند پیام منتشر کنند.")}
          </div>
        ) : (
        <MessageComposer
          conversationId={conversationId}
          theme={theme}
          isDark={isDark}
          message={message}
          setMessage={setMessage}
          isEmojiOpen={isEmojiOpen}
          setIsEmojiOpen={setIsEmojiOpen}
          messageInputRef={messageInputRef}
          messageSelectionRef={messageSelectionRef}
          onSendMessage={onSendMessage}
          onEmojiClick={onEmojiClick}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onCancelReply={onCancelReply}
          onCancelEdit={onCancelEdit}
          language={language}
        />
        )}
      </div>

      <ChatMenu
        selectedData={selectedData}
        category={selectedData?.category}
        language={language}
        theme={theme}
        isDark={isDark}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onManage={openManager}
      />

      <ConversationManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onConversationUpdated={handleConversationUpdated}
        onConversationRemoved={handleConversationRemoved}
        conversationId={conversationId}
        language={language}
        theme={theme}
        isDark={isDark}
        initialTab={managerTab}
      />
    </div>
  );
}

export default memo(ChatView);
