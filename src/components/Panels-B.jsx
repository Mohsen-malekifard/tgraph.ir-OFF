"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";

import { useB } from "@/context/BContext";
import { usePV } from "@/context/PVContext";
import { getOfflineMessages } from "@/lib/offlineData";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";


import PanelsPV from "./Panels-PV";

import Account from "./Account";
import Username from "./Username";
import ChatSettings from "./ChatSettings";

import ChatView from "./PanelsB/ChatView";
import MessageContextMenu from "./PanelsB/MessageContextMenu";
import MessageForwardDialog from "./PanelsB/MessageForwardDialog";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const MESSAGE_PAGE_SIZE = 30;

const OLDER_MESSAGES_THRESHOLD = 120;

const BOTTOM_SCROLL_THRESHOLD = 180;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const MESSAGE_STATUS_PRIORITY = {
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

function getId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "object") {
    return String(
      value._id ??
        value.id ??
        ""
    );
  }

  return String(value);
}

function getMessageId(message) {
  return getId(
    message?._id ??
      message?.id
  );
}

function getMessageConversationId(message) {
  return getId(
    message?.conversation
  );
}

function getMessageStatusPriority(status) {
  return MESSAGE_STATUS_PRIORITY[status] ?? -1;
}

function mergeMessageData(existing, incoming) {
  const merged = {
    ...existing,
    ...incoming,
  };

  const existingStatus = existing?.sendStatus;
  const incomingStatus = incoming?.sendStatus;

  if (
    getMessageStatusPriority(existingStatus) >
    getMessageStatusPriority(incomingStatus)
  ) {
    merged.sendStatus = existingStatus;
  }

  return merged;
}

function isMessageAtOrBefore(message, marker) {
  if (!message || !marker) {
    return false;
  }

  const messageTime = new Date(
    message.createdAt || 0
  ).getTime();

  const markerTime = new Date(
    marker.createdAt || 0
  ).getTime();

  if (
    Number.isFinite(messageTime) &&
    Number.isFinite(markerTime) &&
    messageTime !== markerTime
  ) {
    return messageTime < markerTime;
  }

  const messageId = getMessageId(message);
  const markerId = getMessageId(marker);

  if (!messageId || !markerId) {
    return false;
  }

  return messageId.localeCompare(markerId) <= 0;
}

function sortMessages(messages) {
  return [...messages].sort((first, second) => {
    const firstTime = new Date(
      first.createdAt || 0
    ).getTime();

    const secondTime = new Date(
      second.createdAt || 0
    ).getTime();

    if (firstTime !== secondTime) {
      return firstTime - secondTime;
    }

    return getMessageId(first).localeCompare(
      getMessageId(second)
    );
  });
}

/*
 * Optimized message upsert.
 *
 * Existing messages usually retain their position.
 * Sorting is only necessary when a new message is inserted
 * or when the timestamp of an existing message changes.
 */

function upsertMessage(messages, message) {
  const messageId = getMessageId(message);

  if (!messageId) {
    return messages;
  }

  const index = messages.findIndex(
    (item) =>
      getMessageId(item) === messageId
  );

  if (index === -1) {
    return sortMessages([
      ...messages,
      message,
    ]);
  }

  const existing = messages[index];

  const mergedMessage = mergeMessageData(
    existing,
    message
  );

  const updated = [...messages];

  updated[index] = mergedMessage;

  const previousTime = new Date(
    existing.createdAt || 0
  ).getTime();

  const nextTime = new Date(
    mergedMessage.createdAt || 0
  ).getTime();

  if (previousTime !== nextTime) {
    return sortMessages(updated);
  }

  return updated;
}

function isMatchingPendingMessage(
  pending,
  incoming,
  currentUserId,
  conversationId
) {
  if (
    pending?.sendStatus !== "sending"
  ) {
    return false;
  }

  if (
    getMessageConversationId(pending) !==
      conversationId ||
    getMessageConversationId(incoming) !==
      conversationId
  ) {
    return false;
  }

  if (
    !currentUserId ||
    getId(pending.sender) !== currentUserId ||
    getId(incoming.sender) !== currentUserId
  ) {
    return false;
  }

  if (
    pending.type !== incoming.type ||
    pending.text !== incoming.text
  ) {
    return false;
  }

  const pendingTime = new Date(
    pending.createdAt
  ).getTime();

  const incomingTime = new Date(
    incoming.createdAt
  ).getTime();

  if (
    !Number.isFinite(pendingTime) ||
    !Number.isFinite(incomingTime)
  ) {
    return false;
  }

  return (
    Math.abs(
      incomingTime - pendingTime
    ) <= 120000
  );
}

function getSavedStorageKey(userId) {
  return `telegraph_saved_messages_v1_${userId || "default"}`;
}

/*
|--------------------------------------------------------------------------
| Panels B
|--------------------------------------------------------------------------
*/

export default function PanelsB({
  selectedData,
  language,
}) {
  const {
    activeB,
    setActiveB,
  } = useB();

  const {
    setActivePV,
  } = usePV();

  const {
    theme,
    setTheme,
    isDark,
    setIsDark,
  } = useTheme();

  const {
    user,
  } = useAuth();

  const currentUserId = getId(
    user?.id ??
      user?._id
  );

  const conversationId = getId(
    selectedData?.conversationId ??
      selectedData?.conversation?._id ??
      selectedData?.conversation?.id
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [message, setMessage] = useState("");

  const [isHidden, setIsHidden] = useState(true);
  const [isOpen2, setIsOpen2] = useState(false);

  const [selectedMessages, setSelectedMessages] = useState([]);
  const [messageMenu, setMessageMenu] = useState(null);

  const [messages, setMessages] = useState([]);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState("");

  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const [forwardMessageTarget, setForwardMessageTarget] = useState(null);
  const [savedMessageIds, setSavedMessageIds] = useState([]);

  const messageMenuCloseTimerRef = useRef(null);
  const messageMenuKeyRef = useRef(0);

  const messageMenuRef = useRef(null);
  const panelsBRef = useRef(null);
  const chatScrollRef = useRef(null);
  const messageInputRef = useRef(null);

  const messageSelectionRef = useRef({
    start: 0,
    end: 0,
  });

  const currentConversationRef = useRef(conversationId);
  const reloadMessagesRef = useRef(null);

  const pendingSendsRef = useRef(0);
  const optimisticMessageSequenceRef = useRef(0);

  const requestSequenceRef = useRef(0);
  const olderRequestSequenceRef = useRef(0);

  const messagesRef = useRef(messages);

  /*
   * Pagination state is stored in a ref to prevent unnecessary
   * component renders during pagination bookkeeping.
   */

  const paginationRef = useRef({
    cursor: null,
    hasMore: false,
    initialized: false,
  });

  const loadingOlderRef = useRef(false);

  /*
   * Scroll restoration data is consumed after React updates
   * the message list in the DOM.
   */

  const scrollRestoreRef = useRef(null);

  /*
   * Used to determine whether the user was near the bottom
   * before a new message was inserted.
   */

  const isNearBottomRef = useRef(true);

  const initialScrollPendingRef = useRef(false);

  currentConversationRef.current = conversationId;
  messagesRef.current = messages;

  const [textSize, setTextSize] = useState(16);
  const [cornerSize, setCornerSize] = useState(15);

  /*
  |--------------------------------------------------------------------------
  | Load Locally Saved Messages
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        getSavedStorageKey(currentUserId)
      );

      const parsed = stored ? JSON.parse(stored) : [];

      setSavedMessageIds(
        Array.isArray(parsed)
          ? parsed
              .map((item) => String(item?.id || ""))
              .filter(Boolean)
          : []
      );
    } catch {
      setSavedMessageIds([]);
    }
  }, [currentUserId]);

  /*
  |--------------------------------------------------------------------------
  | Restore Text Size
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const storedTextSize = localStorage.getItem(
        "chat_message_text_size"
      );

      if (storedTextSize !== null) {
        const parsedTextSize = Number(storedTextSize);

        if (
          Number.isFinite(parsedTextSize) &&
          parsedTextSize >= 12 &&
          parsedTextSize <= 20
        ) {
          setTextSize(parsedTextSize);
        }
      }
    } catch {
      // Storage restrictions must not break the chat.
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Restore Message Corner Size
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    try {
      const storedCornerSize = localStorage.getItem(
        "chat_message_corner_size"
      );

      if (storedCornerSize !== null) {
        const parsedCornerSize = Number(storedCornerSize);

        if (
          Number.isFinite(parsedCornerSize) &&
          parsedCornerSize >= 10 &&
          parsedCornerSize <= 20
        ) {
          setCornerSize(parsedCornerSize);
        }
      }
    } catch {
      // Storage restrictions must not break the chat.
    }
  }, [activeB]);

  /*
  |--------------------------------------------------------------------------
  | Load Local Demo Messages
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (activeB !== "chat" || !conversationId) {
      setMessagesLoading(false);
      setMessagesError("");
      reloadMessagesRef.current = null;
      return;
    }

    const loadLocalMessages = () =>
      getOfflineMessages(conversationId).map((item) => ({
        ...item,
        visible: true,
        sendStatus: item.sendStatus || "sent",
      }));

    setMessages(loadLocalMessages());
    setMessagesLoading(false);
    setMessagesError("");
    setLoadingOlderMessages(false);
    paginationRef.current = {
      cursor: null,
      hasMore: false,
      initialized: true,
    };
    reloadMessagesRef.current = () => {
      setMessages(loadLocalMessages());
    };

    return () => {
      reloadMessagesRef.current = null;
      requestSequenceRef.current += 1;
    };
  }, [activeB, conversationId]);

  /*
  |--------------------------------------------------------------------------
  | Load Older Messages
  |--------------------------------------------------------------------------
  |
  | این تابع فقط زمانی اجرا می‌شود که کاربر به ابتدای
  | فهرست پیام‌ها نزدیک شده باشد.
  |
  */

  const loadOlderMessages = useCallback(async () => {
    paginationRef.current = {
      cursor: null,
      hasMore: false,
      initialized: true,
    };
    setLoadingOlderMessages(false);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Listen to Chat Scroll
  |--------------------------------------------------------------------------
  |
  | The actual scroll container is provided by ChatView through
  | chatScrollRef. No additional scroll container is introduced.
  |
  */

  useEffect(() => {
    if (
      activeB !== "chat" ||
      !conversationId
    ) {
      return;
    }

    const chat = chatScrollRef.current;

    if (!chat) {
      return;
    }

    const handleChatScroll = () => {
      const distanceFromBottom =
        chat.scrollHeight -
        chat.scrollTop -
        chat.clientHeight;

      isNearBottomRef.current =
        distanceFromBottom <= BOTTOM_SCROLL_THRESHOLD;

      /*
       * Avoid loading history when the message list does not
       * have enough height to be scrollable.
       */

      const isScrollable =
        chat.scrollHeight >
        chat.clientHeight + 80;

      if (
        isScrollable &&
        chat.scrollTop <= OLDER_MESSAGES_THRESHOLD
      ) {
        void loadOlderMessages();
      }
    };

    chat.addEventListener(
      "scroll",
      handleChatScroll,
      {
        passive: true,
      }
    );

    return () => {
      chat.removeEventListener(
        "scroll",
        handleChatScroll
      );
    };
  }, [
    activeB,
    conversationId,
    loadOlderMessages,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Switch Conversation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setMessage("");

    setMessages([]);
    setMessagesError("");
    setMessagesLoading(false);

    setLoadingOlderMessages(false);

    setSelectedMessages([]);
    setMessageMenu(null);
    setIsEmojiOpen(false);
    setIsOpen(false);

    setReplyingTo(null);
    setEditingMessage(null);

    /*
     * Reset pagination for the new conversation.
     */

    paginationRef.current = {
      cursor: null,
      hasMore: false,
      initialized: false,
    };

    loadingOlderRef.current = false;

    olderRequestSequenceRef.current += 1;

    scrollRestoreRef.current = null;

    initialScrollPendingRef.current = true;

    isNearBottomRef.current = true;

    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = 0;
    }
  }, [conversationId]);

  /*
  |--------------------------------------------------------------------------
  | Retry Message Loading
  |--------------------------------------------------------------------------
  */

  const retryMessages = useCallback(() => {
    if (reloadMessagesRef.current) {
      reloadMessagesRef.current();
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Toggle Selected Message
  |--------------------------------------------------------------------------
  */

  const toggleMessage = useCallback((id) => {
    const messageId = String(id);

    setSelectedMessages((previous) =>
      previous.includes(messageId)
        ? previous.filter((item) => item !== messageId)
        : [...previous, messageId]
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Open Message Context Menu
  |--------------------------------------------------------------------------
  */

  const openMessageMenu = useCallback(
    ({
      id,
      y,
      side,
      bubbleRect,
    }) => {
      if (!bubbleRect) {
        return;
      }

      if (messageMenuCloseTimerRef.current !== null) {
        window.clearTimeout(messageMenuCloseTimerRef.current);
        messageMenuCloseTimerRef.current = null;
      }

      const menuWidth = 210;
      const margin = 10;

      let x;

      if (side === "right") {
        x = bubbleRect.left - menuWidth - margin;
      } else {
        x = bubbleRect.right + margin;
      }

      const key = ++messageMenuKeyRef.current;

      setMessageMenu({
        id: String(id),
        x,
        y,
        side,
        isOwnMessage: side === "right",
        key,
        open: true,
      });
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Close Message Context Menu
  |--------------------------------------------------------------------------
  */

  const closeMessageMenu = useCallback(() => {
    if (messageMenuCloseTimerRef.current !== null) {
      window.clearTimeout(messageMenuCloseTimerRef.current);
      messageMenuCloseTimerRef.current = null;
    }

    const closingKey = messageMenuKeyRef.current;

    setMessageMenu((previous) => {
      if (!previous) {
        return null;
      }

      return {
        ...previous,
        open: false,
      };
    });

    messageMenuCloseTimerRef.current = window.setTimeout(() => {
      setMessageMenu((previous) => {
        if (
          previous &&
          previous.key === closingKey &&
          !previous.open
        ) {
          return null;
        }

        return previous;
      });

      messageMenuCloseTimerRef.current = null;
    }, 230);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Clear Message Context Menu Timer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (messageMenuCloseTimerRef.current !== null) {
        window.clearTimeout(messageMenuCloseTimerRef.current);
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Find Message for an Action
  |--------------------------------------------------------------------------
  */

  const findMessage = useCallback(
    (id) =>
      messagesRef.current.find(
        (item) => getMessageId(item) === String(id)
      ) || null,
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Reply to Message
  |--------------------------------------------------------------------------
  */

  const handleReplyToMessage = useCallback(() => {}, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Edit Message
  |--------------------------------------------------------------------------
  */

  const handleEditMessage = useCallback(() => {}, []);

  const cancelEdit = useCallback(() => {
    setEditingMessage(null);
    setMessage("");
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Copy Message
  |--------------------------------------------------------------------------
  */

  const handleCopyMessage = useCallback(
    async (id) => {
      const target = findMessage(id);

      if (!target) {
        return;
      }

      const text = String(target.text || "");

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textArea = document.createElement("textarea");

          textArea.value = text;
          textArea.setAttribute("readonly", "");
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";

          document.body.appendChild(textArea);
          textArea.select();

          const copied = document.execCommand("copy");

          document.body.removeChild(textArea);

          if (!copied) {
            throw new Error("کپی پیام ناموفق بود.");
          }
        }
      } catch (error) {
        setMessagesError(
          error?.message ||
            (language === "english"
              ? "Could not copy this message."
              : "کپی پیام ناموفق بود.")
        );
      }
    },
    [findMessage, language]
  );

  /*
  |--------------------------------------------------------------------------
  | Save / Unsave Message Locally
  |--------------------------------------------------------------------------
  */

  const handleSaveMessage = useCallback(() => {}, []);

  /*
  |--------------------------------------------------------------------------
  | Delete Message
  |--------------------------------------------------------------------------
  */

  const handleDeleteMessage = useCallback(async () => {}, []);

  /*
  |--------------------------------------------------------------------------
  | Report Message
  |--------------------------------------------------------------------------
  */

  const handleReportMessage = useCallback(async () => {}, []);

  /*
  |--------------------------------------------------------------------------
  | Pin / Unpin Message
  |--------------------------------------------------------------------------
  */

  const handlePinMessage = useCallback(async () => {}, []);

  /*
  |--------------------------------------------------------------------------
  | Toggle Message Reaction
  |--------------------------------------------------------------------------
  */

  const handleToggleReaction = useCallback(async () => {}, []);

  /*
  |--------------------------------------------------------------------------
  | Forward Message
  |--------------------------------------------------------------------------
  */

  const handleOpenForwardDialog = useCallback(() => {}, []);

  const handleForwardToConversation = useCallback(async () => {}, []);

  /*
  |--------------------------------------------------------------------------
  | Send / Edit Message
  |--------------------------------------------------------------------------
  */

  const sendMessage = useCallback(async () => {}, []);

  /*
  |--------------------------------------------------------------------------
  | Emoji Selection
  |--------------------------------------------------------------------------
  */

  const handleEmojiClick = useCallback(
    (emojiData) => {
      const emoji = emojiData.emoji;
      const input = messageInputRef.current;
      const start = messageSelectionRef.current.start;
      const end = messageSelectionRef.current.end;

      const nextMessage =
        message.slice(0, start) +
        emoji +
        message.slice(end);

      setMessage(nextMessage);

      requestAnimationFrame(() => {
        if (!input) {
          return;
        }

        const cursorPosition = start + emoji.length;

        input.setSelectionRange(
          cursorPosition,
          cursorPosition
        );

        messageSelectionRef.current = {
          start: cursorPosition,
          end: cursorPosition,
        };
      });
    },
    [message]
  );

  /*
  |--------------------------------------------------------------------------
  | Message Menu Position
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!messageMenu?.open) {
      return;
    }

    const menuKey = messageMenu.key;

    const frame = requestAnimationFrame(() => {
      const menu = messageMenuRef.current;

      if (!menu) {
        return;
      }

      const rect = menu.getBoundingClientRect();
      const margin = 10;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = messageMenu.x;
      let y = messageMenu.y;

      if (x < margin) {
        x = margin;
      }

      if (x + rect.width > viewportWidth - margin) {
        x = viewportWidth - rect.width - margin;
      }

      if (y < margin) {
        y = margin;
      }

      if (y + rect.height > viewportHeight - margin) {
        y = viewportHeight - rect.height - margin;
      }

      setMessageMenu((previous) => {
        if (
          !previous ||
          !previous.open ||
          previous.key !== menuKey
        ) {
          return previous;
        }

        if (previous.x === x && previous.y === y) {
          return previous;
        }

        return {
          ...previous,
          x,
          y,
        };
      });
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [messageMenu]);

  /*
  |--------------------------------------------------------------------------
  | Prepare Initial Scroll
  |--------------------------------------------------------------------------
  */

  useLayoutEffect(() => {
    if (activeB === "chat") {
      initialScrollPendingRef.current = true;
    }
  }, [
    activeB,
    conversationId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Preserve Scroll Position / Scroll to Latest Message
  |--------------------------------------------------------------------------
  */

  useLayoutEffect(() => {
    if (
      activeB !== "chat" ||
      !conversationId
    ) {
      return;
    }

    const chat = chatScrollRef.current;

    if (!chat) {
      return;
    }

    /*
     * Ignore messages belonging to the previously selected
     * conversation while the new conversation is loading.
     */

    const hasCurrentConversationMessages = messages.some(
      (item) =>
        getMessageConversationId(item) === conversationId
    );

    if (!hasCurrentConversationMessages) {
      return;
    }

    /*
     * First priority: restore scroll position after prepending
     * older messages.
     */

    const restoreData = scrollRestoreRef.current;

    if (
      restoreData &&
      restoreData.conversationId === conversationId
    ) {
      const heightDifference =
        chat.scrollHeight - restoreData.scrollHeight;

      chat.scrollTop =
        restoreData.scrollTop + heightDifference;

      scrollRestoreRef.current = null;

      const distanceFromBottom =
        chat.scrollHeight -
        chat.scrollTop -
        chat.clientHeight;

      isNearBottomRef.current =
        distanceFromBottom <= BOTTOM_SCROLL_THRESHOLD;

      return;
    }

    /*
     * Second priority: position the user at the latest message
     * when opening or switching to a conversation.
     */

    if (initialScrollPendingRef.current) {
      chat.scrollTo({
        top: chat.scrollHeight,
        behavior: "auto",
      });

      initialScrollPendingRef.current = false;
      isNearBottomRef.current = true;

      return;
    }

    /*
     * New messages should move the viewport only when the user
     * was already close to the bottom.
     *
     * Scrolling through older messages must not move the user
     * away from their current position.
     */

    if (isNearBottomRef.current) {
      chat.scrollTo({
        top: chat.scrollHeight,
        behavior: "auto",
      });
    }
  }, [
    messages,
    conversationId,
    activeB,
    messagesLoading,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Panel Visibility
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (activeB) {
      setIsHidden(false);

      const timer = setTimeout(() => {
        setIsOpen2(true);
      }, 10);

      return () => {
        clearTimeout(timer);
      };
    }

    setIsOpen2(false);

    const timer = setTimeout(() => {
      setIsHidden(true);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [activeB]);

  /*
  |--------------------------------------------------------------------------
  | Preview Animation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isClicked) {
      return;
    }

    const timer = setTimeout(() => {
      setIsClicked(false);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [isClicked]);

  /*
  |--------------------------------------------------------------------------
  | Clear Selected Messages
  |--------------------------------------------------------------------------
  */

  const clearSelectedMessages = useCallback(() => {
    setSelectedMessages([]);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Open Chat Preview
  |--------------------------------------------------------------------------
  */

  const openChatPreview = useCallback(() => {
    setIsClicked((previous) => !previous);
    setActivePV("preview");
  }, [setActivePV]);

  /*
  |--------------------------------------------------------------------------
  | Close Chat
  |--------------------------------------------------------------------------
  */

  const closeChat = useCallback(() => {
    setActiveB(null);
  }, [setActiveB]);

  /*
  |--------------------------------------------------------------------------
  | Open Chat Menu
  |--------------------------------------------------------------------------
  */

  const openChatMenu = useCallback(() => {
    setIsOpen(true);
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Active Context Menu Message
  |--------------------------------------------------------------------------
  */

  const activeMenuMessage = useMemo(
    () =>
      messageMenu
        ? findMessage(messageMenu.id)
        : null,
    [messageMenu, findMessage]
  );

  const isActiveMenuMessageSaved = useMemo(
    () =>
      savedMessageIds.includes(
        getMessageId(activeMenuMessage)
      ),
    [savedMessageIds, activeMenuMessage]
  );

  const canEditActiveMenuMessage = useMemo(
    () =>
      Boolean(
        activeMenuMessage &&
        activeMenuMessage.type === "text" &&
        !activeMenuMessage.deletedAt &&
        getId(activeMenuMessage.sender) === currentUserId &&
        !getMessageId(activeMenuMessage).startsWith("temp-")
      ),
    [activeMenuMessage, currentUserId]
  );

  const handleCloseForwardDialog = useCallback(() => {
    setForwardMessageTarget(null);
  }, []);

  if (!activeB) {
    return null;
  }

  return (
    <>
      <div
        className="
          relative
          min-w-0
          w-full
          max-w-full
          md:basis-2/3
          md:flex-shrink-0
          overflow-hidden
        "
      >
        <PanelsPV data={selectedData} />

        <div
          ref={panelsBRef}
          className={`
            relative
            min-w-0
            w-full
            max-w-full
            overflow-hidden
            transition-all
            duration-200

            ${isHidden ? "hidden" : ""}
            ${
              isOpen2
                ? "translate-x-0 opacity-100"
                : "translate-x-100 opacity-0"
            }
          `}
        >
          {activeB === "chat" && (
            <ChatView
              selectedData={selectedData}
              language={language}
              theme={theme}
              isDark={isDark}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              isClicked={isClicked}
              selectedMessages={selectedMessages}
              onToggleMessage={toggleMessage}
              onClearSelection={clearSelectedMessages}
              onCloseChat={closeChat}
              onOpenPreview={openChatPreview}
              onOpenMenu={openChatMenu}
              onMessageMenu={openMessageMenu}
              onToggleReaction={handleToggleReaction}
              messages={messages}
              currentUserId={currentUserId}
              messagesLoading={messagesLoading}
              messagesError={messagesError}
              onRetryMessages={retryMessages}
              isSending={isSending}
              textSize={textSize}
              cornerSize={cornerSize}
              message={message}
              setMessage={setMessage}
              isEmojiOpen={isEmojiOpen}
              setIsEmojiOpen={setIsEmojiOpen}
              messageInputRef={messageInputRef}
              messageSelectionRef={messageSelectionRef}
              onSendMessage={sendMessage}
              onEmojiClick={handleEmojiClick}
              chatScrollRef={chatScrollRef}
              replyingTo={replyingTo}
              editingMessage={editingMessage}
              onCancelReply={cancelReply}
              onCancelEdit={cancelEdit}
              savedMessageIds={savedMessageIds}
            />
          )}

          <div
            className={`${
              theme === "blue" && isDark
                ? "bg-[#1D202E]"
                : theme === "red" && isDark
                  ? "bg-[#181818]"
                  : ""
            }`}
          >
            {activeB === "account" && (
              <Account
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveB={setActiveB}
              />
            )}

            {activeB === "username" && (
              <Username
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveB={setActiveB}
              />
            )}

            {activeB === "chat-settings" && (
              <ChatSettings
                theme={theme}
                setTheme={setTheme}
                isDark={isDark}
                setIsDark={setIsDark}
                language={language}
                setActiveB={setActiveB}
              />
            )}
          </div>
        </div>

        {activeB === "chat" && messageMenu && (
          <MessageContextMenu
            messageMenu={messageMenu}
            messageMenuRef={messageMenuRef}
            language={language}
            theme={theme}
            isDark={isDark}
            onClose={closeMessageMenu}
            onSelectMessage={toggleMessage}
            onReply={handleReplyToMessage}
            onCopy={handleCopyMessage}
            onForward={handleOpenForwardDialog}
            onPin={handlePinMessage}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onSave={handleSaveMessage}
            onReact={handleToggleReaction}
            onReport={handleReportMessage}
            isPinned={Boolean(activeMenuMessage?.isPinned)}
            isSaved={isActiveMenuMessageSaved}
            canEdit={canEditActiveMenuMessage}
          />
        )}
      </div>

      {forwardMessageTarget && (
        <MessageForwardDialog
          message={forwardMessageTarget}
          language={language}
          theme={theme}
          isDark={isDark}
          onClose={handleCloseForwardDialog}
          onSelectConversation={handleForwardToConversation}
        />
      )}
    </>
  );
}
