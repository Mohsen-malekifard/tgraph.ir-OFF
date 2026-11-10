"use client";

import {
  createLucideIcon,
  CircleUserRound,
  Pencil,
  EllipsisVertical,
  Users,
  User,
  Bookmark,
  CircleQuestionMark,
  SettingsIcon,
  LucideSettings,
  MessageCircle,
  MessageCircleMore,
  MessageCirclePlus,
  UserPlus,
  PhoneCall,
  X,
  Phone,
  Camera,
  KeyRound,
  LogOut,
  Bell,
  Share2,
  LogOutIcon,
  Copy,
  SearchIcon,
  BellOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Pin,
  PinOff,
  CheckCheck,
} from "lucide-react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  byPrefixAndName,
  faAt,
  faGear,
  faLink,
  faPalette,
  faPallet,
  faPen,
} from "@fortawesome/free-solid-svg-icons";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useB } from "@/context/BContext";
import { useA } from "@/context/AContext";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";
import { useChat } from "@/context/ChatContext";
import { usePV } from "@/context/PVContext";
import { OFFLINE_CONVERSATIONS, OFFLINE_CONTACTS } from "@/lib/offlineData";

import ChatsPage from "@/components/ChatsPage";
import PanelsA from "@/components/Panels-A";
import PanelsB from "@/components/Panels-B";
import PanelsPV from "@/components/Panels-PV";

import {
  faCamera,
  faCircleUser,
  faKey,
  faVolumeHigh,
  faChartPie,
  faFolder,
  faLaptop,
  faVideo,
  faGlobe,
  faComments,
  faCircleQuestion,
  faLightbulb,
  faShield,
  faUserGroup,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";

const data1 = [
  {
    title: "Saved Messages",
    category: "Pv",
    dateE: "Aug 22",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 919 005 0424",
  },
  {
    title: "گروه برنامه نویسان",
    category: "Group",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-red-600 via-red-50 to-red-600",
  },
  {
    title: "کانال آموزش برنامه نویسی",
    category: "Channel",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: true,
    colorClasses: "from-yellow-600 via-yellow-50 to-yellow-600",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    dateE: "Aug 22",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 919 005 0424",
  },
  {
    title: "گروه برنامه نویسان",
    category: "Group",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-red-600 via-red-50 to-red-600",
  },
  {
    title: "کانال آموزش برنامه نویسی",
    category: "Channel",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: true,
    colorClasses: "from-yellow-600 via-yellow-50 to-yellow-600",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    dateE: "Aug 22",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 919 005 0424",
  },
  {
    title: "گروه برنامه نویسان",
    category: "Group",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-red-600 via-red-50 to-red-600",
  },
  {
    title: "کانال آموزش برنامه نویسی",
    category: "Channel",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: true,
    colorClasses: "from-yellow-600 via-yellow-50 to-yellow-600",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    dateE: "Aug 22",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 919 005 0424",
  },
  {
    title: "گروه برنامه نویسان",
    category: "Group",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: false,
    colorClasses: "from-red-600 via-red-50 to-red-600",
  },
  {
    title: "کانال آموزش برنامه نویسی",
    category: "Channel",
    dateE: "Sep 19",
    dateP: "۱۸ اسفند",
    isPinned: true,
    colorClasses: "from-yellow-600 via-yellow-50 to-yellow-600",
  },
];

const data2 = [
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved ",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-red-600 via-red-50 to-red-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
  {
    title: "Saved Messages",
    category: "Pv",
    date: "Aug 22",
    isPinned: false,
    colorClasses: "from-blue-600 via-blue-50 to-blue-600",
    mobile: "+98 903 062 2977",
  },
];

const Menu = createLucideIcon("menu", [
  ["path", { d: "M4 12h16", key: "1lakjw" }],
  ["path", { d: "M4 17h16", key: "g4d7ey" }],
  ["path", { d: "M4 7h16", key: "6tx8e3" }],
]);

const Search = createLucideIcon("search", [
  ["path", { d: "m20.5 21.5-5.34-5.34", key: "a9vt4m0" }],
  ["circle", { cx: "10.647", cy: "12", r: "6", key: "poptbx" }],
]);

const categories = [
  "همه",
  "برنامک",
  "شخصی",
  "کانال",
  "گروه",
  "مدیر",
  "نخوانده",
  "منتخب",
  "رسانه محور",
];

function mergeIds(list, ids) {
  return Array.from(new Set([...list, ...ids]));
}

function removeIds(list, ids) {
  return list.filter((id) => !ids.includes(id));
}

function formatConversationItem(item) {
  const conversation = item?.conversation;
  const peer = item?.peer;

  if (!conversation) {
    return null;
  }

  const type =
    conversation.type ||
    (peer ? "private" : "");

  const isPrivate = type === "private";

  if (isPrivate && !peer) {
    return null;
  }

  if (
    !isPrivate &&
    type !== "group" &&
    type !== "channel"
  ) {
    return null;
  }

  const peerId = isPrivate
    ? String(peer.id ?? peer._id ?? "")
    : "";

  const fullName = isPrivate
    ? [
        peer.firstName,
        peer.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "";

  const title = isPrivate
    ? (
        fullName ||
        (peer.username
          ? `@${peer.username}`
          : "Unknown user")
      )
    : (
        conversation.title ||
        (type === "group"
          ? "گروه بدون نام"
          : "کانال بدون نام")
      );

  const lastMessage = conversation.lastMessage ?? null;

  const lastActivity =
    conversation.lastMessageAt ||
    lastMessage?.createdAt ||
    conversation.updatedAt ||
    null;

  let date = "";

  if (lastActivity) {
    const parsedDate = new Date(lastActivity);

    if (!Number.isNaN(parsedDate.getTime())) {
      date = parsedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  const category =
    type === "group"
      ? "Group"
      : type === "channel"
        ? "Channel"
        : "Pv";

  const colorClasses =
    type === "group"
      ? "from-red-600 via-red-50 to-red-600"
      : type === "channel"
        ? "from-yellow-600 via-yellow-50 to-yellow-600"
        : "from-blue-600 via-blue-50 to-blue-600";

  const conversationId = String(
    conversation._id ?? conversation.id ?? ""
  );

  if (!conversationId) {
    return null;
  }

  const membership = item.membership || null;

  return {
    title,

    category,

    date,
    dateE: date,
    dateP: date,

    isPinned: false,

    isMuted: Boolean(membership?.isMuted),

    colorClasses,

    mobile: isPrivate
      ? peer.username
        ? `@${peer.username}`
        : peerId
      : conversation.username
        ? `@${conversation.username}`
        : "",

    username: isPrivate
      ? typeof peer.username === "string"
        ? peer.username
        : ""
      : typeof conversation.username === "string"
        ? conversation.username
        : "",

    conversationId,

    conversation,

    peer: peer || null,

    avatar: isPrivate
      ? peer.avatar || null
      : conversation.avatar || null,

    membershipId: item.membershipId || null,

    membership,

    role: membership?.role || "member",

    isManager:
      membership?.role === "owner" ||
      membership?.role === "admin",

    unreadCount: Number(item.unreadCount) || 0,

    lastMessage,

    lastMessageText:
      typeof lastMessage?.text === "string"
        ? lastMessage.text
        : "",
  };
}
    

function formatContactItem(user) {
  if (!user) {
    return null;
  }

  const userId = String(user.id ?? user._id ?? "");

  if (!userId) {
    return null;
  }

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    title:
      fullName ||
      (user.username ? `@${user.username}` : "Unknown user"),

    category: "Pv",

    isPinned: false,

    colorClasses:
      "from-blue-600 via-blue-50 to-blue-600",

    mobile: user.username
      ? `@${user.username}`
      : userId,

    username:
      typeof user.username === "string"
        ? user.username
        : "",

    userId,

    peer: {
      ...user,
      id: userId,
    },
  };
}

export default function Home() {
  const { activeB, setActiveB } = useB();
  const { activeA, setActiveA } = useA();
  const { setActivePV } = usePV();
  const { theme, setTheme, isDark, setIsDark } = useTheme();
  const { selectedData, setSelectedData } = useChat();

  const [conversations, setConversations] = useState(OFFLINE_CONVERSATIONS);
  const [conversationsError, setConversationsError] = useState("");

  const [contacts, setContacts] = useState(OFFLINE_CONTACTS);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);

  const [activeCategory, setActiveCategory] = useState(0);
  const [activeCategory2, setActiveCategory2] = useState(0);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isScrolled2, setIsScrolled2] = useState(false);
  const [isScrolled3, setIsScrolled3] = useState(false);
  const [isScrolled4, setIsScrolled4] = useState(false);

  const [sorted, setSorted] = useState(false);

  // انتخاب چندگانه و مدیریت مکالمه‌ها
  const [selectedChatIds, setSelectedChatIds] = useState([]);
  const [mutedChatIds, setMutedChatIds] = useState([]);
  const [pinnedChatIds, setPinnedChatIds] = useState([]);
  const [archivedChatIds, setArchivedChatIds] = useState([]);
  const [deletedChatIds, setDeletedChatIds] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isSelectionMenuOpen, setIsSelectionMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // مقدار search قبل از استفاده در useEffect تعریف می‌شود.
  const [search, setSearch] = useState("");

  const {
    name,
    lastName,
    userName,
    mobile,
    bio,
    language,
    setLanguage,
  } = useData();

  // The temporary demo build never waits for or checks an authenticated session.
  const loading = false;
  
const [lowPerformanceMode, setLowPerformanceMode] = useState(false);

useEffect(() => {
  const nav = window.navigator;

  const lowCPU =
    typeof nav.hardwareConcurrency === "number" &&
    nav.hardwareConcurrency <= 4;

  const lowMemory =
    typeof nav.deviceMemory === "number" &&
    nav.deviceMemory <= 4;

  const saveData = nav.connection?.saveData === true;

  setLowPerformanceMode(
    lowCPU || lowMemory || saveData
  );
}, []);
  

  const displayName = [
    name,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedConversation2, setSelectedConversation2] = useState(null);

  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
  });

  const [indicator2, setIndicator2] = useState({
    left: 0,
    width: 0,
  });

  const tabsRef = useRef([]);
  const tabsContainerRef = useRef(null);
  const chatsRef = useRef(null);

  const tabsRef2 = useRef([]);
  const tabsContainerRef2 = useRef(null);

  const contactsRef = useRef([]);

  const categoryPanelRef = useRef(null);
  const categoryTransitionDirection = useRef(1);
  const isCategoryTransitioning = useRef(false);

  const loadConversations = useCallback(async () => {
    setConversations(OFFLINE_CONVERSATIONS);
    setConversationsError("");
    return OFFLINE_CONVERSATIONS;
  }, []);

  useEffect(() => {
    setConversations(OFFLINE_CONVERSATIONS);
    setContacts(OFFLINE_CONTACTS);
    setConversationsError("");
    setContactsError("");
    setContactsLoading(false);
  }, []);

  // Search is performed only against the local demo contacts.
  useEffect(() => {
    const query = search.trim().toLowerCase();
    setContactsLoading(false);
    setContactsError("");

    if (query.length < 2) {
      setContacts(OFFLINE_CONTACTS);
      return;
    }

    setContacts(
      OFFLINE_CONTACTS.filter((contact) =>
        [contact.firstName, contact.lastName, contact.username, contact.phone]
          .some((value) => String(value || "").toLowerCase().includes(query))
      )
    );
  }, [search]);

  async function handleLogout() {
    // Sign-in and sign-out are disabled in the temporary offline demo.
    setIsOpen(false);
  }

  const categoriesE = [
    { title: "Chats", icon: <MessageCircle size={19.5} /> },
    { title: "Contacts", icon: <CircleUserRound size={22} /> },
    { title: "Settings", icon: <SettingsIcon size={21.5} /> },
    { title: "Profile" },
  ];

  const categoriesP = [
    { title: "چت ها", icon: <MessageCircle size={19.5} /> },
    { title: "مخاطبین", icon: <CircleUserRound size={22} /> },
    { title: "تنظیمات", icon: <SettingsIcon size={21.5} /> },
    { title: "پروفایل" },
  ];

  const isBlueTheme = theme === "blue";

  const accentColor = isBlueTheme
    ? isDark
      ? "#91a8ef"
      : "#1278e6"
    : isDark
      ? "#f08080"
      : "#d93636";

  const accentTextClass = isBlueTheme
    ? isDark
      ? "text-[#91a8ef]"
      : "text-[#1278e6]"
    : isDark
      ? "text-[#f08080]"
      : "text-[#d93636]";

  const mutedTabTextClass = isDark
    ? "text-white/45"
    : isBlueTheme
      ? "text-[#64748b]"
      : "text-[#936565]";

  const pageBackgroundClass = isDark
    ? "bg-black"
    : isBlueTheme
      ? "bg-[#edf4ff]"
      : "bg-[#fff1f1]";

  const chatListBackgroundClass = isDark
    ? isBlueTheme
      ? "bg-[#1D202E]"
      : "bg-[#181818]"
    : isBlueTheme
      ? "bg-[#edf4ff]"
      : "bg-[#fff1f1]";

  const chatListBackgroundColor = isDark
    ? isBlueTheme
      ? "#1D202E"
      : "#181818"
    : isBlueTheme
      ? "#edf4ff"
      : "#fff1f1";

  const handleCategoryChange = (index) => {
  if (index === activeCategory2) {
    return;
  }

  if (lowPerformanceMode) {
    const panel = categoryPanelRef.current;

    if (panel) {
      panel.getAnimations().forEach((animation) => {
        animation.cancel();
      });
    }

    isCategoryTransitioning.current = false;
    setActiveCategory2(index);
    return;
  }

  if (isCategoryTransitioning.current) {
    return;
  }

  const panel = categoryPanelRef.current;

  if (!panel) {
    setActiveCategory2(index);
    return;
  }

  const direction = index > activeCategory2 ? -1 : 1;

  categoryTransitionDirection.current = direction;
  isCategoryTransitioning.current = true;

  const exitAnimation = panel.animate(
    [
      {
        transform: "translateX(0)",
        opacity: 1,
      },
      {
        transform: `translateX(${-direction * 42}px)`,
        opacity: 0.92,
      },
    ],
    {
      duration: 150,
      easing: "cubic-bezier(0.4, 0, 1, 1)",
      fill: "forwards",
    }
  );

  exitAnimation.onfinish = () => {
    setActiveCategory2(index);
  };
};

  useLayoutEffect(() => {
    if (!isCategoryTransitioning.current) {
      return;
    }

    const panel = categoryPanelRef.current;

    if (!panel) {
      isCategoryTransitioning.current = false;
      return;
    }

    panel.getAnimations().forEach((animation) => {
      animation.cancel();
    });

    const direction = categoryTransitionDirection.current;

    const enterAnimation = panel.animate(
      [
        {
          transform: `translateX(${direction * 42}px)`,
          opacity: 0.92,
        },
        {
          transform: "translateX(0)",
          opacity: 1,
        },
      ],
      {
        duration: 260,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both",
      }
    );

    enterAnimation.onfinish = () => {
      isCategoryTransitioning.current = false;
      enterAnimation.cancel();
    };
  }, [activeCategory2]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabsRef.current[activeCategory];
      const container = tabsContainerRef.current;

      if (!activeTab || !container) {
        return;
      }

      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setIndicator({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    };

    updateIndicator();

    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeCategory]);

  useEffect(() => {
    const updateIndicator = () => {
      const activeTab = tabsRef2.current[activeCategory2];
      const container = tabsContainerRef2.current;

      if (!activeTab || !container) {
        return;
      }

      const tabRect = activeTab.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      setIndicator2({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    };

    updateIndicator();

    window.addEventListener("resize", updateIndicator);

    return () => {
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeCategory2]);

  const privateChatItems = useMemo(
  () =>
    conversations
      .map(formatConversationItem)
      .filter(Boolean),
  [conversations]
);

useEffect(() => {
  const activeId = String(selectedData?.conversationId || "");
  if (!activeId) return;

  const latest = conversations
    .map(formatConversationItem)
    .find((item) => item?.conversationId === activeId);

  if (!latest) return;

  setSelectedData((previous) => {
    if (!previous || String(previous.conversationId || "") !== activeId) return previous;

    const membershipChanged =
      previous.membership?.role !== latest.membership?.role ||
      Boolean(previous.membership?.isMuted) !== Boolean(latest.membership?.isMuted);
    const titleChanged = previous.title !== latest.title;
    const avatarChanged = previous.conversation?.avatar !== latest.conversation?.avatar;
    const descriptionChanged = previous.conversation?.description !== latest.conversation?.description;
    const usernameChanged = previous.conversation?.username !== latest.conversation?.username;
    const visibilityChanged = previous.conversation?.isPublic !== latest.conversation?.isPublic;

    if (!membershipChanged && !titleChanged && !avatarChanged && !descriptionChanged && !usernameChanged && !visibilityChanged) {
      return previous;
    }

    return {
      ...previous,
      ...latest,
      conversationId: activeId,
      membership: latest.membership || previous.membership,
    };
  });
}, [conversations, selectedData?.conversationId, setSelectedData]);

const searchedContactItems = useMemo(
  () =>
    contacts
      .map(formatContactItem)
      .filter(Boolean),
  [contacts]
);

const recentContactItems = useMemo(
  () =>
    privateChatItems
      .filter((item) => item.category === "Pv")
      .map((item) => ({
        ...item,
        peer: item.peer,
        userId: String(
          item.peer?.id ??
            item.peer?._id ??
            ""
        ),
      })),
  [privateChatItems]
);

const chatListItems = useMemo(() => {
  const decorated = privateChatItems
    .filter((item) => !deletedChatIds.includes(item.conversationId))
    .map((item) => ({
      ...item,
      isPinned: pinnedChatIds.includes(item.conversationId),
      isMuted: mutedChatIds.includes(item.conversationId),
      isArchived: archivedChatIds.includes(item.conversationId),
    }));

  return [
    ...decorated.filter((item) => item.isPinned),
    ...decorated.filter((item) => !item.isPinned),
  ];
}, [
  privateChatItems,
  deletedChatIds,
  pinnedChatIds,
  mutedChatIds,
  archivedChatIds,
]);

const archivedCount = useMemo(
  () => chatListItems.filter((item) => item.isArchived).length,
  [chatListItems]
);

const filteredChats = useMemo(() => {
  const source = chatListItems.filter((item) =>
    showArchived
      ? item.isArchived
      : !item.isArchived
  );

  switch (activeCategory) {
    case 0:
      return source;

    case 1:
      return [];

    case 2:
      return source.filter(
        (item) => item.category === "Pv"
      );

    case 3:
      return source.filter(
        (item) => item.category === "Channel"
      );

    case 4:
      return source.filter(
        (item) => item.category === "Group"
      );

    case 5:
      return source.filter(
        (item) =>
          item.role === "owner" ||
          item.role === "admin"
      );

    case 6:
      return source.filter(
        (item) => item.unreadCount > 0
      );

    case 7:
      return source.filter(
        (item) => item.isPinned
      );

    case 8:
      return source.filter(
        (item) =>
          item.lastMessage?.type &&
          item.lastMessage.type !== "text"
      );

    default:
      return source;
  }
}, [
  activeCategory,
  chatListItems,
  showArchived,
]);

  const isSelectionMode = selectedChatIds.length > 0;

  const selectedCountLabel =
    language == "english"
      ? String(selectedChatIds.length)
      : selectedChatIds.length.toLocaleString("fa-IR");

  const selectedChatItems = useMemo(
    () =>
      filteredChats.filter((item) =>
        selectedChatIds.includes(item.conversationId)
      ),
    [filteredChats, selectedChatIds]
  );

  const allSelectedMuted =
    selectedChatItems.length > 0 &&
    selectedChatItems.every((item) => item.isMuted);

  const allSelectedPinned =
    selectedChatItems.length > 0 &&
    selectedChatItems.every((item) => item.isPinned);

  // با تغییر صفحهٔ پایین، انتخاب‌ها پاک می‌شوند.
  useEffect(() => {
    setSelectedChatIds([]);
  }, [activeCategory2]);

  // مکالمه‌هایی که دیگر در لیست نمایش داده نمی‌شوند از انتخاب خارج می‌شوند.
  useEffect(() => {
    setSelectedChatIds((previous) => {
      const next = previous.filter((id) =>
        filteredChats.some((item) => item.conversationId === id)
      );

      return next.length === previous.length ? previous : next;
    });
  }, [filteredChats]);

  useEffect(() => {
    if (selectedChatIds.length === 0) {
      setIsSelectionMenuOpen(false);
    }
  }, [selectedChatIds.length]);

  useEffect(() => {
    if (showArchived && archivedCount === 0) {
      setShowArchived(false);
    }
  }, [showArchived, archivedCount]);

  const clearSelection = useCallback(() => {
    setSelectedChatIds([]);
    setIsSelectionMenuOpen(false);
  }, []);

  const toggleChatSelection = useCallback((conversationId) => {
    if (!conversationId) {
      return;
    }

    setSelectedChatIds((previous) =>
      previous.includes(conversationId)
        ? previous.filter((id) => id !== conversationId)
        : [...previous, conversationId]
    );
  }, []);

  const handleSelectAll = () => {
    setSelectedChatIds(
      filteredChats.map((item) => item.conversationId)
    );

    setIsSelectionMenuOpen(false);
  };

  const handleToggleMute = () => {
    const ids = selectedChatItems.map((item) => item.conversationId);

    setMutedChatIds((previous) =>
      allSelectedMuted
        ? removeIds(previous, ids)
        : mergeIds(previous, ids)
    );

    clearSelection();
  };

  const handleTogglePin = () => {
    const ids = selectedChatItems.map((item) => item.conversationId);

    setPinnedChatIds((previous) =>
      allSelectedPinned
        ? removeIds(previous, ids)
        : mergeIds(previous, ids)
    );

    clearSelection();
  };

  const handleToggleArchive = () => {
    const ids = selectedChatItems.map((item) => item.conversationId);

    setArchivedChatIds((previous) =>
      showArchived
        ? removeIds(previous, ids)
        : mergeIds(previous, ids)
    );

    clearSelection();
  };

  const handleDeleteSelected = () => {
    const ids = selectedChatItems.map((item) => item.conversationId);

    setDeletedChatIds((previous) => mergeIds(previous, ids));

    if (
      selectedData?.conversationId &&
      ids.includes(String(selectedData.conversationId))
    ) {
      setSelectedData(null);
      setSelectedConversation(null);
      setActiveB(null);
    }

    setIsDeleteDialogOpen(false);
    clearSelection();
  };

  const openPrivateConversation = useCallback(
    async (peer, index = 0) => {
      const userId = String(peer?.id ?? peer?._id ?? "");
      if (!userId) return;

      const entry = OFFLINE_CONVERSATIONS.find(
        (item) => String(item?.peer?.id ?? item?.peer?._id ?? "") === userId
      );

      if (!entry) return;

      const chat = formatConversationItem(entry);
      if (!chat) return;

      setSelectedConversation(index);
      setSelectedData(chat);
      setActiveB("chat");
      setContactsError("");
    },
    [setActiveB, setSelectedData]
  );

  const handleChatSelectedData = useCallback(
    (nextData) => {
      const value =
        typeof nextData === "function"
          ? nextData(selectedData)
          : nextData;

      if (!value || typeof value !== "object") {
        setSelectedData(value);
        return;
      }

      const match = privateChatItems.find(
        (item) =>
          value.conversationId &&
          String(value.conversationId) === item.conversationId
      );

      setSelectedData(
        match
          ? {
              ...match,
              ...value,
              conversationId: match.conversationId,
              conversation: match.conversation,
              peer: match.peer,
              username: value.username || match.username || match.peer?.username || "",
              membershipId: match.membershipId,
              membership: value.membership || match.membership,
              unreadCount: match.unreadCount,
            }
          : value
      );
    },
    [privateChatItems, selectedData, setSelectedData]
  );

  if (loading) {
    return (
      <>
        <div
          className="
            fixed inset-0
            z-[9999]
            flex flex-col
            items-center justify-center
            gap-[18px]
            bg-black/30
            backdrop-blur-2xl
          "
          role="status"
          aria-live="polite"
          aria-label="منتظر بمانید"
        >
          <div
            className="
              h-[42px]
              w-[42px]
              animate-spin
              rounded-full
              border-[3px]
              border-white/25
              border-t-white
            "
          />

          <span
            className="
              text-[15px]
              font-medium
              tracking-tight
              text-white
              drop-shadow-md
            "
          >
            منتظر بمانید
          </span>
        </div>
      </>
    );
  }

  return (
  <div
    data-performance={lowPerformanceMode ? "low" : "normal"}
    className="contents"
  >
    <PanelsA />

    <PanelsPV data={selectedData} />

    <div
      data-app-theme={isDark ? "dark" : "light"}
      data-app-color={theme}
        className={`w-full h-screen ${pageBackgroundClass} flex flex-row m-0 p-0 overflow-hidden min-w-0 transition-colors duration-200`}
      >
        <div
          className={`w-full h-screen min-w-0 flex ${
            language == "english" ? "flex-row" : "flex-row"
          } origin-top scale-100 translate-y-0 blur-0 overflow-hidden`}
        >
          {/* Chat List */}
          <div
            className={`order-1 h-screen min-w-0 max-w-full w-1/3 shrink-0 ${chatListBackgroundClass} backdrop-blur-md flex flex-col max-md:w-full transition-colors duration-200`}
          >
            {theme == "red" && isDark == true && (
              <div className="absolute pointer-events-none bottom-[0px] inset-x-0 h-[130px] z-30 bg-linear-to-t from-[#181818] via-[#181818]/70 to-transparent " />
            )}

            {theme == "blue" && isDark == true && (
              <div className="absolute pointer-events-none bottom-[0px] inset-x-0 h-[130px] z-30 bg-linear-to-t from-[#1D202E] via-[#1D202E]/70 to-transparent " />
            )}

            {/* Animated Page Content — bottom tab menu stays outside */}
            <div
              ref={categoryPanelRef}
              className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden"
            >
              {/* Header */}
              <div
                className={`
                  relative
                  w-full
                  overflow-hidden
                  z-30
                  ${theme == "red" && isDark == true && "bg-[#3a0909]/70"}
                  ${theme == "blue" && isDark == true && "bg-[#1D202E]/70"}
                  backdrop-blur-xl
                  backdrop-saturate-150
                  transition-[height]
                  duration-300
                  ease-out
                  ${!activeCategory2 == 0 ? "hidden" : ""}
                  ${isScrolled || isSelectionMode ? "h-[58px]" : "h-[14%]"}
                `}
              >
                {isSelectionMode ? (
                  /* Selection Header */
                  <div
                    data-selection-header="true"
                    dir="ltr"
                    className="flex h-[58px] w-full items-center justify-between border-b border-white/[0.06] px-[12px] shadow-[0_3px_14px_rgba(0,0,0,0.10)]"
                    style={{
                      backgroundColor: isDark
                        ? "#202334"
                        : "var(--app-theme-nav)",
                    }}
                  >
                    <div className="flex min-w-0 flex-row items-center gap-[10px]">
                      <button
                        type="button"
                        onClick={clearSelection}
                        aria-label={
                          language == "english"
                            ? "Cancel selection"
                            : "لغو انتخاب"
                        }
                        title={
                          language == "english"
                            ? "Cancel selection"
                            : "لغو انتخاب"
                        }
                        className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/75 transition-colors duration-150 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        <X size={23} strokeWidth={2.2} />
                      </button>

                      <span
                        aria-live="polite"
                        className="min-w-[12px] select-none text-[20px] font-semibold leading-none tracking-[-0.35px] tabular-nums text-white"
                      >
                        {selectedCountLabel}
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-row items-center gap-[2px] text-white/75">
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        aria-label={
                          allSelectedMuted
                            ? language == "english"
                              ? "Unmute"
                              : "فعال‌سازی اعلان"
                            : language == "english"
                              ? "Mute"
                              : "بی‌صدا کردن"
                        }
                        title={
                          allSelectedMuted
                            ? language == "english"
                              ? "Unmute"
                              : "فعال‌سازی اعلان"
                            : language == "english"
                              ? "Mute"
                              : "بی‌صدا کردن"
                        }
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        {allSelectedMuted ? (
                          <Bell size={22} strokeWidth={2.05} />
                        ) : (
                          <BellOff size={22} strokeWidth={2.05} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleToggleArchive}
                        aria-label={
                          showArchived
                            ? language == "english"
                              ? "Unarchive"
                              : "خارج کردن از بایگانی"
                            : language == "english"
                              ? "Archive"
                              : "بایگانی"
                        }
                        title={
                          showArchived
                            ? language == "english"
                              ? "Unarchive"
                              : "خارج کردن از بایگانی"
                            : language == "english"
                              ? "Archive"
                              : "بایگانی"
                        }
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        {showArchived ? (
                          <ArchiveRestore size={22} strokeWidth={2.05} />
                        ) : (
                          <Archive size={22} strokeWidth={2.05} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        aria-label={language == "english" ? "Delete" : "حذف"}
                        title={language == "english" ? "Delete" : "حذف"}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/75 transition-colors duration-150 hover:bg-red-400/[0.12] hover:text-red-200 active:bg-red-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
                      >
                        <Trash2 size={22} strokeWidth={2.05} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setIsSelectionMenuOpen((previous) => !previous)
                        }
                        aria-label={language == "english" ? "More" : "بیشتر"}
                        title={language == "english" ? "More" : "بیشتر"}
                        aria-haspopup="menu"
                        aria-expanded={isSelectionMenuOpen}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                      >
                        <EllipsisVertical size={22} strokeWidth={2.05} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header Top */}
                    <div
                      className={`flex ${
                        language == "english" ? "flex-row" : "flex-row"
                      } items-center justify-between px-4 pt-3 pb-2`}
                    >
                      {language == "english" ? (
                        <h1 className="text-[19px] font-semibold tracking-tight text-white">
                          Telegraph
                        </h1>
                      ) : (
                        <h1 className="text-[20px] font-semibold tracking-tight text-white">
                          تلگراف
                        </h1>
                      )}

                      <span className="text-white/70 p-1">
                        <span className="cursor-pointer">
                          <EllipsisVertical size={20} />
                        </span>
                      </span>
                    </div>

                    {/* Search */}
                    <div
                      className={`
                        absolute
                        bottom-[5px]
                        left-0
                        w-full
                        px-[10px]
                        flex
                        flex-col
                        gap-[10px]
                        overflow-hidden
                        transition-all
                        duration-300
                        ease-out
                        ${
                          isScrolled
                            ? "opacity-0 max-h-0 mb-[30px] pointer-events-none"
                            : "opacity-100 max-h-[50px] translate-y-0"
                        }
                      `}
                    >
                      <div
                        className={`px-[15px] w-full h-[40px] rounded-full outline-none bg-white/10 flex ${
                          language == "english" ? "flex-row" : "flex-row-reverse"
                        } items-center gap-[15px] relative`}
                      >
                        <span className="text-gray-400 text-center">
                          <Search size={20} />
                        </span>

                        {language == "english" ? (
                          <input
                            className="outline-none w-full text-white placeholder:text-gray-400 placeholder:font-normal placeholder:text-[16px]"
                            placeholder="Search Chats"
                            onFocus={() => handleCategoryChange(0)}
                          />
                        ) : (
                          <input
                            className="outline-none text-right w-full text-white placeholder:text-gray-400 placeholder:font-normal placeholder:text-[16px]"
                            placeholder="جستجو در تلگراف"
                            onFocus={() => handleCategoryChange(0)}
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Selection More Menu */}
              {isSelectionMode && (
                <div className="relative z-[70] h-0 w-full">
                  {isSelectionMenuOpen && (
                    <button
                      type="button"
                      onClick={() => setIsSelectionMenuOpen(false)}
                      aria-label={language == "english" ? "Close menu" : "بستن منو"}
                      className="fixed inset-0 z-[65] cursor-default"
                    />
                  )}

                  <div
                    role="menu"
                    aria-hidden={!isSelectionMenuOpen}
                    className={`absolute right-[12px] top-[8px] z-[70] flex w-[220px] origin-top-right flex-col gap-[3px] overflow-hidden rounded-[14px] border border-white/[0.09] p-[6px] shadow-[0_14px_36px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-all duration-200 ease-out ${
                      isDark ? "bg-[#282c3f]" : "bg-[var(--app-theme-panel)]"
                    } ${
                      isSelectionMenuOpen
                        ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
                        : "pointer-events-none translate-y-[-5px] scale-[0.98] opacity-0"
                    }`}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSelectAll}
                      className={`flex min-h-[44px] w-full items-center gap-[12px] rounded-[10px] px-[12px] text-[14px] font-medium transition-colors duration-150 hover:bg-white/[0.08] active:bg-white/[0.13] ${
                        isDark ? "text-white/90" : "text-[var(--app-theme-text)]"
                      } ${
                        language == "english" ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${
                        isDark ? "text-white/65" : "text-[var(--app-theme-muted)]"
                      }`}>
                        <CheckCheck size={19} strokeWidth={2.1} />
                      </span>
                      <span>{language == "english" ? "Select all" : "انتخاب همه"}</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleTogglePin}
                      className={`flex min-h-[44px] w-full items-center gap-[12px] rounded-[10px] px-[12px] text-[14px] font-medium transition-colors duration-150 hover:bg-white/[0.08] active:bg-white/[0.13] ${
                        isDark ? "text-white/90" : "text-[var(--app-theme-text)]"
                      } ${
                        language == "english" ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${
                        isDark ? "text-white/65" : "text-[var(--app-theme-muted)]"
                      }`}>
                        {allSelectedPinned ? (
                          <PinOff size={19} strokeWidth={2.1} />
                        ) : (
                          <Pin size={19} strokeWidth={2.1} />
                        )}
                      </span>
                      <span>
                        {allSelectedPinned
                          ? language == "english"
                            ? "Unpin"
                            : "برداشتن سنجاق"
                          : language == "english"
                            ? "Pin"
                            : "سنجاق کردن"}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Contacts */}
              <div
                onScroll={(e) => {
                  setIsScrolled2(e.currentTarget.scrollTop > 10);
                }}
                className={`overflow-y-scroll scrollbar-none pb-[90px] ${
                  activeCategory2 == 1 ? "" : "hidden"
                }`}
              >
                <div
                  className={`
                    relative
                    w-full
                    overflow-hidden
                    z-30
                    ${theme == "red" && isDark == true && "bg-[#3a0909]/70"}
                    ${theme == "blue" && isDark == true && "bg-[#1D202E]/70"}
                    backdrop-blur-xl
                    backdrop-saturate-150
                    transition-[height]
                    duration-300
                    ease-out
                    ${!activeCategory2 == 1 ? "hidden" : ""}
                    ${isScrolled2 ? "h-[58px]" : "h-[16%]"}
                  `}
                >
                  {/* Header Top */}
                  <div
                    className={`flex ${
                      language == "english" ? "flex-row" : "flex-row-reverse"
                    } items-center justify-between px-4 pt-3 pb-2`}
                  >
                    {language == "english" ? (
                      <h1 className="text-[19px] font-semibold text-white tracking-tight">
                        Connecting...
                      </h1>
                    ) : (
                      <h1
                        className="text-[19px] font-semibold text-white tracking-tight"
                        dir="rtl"
                      >
                        در حال اتصال...
                      </h1>
                    )}

                    <span
                      className={`text-white/70 p-1 flex ${
                        language == "english" ? "flex-row-reverse" : ""
                      } gap-[25px] items-center`}
                    >
                      <span className="cursor-pointer">
                        <EllipsisVertical size={20} />
                      </span>

                      <span
                        className={`cursor-pointer mb-[2.5px] ${
                          !isScrolled2
                            ? "opacity-0 pointer-events-none"
                            : "opacity-100"
                        }`}
                      >
                        <Search size={20} />
                      </span>
                    </span>
                  </div>

                  {/* Search */}
                  <div
                    className={`
                      absolute
                      bottom-[5px]
                      left-0
                      w-full
                      z-[50]
                      px-[10px]
                      flex
                      flex-col
                      gap-[10px]
                      overflow-hidden
                      transition-all
                      duration-300
                      ease-out
                      max-h-[50px]
                    `}
                  >
                    <div
                      className={`px-[15px] w-full h-[40px] rounded-full outline-none bg-white/10 flex ${
                        language == "english" ? "flex-row" : "flex-row-reverse"
                      } items-center gap-[15px] relative`}
                    >
                      <span className="text-gray-400 text-center">
                        <Search size={20} />
                      </span>

                      {language == "english" ? (
                        <input
                          className="outline-none w-full text-white placeholder:text-gray-400 placeholder:font-normal placeholder:text-[16px]"
                          placeholder="Search Contacts"
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      ) : (
                        <input
                          className="outline-none text-right w-full text-white placeholder:text-gray-400 placeholder:font-normal placeholder:text-[16px]"
                          placeholder="جستجو در مخاطبین"
                          type="text"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      )}

                      <span
                        onClick={() => setSearch("")}
                        className={`text-gray-400 text-center transition-all duration-300 ${
                          search.length == 0
                            ? "opacity-0 scale-75"
                            : "opacity-100 scale-100"
                        }`}
                      >
                        <X size={20} />
                      </span>
                    </div>
                  </div>
                </div>

                {activeCategory2 == 1 && (
                  <>
                    <div
                      className={`z-20 transition-all duration-200 pt-[15px] ${
                        search.length == 0
                          ? "opacity-0 scale-75 hidden"
                          : "opacity-100 scale-100"
                      }`}
                    >
                      <div className="flex flex-col items-start w-full min-w-0">
                        {contactsLoading ? (
                          <div
                            className="w-full py-5 text-center text-gray-400"
                            dir="rtl"
                          >
                            در حال جست‌وجو...
                          </div>
                        ) : contactsError ? (
                          <div
                            className="w-full py-5 text-center text-red-400"
                            dir="rtl"
                          >
                            {contactsError}
                          </div>
                        ) : search.trim().length < 2 ? (
                          <div
                            className="w-full py-5 text-center text-gray-400"
                            dir="rtl"
                          >
                            برای جست‌وجو حداقل دو حرف وارد کنید.
                          </div>
                        ) : searchedContactItems.length === 0 ? (
                          <div
                            className="w-full py-5 text-center text-gray-500"
                            dir="rtl"
                          >
                            مخاطبی با این مشخصات یافت نشد.
                          </div>
                        ) : (
                          searchedContactItems.map((item, index) => (
                            <div
                              ref={contactsRef}
                              onClick={() =>
                                void openPrivateConversation(
                                  item.peer,
                                  index
                                )
                              }
                              key={item.userId}
                              className={`transition-all duration-300 active:bg-white/20 hover:bg-white/20 py-[10px] pl-[20px] flex min-w-full gap-[10px] items-center ${
                                selectedConversation === index
                                  ? "bg-white/[0.08]"
                                  : ""
                              }`}
                            >
                              <div
                                className={`bg-conic-180 w-[42.5px] h-[42.5px] rounded-full ${item.colorClasses}`}
                              />

                              <div className="flex flex-col leading-[18px] min-w-0">
                                <span className="text-white text-[15px]">
                                  {item.title}
                                </span>

                                <span className="text-gray-500 text-[14px]">
                                  {item.peer?.username
                                    ? `@${item.peer.username}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div
                        className="flex items-center justify-center mt-[15px]"
                        dir="rtl"
                      >
                        {data2.filter((item) =>
                          item.title
                            .toLowerCase()
                            .includes(search.toLocaleLowerCase())
                        ).length == 0 && (
                          <span className="text-gray-500 font-medium text-[17px]">
                            مخاطبی با این نام یافت نشد.
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`z-10 transition-all duration-200 ${
                        search.length == 0
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-75"
                      }`}
                    >
                      <div
                        className={`${
                          theme == "red" && isDark == true
                            ? "bg-[#252525]"
                            : theme == "blue" &&
                              isDark == true &&
                              "bg-[#282c3f]"
                        } max-w-full rounded-2xl h-[100px] flex flex-col items-start justify-center mt-[15px] mx-[15px] box-border`}
                      >
                        <div
                          onClick={() => setActiveA("new-group")}
                          className={`w-full transition-all duration-300 rounded-t-2xl active:bg-white/20 px-[20px] py-[10px] flex ${
                            language == "english"
                              ? "flex-row"
                              : "flex-row-reverse"
                          } items-center gap-[25px]`}
                        >
                          <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                            <FontAwesomeIcon icon={faUserGroup} />
                          </div>

                          {language == "english" ? (
                            <span className="text-white text-[17px] font-normal">
                              New Group
                            </span>
                          ) : (
                            <span className="text-white text-[17px] font-normal">
                              گروه جدید
                            </span>
                          )}
                        </div>

                        <div
                          onClick={() => setActiveA("new-message")}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveA("new-message");
                            }
                          }}
                          className={`w-full cursor-pointer transition-all duration-300 rounded-b-2xl active:bg-white/20 px-[20px] py-[10px] flex ${
                            language == "english"
                              ? "flex-row"
                              : "flex-row-reverse"
                          } items-center gap-[25px]`}
                        >
                          <div className="w-[27px] h-[27px] rounded-lg bg-green-500 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                            <FontAwesomeIcon icon={faBullhorn} />
                          </div>

                          {language == "english" ? (
                            <span className="text-white text-[17px] font-normal">
                              New Channel
                            </span>
                          ) : (
                            <span className="text-white text-[17px] font-normal">
                              کانال جدید
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`${
                          theme == "red" && isDark == true
                            ? "bg-[#252525]"
                            : theme == "blue" &&
                              isDark == true &&
                              "bg-[#282c3f]"
                        } max-w-full rounded-2xl h-auto pt-[12px] pb-[10px] flex flex-col gap-[15px] ${
                          language == "english" ? "items-start" : "items-end"
                        } mt-[15px] mx-[15px] box-border`}
                      >
                        {language == "english" ? (
                          <span className="text-left text-blue-300 font-semibold text-[15px] ml-[20px]">
                            Sorted by last seen time
                          </span>
                        ) : (
                          <span className="text-white/75 font-semibold text-[15px] mr-[20px]">
                            مرتب شده بر اساس آخرین بازدید
                          </span>
                        )}

                        <div className="flex flex-col items-start w-full">
                          {recentContactItems.map((item, index) => (
                            <div
                              ref={contactsRef}
                              onClick={() =>
                                void openPrivateConversation(
                                  item.peer,
                                  index
                                )
                              }
                              key={item.conversationId}
                              className={`transition-all duration-300 active:bg-white/20 hover:bg-white/20 py-[10px] flex ${
                                language == "english"
                                  ? "flex-row pl-[20px]"
                                  : "flex-row-reverse pr-[15px]"
                              } min-w-full gap-[10px] items-center ${
                                selectedConversation === index
                                  ? "bg-white/[0.08]"
                                  : ""
                              }`}
                            >
                              <div
                                className={`bg-conic-180 w-[42.5px] h-[42.5px] rounded-full ${item.colorClasses}`}
                              />

                              <div className="flex flex-col leading-[18px]">
                                <span
                                  className={`text-white text-[15px] ${
                                    language == "english"
                                      ? "text-left"
                                      : "text-right"
                                  }`}
                                >
                                  {item.title}
                                </span>

                                <span className="text-gray-500 text-[14px]">
                                  {item.peer?.isOnline
                                    ? language === "english"
                                      ? "Online"
                                      : "آنلاین"
                                    : item.peer?.lastSeen
                                      ? new Date(
                                          item.peer.lastSeen
                                        ).toLocaleString(
                                          language === "english"
                                            ? "en-US"
                                            : "fa-IR"
                                        )
                                      : language === "english"
                                        ? "Last seen recently"
                                        : "آخرین بازدید نامشخص"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Settings */}
              <div
                onScroll={(e) => {
                  setIsScrolled3(e.currentTarget.scrollTop > 10);
                }}
                className={`overflow-y-scroll scrollbar-none pb-[90px] ${
                  activeCategory2 == 2 ? "" : "hidden"
                }`}
              >
                <div className="relative w-full overflow-hidden z-30 transition-[height] duration-300 ease-out h-[58px]">
                  <div
                    className={`${
                      isScrolled3
                        ? theme == "blue" && isDark == true
                          ? "bg-[#212641]"
                          : theme == "red" && isDark == true && "bg-[#252525]"
                        : "bg-transparent"
                    } fixed z-[60] w-full flex items-center justify-between px-4 pt-3 pb-3`}
                  >
                    <h1
                      className={`text-[19px] font-semibold text-white tracking-tight ${
                        !isScrolled3 ? "invisible" : ""
                      }`}
                    >
                      Connecting...
                    </h1>

                    <span className="text-white/70 p-1 flex flex-row-reverse gap-[25px] items-center">
                      <span
                        onClick={() => setIsOpen(true)}
                        className="cursor-pointer"
                      >
                        <EllipsisVertical size={20} />
                      </span>

                      <span className="cursor-pointer mb-[2.5px]">
                        <Search size={20} />
                      </span>
                    </span>
                  </div>
                </div>

                {activeCategory2 == 2 && (
                  <div className="relative pb-10">
                    {isOpen && (
                      <div
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[40]"
                      />
                    )}

                    <div
                      className={`fixed z-[50] ${
                        theme == "blue" && isDark == true
                          ? "bg-[#282C3F]"
                          : theme == "red" && isDark == true && "bg-[#252525]"
                      } px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[25px] right-[20px] flex flex-col gap-[25px] origin-top-right transition-all duration-200 ease-out ${
                        isOpen
                          ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                          : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                      }`}
                    >
                      {language == "english" ? (
                        <div
                          onClick={handleLogout}
                          className="flex cursor-pointer gap-[10px]"
                        >
                          <span className="text-red-400">
                            <LogOut size={22.5} />
                          </span>

                          <span className="text-red-400">
                            Log Out
                          </span>
                        </div>
                      ) : (
                        <div
                          onClick={handleLogout}
                          className="flex cursor-pointer flex-row-reverse gap-[10px]"
                        >
                          <span className="text-red-400">
                            <LogOut size={22.5} />
                          </span>

                          <span className="text-red-400">
                            خروج از حساب
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-[10px] flex flex-col items-center justify-center w-full">
                      <div className="relative w-[110px] h-[110px] rounded-full object-cover bg-[url(/icon.png)] bg-cover bg-center">
                        <div className="absolute -bottom-[3px] -right-[3px] flex items-center justify-center text-white w-[30px] h-[30px] border-[2.5px] box-content border-black rounded-full bg-blue-600">
                          <FontAwesomeIcon icon={faCamera} />
                        </div>
                      </div>

                      <div className="flex flex-col items-center mt-[20px] leading-[25px]">
                        <span className="text-[20px] font-semibold text-white">
                          {displayName}
                        </span>

                        <div className="flex items-center gap-[10px] text-[13.5px] font-normal text-gray-400">
                          <span>{mobile}</span>
                          <span className="w-[5px] h-[5px] bg-gray-500 rounded-full"></span>
                          <span>{userName}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`${
                        theme == "blue" && isDark == true
                          ? "bg-[#282C3F]"
                          : theme == "red" && isDark == true && "bg-[#252525]"
                      } max-w-full rounded-2xl h-auto py-[7px] flex flex-col items-start mt-[15px] mx-[15px] box-border`}
                    >
                      <div
                        onClick={() => setActiveB("account")}
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faCircleUser} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Account
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              Number, Username, Bio
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              حساب کاربری
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              شماره همراه, نام کاربری, بیو
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        onClick={() => setActiveB("chat-settings")}
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-yellow-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <MessageCircleMore
                            size={18}
                            className="fill-current"
                          />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Chat Settings
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              Wallpaper, Night Mode, Animations
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              تنظیمات ظاهری
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              پس زمینه, تم, حالت شب
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-green-500 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faKey} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Privacy & Security
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              Last Seen, Devices, Passkeys
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              امنیت
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              آخرین بازدید, دستگاه ها
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-red-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faVolumeHigh} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Notifications
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              Sounds, Calls, Badges
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              اعلان ها
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              صدا
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faFolder} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Chat Folders
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              Sort chats into folders
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              دسته بندی مکالمه ها
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              مرتب سازی چت ها با فولدر ها
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faLaptop} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Devices
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              Manage connected devices
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              دستگاه ها
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              مدیریت دستگاه های متصل
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-purple-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faGlobe} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Language
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              English
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              زبان
                            </span>

                            <span className="text-gray-500 font-normal text-[12.5px]">
                              انگلیسی, فارسی
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`${
                        theme == "blue" && isDark == true
                          ? "bg-[#282C3F]"
                          : theme == "red" && isDark == true && "bg-[#252525]"
                      } max-w-full rounded-2xl h-auto py-[7px] flex flex-col ${
                        language == "english" ? "items-start" : "items-end"
                      } mt-[15px] mx-[15px] box-border`}
                    >
                      {language == "english" ? (
                        <span className="text-left text-blue-300 font-semibold text-[15px] ml-[20px] mt-[5px]">
                          Help
                        </span>
                      ) : (
                        <span className="text-right text-blue-300 font-semibold text-[15px] mr-[20px] mt-[5px]">
                          کمک
                        </span>
                      )}

                      <div
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faCircleQuestion} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Telegraph FAQ
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              سوالات متداول تلگراف
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className={`flex ${
                          language == "english"
                            ? "flex-row"
                            : "flex-row-reverse"
                        } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                      >
                        <div className="w-[27px] h-[27px] rounded-lg bg-green-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                          <FontAwesomeIcon icon={faShield} />
                        </div>

                        {language == "english" ? (
                          <div className="flex flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              Privacy Policy
                            </span>
                          </div>
                        ) : (
                          <div className="flex text-right flex-col leading-[22.5px]">
                            <span className="text-white font-medium text-[15px]">
                              گزارش امنیتی
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div
                onScroll={(e) => {
                  setIsScrolled4(e.currentTarget.scrollTop > 10);
                }}
                className={`overflow-y-scroll scrollbar-none pb-[90px] ${
                  activeCategory2 == 3 ? "" : "hidden"
                }`}
              >
                {isOpen1 && (
                  <div
                    onClick={() => setIsOpen1(false)}
                    className="bg-black/60 z-40 w-full h-screen absolute"
                  />
                )}

                {isOpen2 && (
                  <div
                    onClick={() => setIsOpen2(false)}
                    className="bg-black/60 z-40 w-full h-screen absolute"
                  />
                )}

                {isOpen3 && (
                  <div
                    onClick={() => setIsOpen3(false)}
                    className="bg-black/60 z-40 w-full h-screen absolute"
                  />
                )}

                <div className="relative w-full overflow-hidden z-30 transition-[height] duration-300 ease-out h-[58px]">
                  <div
                    className={`${
                      isScrolled4 ? "bg-[#31364d]" : "bg-transparent"
                    } fixed z-[60] w-full flex items-center justify-between px-4 pt-3 pb-3`}
                  >
                    <h1
                      className={`text-[19px] font-semibold text-white tracking-tight ${
                        !isScrolled4 ? "invisible" : ""
                      }`}
                    >
                      Connecting...
                    </h1>

                    <span className="text-white/70 p-1 flex flex-row-reverse gap-[25px] items-center">
                      <span
                        onClick={() => setIsOpen(true)}
                        className="cursor-pointer"
                      >
                        <EllipsisVertical size={20} />
                      </span>
                    </span>
                  </div>
                </div>

                {activeCategory2 == 3 && (
                  <div className="relative">
                    {isOpen && (
                      <div
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-[40]"
                      />
                    )}

                    <div
                      className={`fixed z-[100] ${
                        theme == "blue" && isDark == true
                          ? "bg-[#282C3F]"
                          : theme == "red" && isDark == true && "bg-[#252525]"
                      } px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[22.5px] right-[20px] flex flex-col gap-[25px] origin-top-right transition-all duration-200 ease-out ${
                        isOpen
                          ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                          : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                      }`}
                    >
                      {language == "english" ? (
                        <div className="flex gap-[10px]">
                          <span className="text-gray-300">
                            <FontAwesomeIcon icon={faPalette} />
                          </span>

                          <span className="text-white font-semibold tracking-tight">
                            Change profile color
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-row-reverse gap-[10px]">
                          <span className="text-gray-300">
                            <FontAwesomeIcon icon={faPalette} />
                          </span>

                          <span className="text-white font-semibold tracking-tight">
                            تغییر رنگ حساب
                          </span>
                        </div>
                      )}

                      {language == "english" ? (
                        <div
                          onClick={() => setActiveA("username-t-a")}
                          className="flex gap-[10px]"
                        >
                          <span className="text-gray-300">
                            <FontAwesomeIcon icon={faAt} />
                          </span>

                          <span className="text-white font-semibold tracking-tight">
                            Change username
                          </span>
                        </div>
                      ) : (
                        <div
                          onClick={() => setActiveA("username-t-a")}
                          className="flex flex-row-reverse gap-[10px]"
                        >
                          <span className="text-gray-300">
                            <FontAwesomeIcon icon={faAt} />
                          </span>

                          <span className="text-white font-semibold tracking-tight">
                            تغییر نام کاربری
                          </span>
                        </div>
                      )}

                      {language == "english" ? (
                        <div
                          onClick={() => setIsOpen(false)}
                          className="flex gap-[10px]"
                        >
                          <span className="text-gray-300">
                            <FontAwesomeIcon icon={faLink} />
                          </span>

                          <span className="text-white font-semibold tracking-tight">
                            Copy link to profile
                          </span>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsOpen(false)}
                          className="flex flex-row-reverse gap-[10px]"
                        >
                          <span className="text-gray-300">
                            <FontAwesomeIcon icon={faLink} />
                          </span>

                          <span className="text-white font-semibold tracking-tight">
                            کپی لینک پروفایل
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-[5px] flex flex-col items-center justify-center w-full">
                      <div className="relative w-[110px] h-[110px] rounded-full object-cover bg-[url(/icon.png)] bg-cover bg-center" />

                      <div className="flex flex-col items-center mt-[14px] leading-[25px]">
                        <span className="text-[20px] font-semibold text-white">
                          {displayName}
                        </span>

                        <div className="flex items-center gap-[10px] text-[13.5px] font-normal text-gray-400">
                          <span>online</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between max-w-full gap-[15px] mx-[15px] mt-[15px]">
                      <span
                        className={`basis-1/3 ${
                          theme == "blue" && isDark == true
                            ? "bg-[#282C3F]"
                            : theme == "red" && isDark == true && "bg-[#252525]"
                        } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[1.7px]`}
                      >
                        <span>
                          <FontAwesomeIcon icon={faCamera} />
                        </span>

                        <span className="text-[12.5px] font-semibold">
                          Set Photo
                        </span>
                      </span>

                      <span
                        onClick={() => setActiveA("account")}
                        className={`basis-1/3 ${
                          theme == "blue" && isDark == true
                            ? "bg-[#282C3F]"
                            : theme == "red" && isDark == true && "bg-[#252525]"
                        } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[1.7px]`}
                      >
                        <span>
                          <FontAwesomeIcon icon={faPen} />
                        </span>

                        <span className="text-[12.5px] font-semibold">
                          Edit Info
                        </span>
                      </span>

                      <span
                        onClick={() => setActiveA("settings")}
                        className={`basis-1/3 ${
                          theme == "blue" && isDark == true
                            ? "bg-[#282C3F]"
                            : theme == "red" && isDark == true && "bg-[#252525]"
                        } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[1.7px]`}
                      >
                        <span>
                          <FontAwesomeIcon icon={faGear} />
                        </span>

                        <span className="text-[12.5px] font-semibold">
                          Settings
                        </span>
                      </span>
                    </div>

                    <div
                      className={`${
                        theme == "blue" && isDark == true
                          ? "bg-[#282C3F]"
                          : theme == "red" && isDark == true && "bg-[#252525]"
                      } max-w-full rounded-2xl h-auto py-[7px] flex flex-col items-start mt-[20px] mx-[15px] box-border`}
                    >
                      <div className="flex gap-[17px] items-center h-[57px] w-full px-[20px]">
                        <div
                          onClick={() => setIsOpen1(true)}
                          className="relative flex flex-col leading-[22.5px] min-w-full"
                        >
                          <span className="text-white font-medium text-[15px]">
                            {mobile}
                          </span>

                          <span className="text-gray-500 font-normal text-[12.5px]">
                            Mobile
                          </span>

                          <div
                            className={`z-50 absolute ${
                              theme == "blue" && isDark == true
                                ? "bg-[#282C3F]"
                                : theme == "red" &&
                                  isDark == true &&
                                  "bg-[#252525]"
                            } px-[12.5px] py-[12.5px] w-[200px] h-auto rounded-[5px] top-[10px] ${
                              language == "english"
                                ? "left-[170px] origin-top-right"
                                : "right-[20px] origin-top-left"
                            } flex flex-col gap-[25px] transition-all duration-200 ease-out ${
                              isOpen1
                                ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                                : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                            }`}
                          >
                            {language == "english" ? (
                              <div
                                onClick={() => {
                                  setIsOpen1(false);
                                }}
                                className="flex gap-[10px]"
                              >
                                <span className="text-gray-500">
                                  <Copy />
                                </span>

                                <span className="text-white">
                                  Copy mobile
                                </span>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setIsOpen1(false);
                                }}
                                className="flex flex-row-reverse gap-[10px]"
                              >
                                <span className="text-gray-500">
                                  <Copy />
                                </span>

                                <span className="text-white">
                                  کپی شماره همراه
                                </span>
                              </div>
                            )}

                            {language == "english" ? (
                              <div className="flex gap-[10px]">
                                <span className="text-gray-500">
                                  <Pencil />
                                </span>

                                <span className="text-white">
                                  Change mobile
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-row-reverse gap-[10px]">
                                <span className="text-gray-500">
                                  <Pencil />
                                </span>

                                <span className="text-white">
                                  تغییر شماره همراه
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-[17px] items-center h-[57px] w-full px-[20px]">
                        <div
                          onClick={() => setIsOpen2(true)}
                          className="relative flex flex-col leading-[22.5px] min-w-full"
                        >
                          <span className="text-white font-medium text-[15px]">
                            {userName}
                          </span>

                          <span className="text-gray-500 font-normal text-[12.5px]">
                            Username
                          </span>

                          <div
                            className={`z-50 absolute ${
                              theme == "blue" && isDark == true
                                ? "bg-[#282C3F]"
                                : theme == "red" &&
                                  isDark == true &&
                                  "bg-[#252525]"
                            } px-[12.5px] py-[12.5px] w-[200px] h-auto rounded-[5px] top-[10px] ${
                              language == "english"
                                ? "left-[170px] origin-top-right"
                                : "right-[80px] origin-top-left"
                            } flex flex-col gap-[25px] transition-all duration-200 ease-out ${
                              isOpen2
                                ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                                : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                            }`}
                          >
                            {language == "english" ? (
                              <div
                                onClick={() => {
                                  setIsOpen2(false);
                                }}
                                className="flex gap-[10px]"
                              >
                                <span className="text-gray-500">
                                  <Copy />
                                </span>

                                <span className="text-white">
                                  Copy username
                                </span>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setIsOpen2(false);
                                }}
                                className="flex flex-row-reverse gap-[10px]"
                              >
                                <span className="text-gray-500">
                                  <Copy />
                                </span>

                                <span className="text-white">
                                  کپی نام کاربری
                                </span>
                              </div>
                            )}

                            {language == "english" ? (
                              <div
                                onClick={() => setActiveA("username-t-a")}
                                className="flex gap-[10px]"
                              >
                                <span className="text-gray-500">
                                  <Pencil />
                                </span>

                                <span className="text-white">
                                  Change username
                                </span>
                              </div>
                            ) : (
                              <div
                                onClick={() => setActiveA("username-t-a")}
                                className="flex flex-row-reverse gap-[10px]"
                              >
                                <span className="text-gray-500">
                                  <Pencil />
                                </span>

                                <span className="text-white">
                                  تغییر نام کاربری
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-[17px] items-center h-[57px] w-full px-[20px]">
                        <div
                          onClick={() => setIsOpen3(true)}
                          className="relative flex flex-col leading-[22.5px] min-w-full"
                        >
                          <span className="text-white font-medium text-[15px]">
                            Apr 16, 2010 (16 years old)
                          </span>

                          <span className="text-gray-500 font-normal text-[12.5px]">
                            Birthday
                          </span>

                          <div
                            className={`z-50 absolute ${
                              theme == "blue" && isDark == true
                                ? "bg-[#282C3F]"
                                : theme == "red" &&
                                  isDark == true &&
                                  "bg-[#252525]"
                            } px-[12.5px] py-[12.5px] w-[200px] h-auto rounded-[5px] top-[10px] ${
                              language == "english"
                                ? "left-[170px] origin-top-right"
                                : "right-[0px] origin-top-left"
                            } flex flex-col gap-[25px] transition-all duration-200 ease-out ${
                              isOpen3
                                ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                                : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                            }`}
                          >
                            {language == "english" ? (
                              <div className="flex gap-[10px]">
                                <span className="text-gray-500">
                                  <Pencil />
                                </span>

                                <span className="text-white">
                                  Change birthday
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-row-reverse gap-[10px]">
                                <span className="text-gray-500">
                                  <Pencil />
                                </span>

                                <span className="text-white">
                                  تغییر تاریخ تولد
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chats */}
              {activeCategory2 == 0 && (
                <ChatsPage
                  data={filteredChats}
                  chatsRef={chatsRef}
                  isScrolled={isScrolled}
                  setIsScrolled={setIsScrolled}
                  selectedConversation={selectedConversation}
                  selectedConversationId={
                    selectedData?.conversationId
                      ? String(selectedData.conversationId)
                      : null
                  }
                  setSelectedConversation={setSelectedConversation}
                  setSelectedData={handleChatSelectedData}
                  setActiveMenu={setActiveB}
                  language={language}
                  isSelectionMode={isSelectionMode}
                  selectedChatIds={selectedChatIds}
                  onToggleSelect={toggleChatSelection}
                  accentColor={accentColor}
                  checkBorderColor={chatListBackgroundColor}
                  archivedRow={{
                    visible: archivedCount > 0,
                    active: showArchived,
                    count: archivedCount,
                    onClick: () => {
                      clearSelection();
                      setShowArchived((previous) => !previous);
                    },
                  }}
                />
              )}

              {activeCategory2 == 0 && (
                <div
                  onClick={() => setActiveA("new-message")}
                  className={`fixed z-40 bottom-[120px] ${
                    language == "english" ? "right-[20px]" : "left-[20px]"
                  } transition-all duration-400 items-center ${
                    isScrolled ? "opacity-0 translate-y-20" : "opacity-100"
                  }`}
                >
                  <div
                    className={`w-[45px] h-[45px] rounded-full ${
                      theme == "red"
                        ? isDark
                          ? "bg-red-800"
                          : "bg-[#ec5454]"
                        : isDark
                          ? "bg-blue-500"
                          : "bg-[#1278e6]"
                    } text-white flex items-center justify-center`}
                  >
                    <MessageCirclePlus />
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Bottom Page Selector */}
            {language == "english" ? (
              <div
                className={`
                  absolute
                  w-[80%]
                  right-1/2
                  translate-x-1/2
                  z-40
                  bottom-[45px]
                `}
              >
                <div
                  ref={tabsContainerRef2}
                  className={`relative ml-[10px] mr-[10px] h-[55px] rounded-full backdrop-blur-xl backdrop-saturate-150 border border-white/[0.04] ${
                    theme == "red" && isDark == true && "bg-[#381c1c]/50"
                  } ${
                    theme == "blue" && isDark == true && "bg-[#2A2E41]/75"
                  } flex flex-row items-center justify-between flex-nowrap overflow-x-scroll scrollbar-none px-[5px]`}
                >
                  {categoriesE.map((category, index) => (
                    <button
                      key={index}
                      ref={(el) => {
                        tabsRef2.current[index] = el;
                      }}
                      type="button"
                      onClick={() => handleCategoryChange(index)}
                      className={`
                        relative isolate
                        h-[40px]
                        flex-1 min-w-0
                        px-[14px]
                        flex items-center justify-center
                        border-none
                        outline-none
                        bg-transparent
                        rounded-full
                        font-sans
                        whitespace-nowrap
                        cursor-pointer
                        ${
                          activeCategory2 === index
                            ? `${accentTextClass} font-medium`
                            : mutedTabTextClass
                        }
                      `}
                    >
                      <span
                        className={`absolute inset-0 -z-10 rounded-full pointer-events-none transition-all duration-300 ease-out ${
                          activeCategory2 === index
                            ? `opacity-100 scale-100 ${
                                isDark
                                  ? theme == "red"
                                    ? "bg-white/10"
                                    : "bg-blue-600/15"
                                  : isBlueTheme
                                    ? "bg-[#1278e6]/10"
                                    : "bg-[#d93636]/10"
                              }`
                            : "opacity-0 scale-0"
                        }`}
                      />

                      <div className="flex flex-col gap-[2.5px] items-center">
                        <span className={`${!category.icon && "hidden"}`}>
                          {category.icon}
                        </span>

                        <div
                          className={`${
                            category.icon && "hidden"
                          } w-[20px] h-[20px] rounded-full object-cover bg-[url(/icon.png)] bg-cover bg-center`}
                        />

                        <span
                          className={`text-[11px] font-extrabold ${
                            category.icon ? "" : "-mb-[2.5px]"
                          }`}
                        >
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`
                  absolute
                  w-[85%]
                  right-1/2
                  translate-x-1/2
                  z-40
                  bottom-[40px]
                `}
              >
                <div
                  ref={tabsContainerRef2}
                  className={`relative ml-[10px] mr-[10px] h-[60px] rounded-full backdrop-blur-xl backdrop-saturate-150 border border-white/[0.04] ${
                    theme == "red" && isDark == true && "bg-[#381c1c]/50"
                  } ${
                    theme == "blue" && isDark == true && "bg-[#2A2E41]/75"
                  } flex flex-row-reverse items-center justify-between flex-nowrap overflow-x-hidden scrollbar-none px-[5px]`}
                >
                  {categoriesP.map((category, index) => (
                    <button
                      key={index}
                      ref={(el) => {
                        tabsRef2.current[index] = el;
                      }}
                      type="button"
                      onClick={() => handleCategoryChange(index)}
                      className={`
                        relative isolate
                        h-[40px]
                        flex-1 min-w-0
                        px-[14px]
                        flex items-center justify-center
                        border-none
                        outline-none
                        bg-transparent
                        rounded-full
                        font-sans
                        whitespace-nowrap
                        cursor-pointer
                        ${
                          activeCategory2 === index
                            ? `${accentTextClass} font-medium`
                            : mutedTabTextClass
                        }
                      `}
                    >
                      <span
                        className={`py-[25px] my-auto absolute inset-0 -z-10 rounded-full pointer-events-none transition-all duration-300 ease-out ${
                          activeCategory2 === index
                            ? `opacity-100 scale-100 ${
                                isDark
                                  ? theme == "red"
                                    ? "bg-white/10"
                                    : "bg-blue-600/15"
                                  : isBlueTheme
                                    ? "bg-[#1278e6]/10"
                                    : "bg-[#d93636]/10"
                              }`
                            : "opacity-0 scale-0"
                        }`}
                      />

                      <div className="flex flex-col gap-[2.5px] items-center">
                        <span className={`${!category.icon && "hidden"}`}>
                          {category.icon}
                        </span>

                        <div
                          className={`${
                            category.icon && "hidden"
                          } w-[20px] h-[20px] rounded-full object-cover bg-[url(/icon.png)] bg-cover bg-center`}
                        />

                        <span
                          className={`text-[11px] font-extrabold ${
                            category.icon ? "" : "-mb-[2.5px]"
                          }`}
                        >
                          {category.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          <div
            className={`
              absolute
              w-1/3
              max-md:w-3/3
              z-40
              transition-all
              duration-300
              ease-out
              ${!activeCategory2 == 0 ? "hidden" : ""}
              ${isScrolled || isSelectionMode ? "top-[53px]" : "top-[14.7%]"}
            `}
          >
            <div
              ref={tabsContainerRef}
              className={`relative ml-[10px] mr-[10px] h-[35px] rounded-full backdrop-blur-xl backdrop-saturate-150 border border-white/[0.04] ${
                theme == "red" && isDark == true && "bg-[#381c1c]/50"
              } ${
                theme == "blue" && isDark == true && "bg-[#2A2E41]/75"
              } flex ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              } items-center justify-between flex-nowrap overflow-x-scroll scrollbar-none px-[3px]`}
            >
              <span
                className="absolute top-1/2 -translate-y-1/2 h-[27px] rounded-full backdrop-blur-md bg-[#ffffff]/10 transition-all duration-300 ease-out pointer-events-none"
                style={{
                  left: indicator.left,
                  width: indicator.width,
                }}
              />

              {categories.map((category, index) => (
                <button
                  key={index}
                  ref={(el) => {
                    tabsRef.current[index] = el;
                  }}
                  type="button"
                  onClick={() => setActiveCategory(index)}
                  className={`
                    relative z-10
                    h-[34px]
                    px-[12px]
                    flex items-center justify-center
                    border-none
                    outline-none
                    bg-transparent
                    rounded-full
                    font-sans
                    text-[14px]
                    whitespace-nowrap
                    cursor-pointer
                    transition-colors duration-300
                    ${
                      activeCategory === index
                        ? `${accentTextClass} font-medium`
                        : mutedTabTextClass
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Content */}
          <div
            className={`
              order-2
              h-screen
              min-w-0
              max-w-full
              w-2/3
              shrink-0
              overflow-hidden
              ${!activeB ? "hidden" : ""}
              max-md:absolute
              max-md:inset-x-0
              max-md:z-[60]
              max-md:w-full
              max-md:basis-full
            `}
          >
            <PanelsB
              language={language}
              selectedData={selectedData}
            />
          </div>
        </div>

        {/* Delete Chats Dialog */}
        {isDeleteDialogOpen && (
          <div
            onClick={() => setIsDeleteDialogOpen(false)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-[20px]"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              dir={language == "english" ? "ltr" : "rtl"}
              role="dialog"
              aria-modal="true"
              className={`${
                isDark
                  ? "bg-[#282c3f]"
                  : "bg-[var(--app-theme-panel)]"
              } flex w-full max-w-[340px] flex-col gap-[12px] rounded-[18px] border border-white/[0.09] p-[22px] shadow-[0_22px_70px_rgba(0,0,0,0.42)]`}
            >
              <span className="text-white text-[18px] font-semibold">
                {language == "english"
                  ? selectedChatIds.length > 1
                    ? "Delete chats?"
                    : "Delete chat?"
                  : selectedChatIds.length > 1
                    ? "حذف مکالمه‌ها؟"
                    : "حذف مکالمه؟"}
              </span>

              <span className="text-gray-400 text-[15px]">
                {language == "english"
                  ? selectedChatIds.length > 1
                    ? `Are you sure you want to delete ${selectedChatIds.length} chats?`
                    : "Are you sure you want to delete this chat?"
                  : selectedChatIds.length > 1
                    ? `آیا از حذف ${selectedChatIds.length.toLocaleString(
                        "fa-IR"
                      )} مکالمه مطمئن هستید؟`
                    : "آیا از حذف این مکالمه مطمئن هستید؟"}
              </span>

              <div className="flex justify-end gap-[10px] mt-[10px]">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className={`px-[14px] py-[8px] rounded-full text-[15px] font-semibold cursor-pointer ${accentTextClass}`}
                >
                  {language == "english" ? "Cancel" : "انصراف"}
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-[14px] py-[8px] rounded-full text-[15px] font-semibold cursor-pointer text-red-400"
                >
                  {language == "english" ? "Delete" : "حذف"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        [data-app-theme="light"][data-app-color="blue"] {
          --app-theme-page: #edf4ff;
          --app-theme-panel: #dceaff;
          --app-theme-text: #253651;
          --app-theme-muted: #64748b;
          --app-theme-accent: #1278e6;
          --app-theme-surface: #c6dcf7;
          --app-theme-nav: #dceaff;
          --app-theme-hover: rgba(18, 120, 230, 0.11);
          --app-theme-border: rgba(18, 120, 230, 0.18);
        }

        [data-app-theme="light"][data-app-color="red"] {
          --app-theme-page: #fff1f1;
          --app-theme-panel: #ffe0e0;
          --app-theme-text: #4b2929;
          --app-theme-muted: #936565;
          --app-theme-accent: #d93636;
          --app-theme-surface: #f8cccc;
          --app-theme-nav: #ffe0e0;
          --app-theme-hover: rgba(217, 54, 54, 0.1);
          --app-theme-border: rgba(217, 54, 54, 0.16);
        }

        [data-app-theme="light"] .text-white {
          color: var(--app-theme-text) !important;
        }

        [data-app-theme="light"] [class*="text-white/70"],
        [data-app-theme="light"] [class*="text-white/80"] {
          color: var(--app-theme-accent) !important;
        }

        [data-app-theme="light"] [class*="text-white/45"],
        [data-app-theme="light"] [class*="text-white/75"] {
          color: var(--app-theme-muted) !important;
        }

        [data-app-theme="light"] [class*="text-gray-300"],
        [data-app-theme="light"] [class*="text-gray-400"],
        [data-app-theme="light"] [class*="text-gray-500"] {
          color: var(--app-theme-muted) !important;
        }

        [data-app-theme="light"] [class*="text-blue-300"] {
          color: var(--app-theme-accent) !important;
        }

        /* Keep white icons on their colored backgrounds. */
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-blue-400"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-blue-500"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-blue-600"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-red-400"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-red-800"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-yellow-400"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-green-400"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-green-500"],
        [data-app-theme="light"]
          [class*="text-white"][class*="bg-purple-400"],
        [data-app-theme="light"]
          [class*="text-white"][style*="background-color"] {
          color: #ffffff !important;
        }

        /* Settings and contact cards. */
        [data-app-theme="light"] [class*="rounded-2xl"],
        [data-app-theme="light"] [class*="rounded-[5px]"] {
          background-color: var(--app-theme-panel) !important;
          border-color: var(--app-theme-border);
        }

        /* Search fields. */
        [data-app-theme="light"] [class*="bg-white/10"] {
          background-color: var(--app-theme-surface) !important;
        }

        [data-app-theme="light"] input {
          color: var(--app-theme-text) !important;
        }

        [data-app-theme="light"] input::placeholder {
          color: var(--app-theme-muted) !important;
          opacity: 1;
        }

        [data-app-theme="light"]
          [class*="bg-white/10"]
          span:has(svg) {
          color: var(--app-theme-accent) !important;
        }

        /* Navigation bars and category selectors. */
        [data-app-theme="light"] [class*="backdrop-blur-xl"] {
          background-color: var(--app-theme-nav) !important;
          border-color: var(--app-theme-border) !important;
        }

        [data-app-theme="light"] [class*="bg-[#ffffff]/10"] {
          background-color: var(--app-theme-hover) !important;
        }

        [data-app-theme="light"] [class*="bg-white/[0.08]"] {
          background-color: var(--app-theme-hover) !important;
        }

        [data-app-theme="light"]
          [class*="hover:bg-white/20"]:hover,
        [data-app-theme="light"]
          [class*="active:bg-white/20"]:active {
          background-color: var(--app-theme-hover) !important;
        }

        /* Keep the profile header transparent in light mode. */
        [data-app-theme="light"] [class*="bg-[#31364d]"] {
          background-color: transparent !important;
        }

        /* Make profile-menu icons clearly visible in light mode. */
        [data-app-theme="light"]
          [class*="rounded-[5px]"]
          span:has(svg) {
          color: var(--app-theme-accent);
        }

        /* =========================================
   Telegraph - Low Performance Mode
   Scoped to this page only
========================================= */

[data-performance="low"] .backdrop-blur-md,
[data-performance="low"] .backdrop-blur-xl,
[data-performance="low"] .backdrop-blur-2xl,
[data-performance="low"] .backdrop-saturate-150 {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}

[data-performance="low"] [class*="transition-"] {
  transition-duration: 1ms !important;
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  [data-performance] [class*="transition-"] {
    transition-duration: 1ms !important;
  }
}
      `}</style>
    </div>
  );
}
