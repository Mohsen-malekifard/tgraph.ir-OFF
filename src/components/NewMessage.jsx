
"use client";

import { useMemo, useRef, useState } from "react";

import { useB } from "@/context/BContext";
import { usePV } from "@/context/PVContext";
import { useChat } from "@/context/ChatContext";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUserGroup,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";

import {
  Check,
  QrCode,
  SearchIcon,
  UserPlus,
  EllipsisVertical,
  LogOut,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

import {
  getAvatarColor,
  getContactErrorMessage,
  getPalette,
  getPhoneKey,
  normalizeDigits,
  normalizePhone,
  saveContactToDevice,
  sortContacts,
  useContacts,
} from "@/lib/contacts";

import ContactRow from "@/components/ContactRow";
import NewChannel from "@/components/NewChannel";
import NewGroup from "@/components/NewGroup";

import {
  BottomSheet,
  FloatingButton,
  SlidePage,
  getSlideSide,
} from "@/components/Motion";

/*
|--------------------------------------------------------------------------
| Sort Icon
|--------------------------------------------------------------------------
*/

function SortByNameIcon({ size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M3 12h9M3 18h5" />
      <path d="M14.5 20l3-8 3 8M15.7 17h3.6" />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| Outlined Field
|--------------------------------------------------------------------------
*/

function OutlinedField({
  id,
  label,
  filled,
  startFocused = false,
  palette,
  children,
}) {
  const [focused, setFocused] = useState(startFocused);

  const floating = focused || filled;

  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`
        relative
        flex
        h-[50px]
        items-center
        rounded-xl
        border
        transition-colors
        duration-150
        ${
          focused
            ? `${palette.accentText} ${palette.accentBorder} shadow-[inset_0_0_0_1px_currentColor]`
            : `border-white/15 ${palette.mutedText}`
        }
      `}
    >
      <label
        htmlFor={id}
        className={`
          pointer-events-none
          absolute
          z-10
          whitespace-nowrap
          transition-all
          duration-150
          ${
            floating
              ? `-top-[10px] start-[11px] px-[4px] text-[13px] leading-[18px] ${palette.sheet}`
              : "start-[16px] top-1/2 -translate-y-1/2 text-[16px]"
          }
        `}
      >
        {label}
      </label>

      {children}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Phone Helpers
|--------------------------------------------------------------------------
*/

function buildPhone(countryCode, localNumber) {
  const codeDigits = normalizeDigits(countryCode).replace(/\D/g, "");

  const numberDigits = normalizeDigits(localNumber).replace(/\D/g, "");

  if (!numberDigits) {
    return "";
  }

  if (!codeDigits) {
    return normalizePhone(numberDigits);
  }

  return normalizePhone(
    `+${codeDigits}${numberDigits.replace(/^0+/, "")}`
  );
}

/*
|--------------------------------------------------------------------------
| New Message
|--------------------------------------------------------------------------
*/

export default function NewMessage({
  setActiveA,
  language,
  theme,
  isDark,
}) {
  const isEnglish = language === "english";

  const { back } = useTheme();

  /*
  |--------------------------------------------------------------------------
  | Theme Colors - Same As Settings
  |--------------------------------------------------------------------------
  */

  const isBlueTheme = theme === "blue";

  const basePalette = getPalette(theme, isDark);

  const accentTextClass = isBlueTheme
    ? isDark
      ? "text-[#91a8ef]"
      : "text-[#1278e6]"
    : isDark
      ? "text-[#f08080]"
      : "text-[#d93636]";

  const accentBorderClass = isBlueTheme
    ? isDark
      ? "border-[#91a8ef]"
      : "border-[#1278e6]"
    : isDark
      ? "border-[#f08080]"
      : "border-[#d93636]";

  const accentFillClass = isBlueTheme
    ? isDark
      ? "bg-[#91a8ef]"
      : "bg-[#1278e6]"
    : isDark
      ? "bg-[#f08080]"
      : "bg-[#d93636]";

  const textPrimaryClass = isDark
    ? "text-white"
    : isBlueTheme
      ? "text-[#253651]"
      : "text-[#4b2929]";

  const textSecondaryClass = isDark
    ? "text-gray-400"
    : isBlueTheme
      ? "text-[#64748b]"
      : "text-[#936565]";

  const headerTextClass = textPrimaryClass;

  const headerIconClass = isDark
    ? "text-white/80"
    : accentTextClass;

  const pageHex = isBlueTheme
    ? isDark
      ? "#1D202E"
      : "#edf4ff"
    : isDark
      ? "#181818"
      : "#fff1f1";

  /*
  |--------------------------------------------------------------------------
  | Shared Palette
  |--------------------------------------------------------------------------
  */

  const palette = {
    ...basePalette,

    accentText: accentTextClass,
    accentBorder: accentBorderClass,
    accentFill: accentFillClass,

    mutedText: textSecondaryClass,

    raised: back[2],
    sheet: back[2],

    pageHex,
  };

  const [isOpen2, setIsOpen2] = useState(false);

  const rowDir = isEnglish ? "flex-row" : "flex-row-reverse";

  const slideFrom = getSlideSide(language);

  const { setSelectedData } = useChat();

  const { setActiveB } = useB();

  const { setActivePV } = usePV();

  const { mobile: currentUserMobile } = useData();

  const {
    contacts,
    loading: contactsLoading,
    errorCode,
    addContact,
  } = useContacts();

  const contactError = errorCode
    ? getContactErrorMessage(errorCode, language)
    : "";

  const firstNameRef = useRef(null);

  const [selectedConversation, setSelectedConversation] = useState(null);

  const [isScrolled2, setIsScrolled2] = useState(false);

  const [sorted, setSorted] = useState(false);

  const [search, setSearch] = useState("");

  const [conversationError, setConversationError] = useState("");

  const [openingPhone, setOpeningPhone] = useState("");

  const [isChannelOpen, setIsChannelOpen] = useState(false);

  const [isGroupOpen, setIsGroupOpen] = useState(false);

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [countryCode, setCountryCode] = useState("+");

  const [phoneNumber, setPhoneNumber] = useState("");

  const [syncToPhone, setSyncToPhone] = useState(false);

  const [addContactError, setAddContactError] = useState("");

  const [contactSaving, setContactSaving] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Sort and Filter Contacts
  |--------------------------------------------------------------------------
  */

  const visibleContacts = useMemo(() => {
    const ordered = sortContacts(
      contacts,
      sorted ? "name" : "lastSeen",
      language
    );

    const query = normalizeDigits(search).toLocaleLowerCase().trim();

    if (!query) {
      return ordered;
    }

    return ordered.filter((item) => {
      const normalizedTitle = normalizeDigits(item.title).toLocaleLowerCase();

      const normalizedMobile = normalizeDigits(item.mobile).toLocaleLowerCase();

      return (
        normalizedTitle.includes(query) ||
        normalizedMobile.includes(query)
      );
    });
  }, [contacts, sorted, language, search]);

  /*
  |--------------------------------------------------------------------------
  | Open a Newly Created Group or Channel
  |--------------------------------------------------------------------------
  */

  function openCreatedConversation(response, type, fallbackTitle) {
    const conversation = response?.conversation;

    const conversationId = String(
      conversation?._id ?? conversation?.id ?? ""
    );

    if (!response?.success || !conversationId) {
      throw new Error(
        response?.message ||
          (isEnglish
            ? "The server did not return a valid conversation."
            : "سرور اطلاعات معتبر گفتگو را برنگرداند.")
      );
    }

    const category = type === "group" ? "Group" : "Channel";

    const selectedChat = {
      title: conversation.title || fallbackTitle,

      category,

      colorClasses:
        type === "group"
          ? "from-red-600 via-red-50 to-red-600"
          : "from-yellow-600 via-yellow-50 to-yellow-600",

      mobile: conversation.username
        ? `@${conversation.username}`
        : "",

      username: conversation.username || "",

      conversationId,

      conversation,

      peer: null,

      membershipId: response.membershipId || null,

      membership: response.membership || {
        role: "owner",
        isMuted: false,
        isBanned: false,
      },

      unreadCount: 0,

      lastMessage: conversation.lastMessage || null,

      lastMessageText:
        typeof conversation.lastMessage?.text === "string"
          ? conversation.lastMessage.text
          : "",
    };

    setSelectedData(selectedChat);

    setActivePV(null);

    setActiveB("chat");

    window.dispatchEvent(
      new Event("telegraph:conversations:refresh")
    );

    if (typeof setActiveA === "function") {
      setActiveA(null);
    }

    return selectedChat;
  }

  /*
  |--------------------------------------------------------------------------
  | Resolve Selected Phone Contacts to Registered Telegraph Users
  |--------------------------------------------------------------------------
  */

  async function resolveGroupMemberIds(members) {
    if (!Array.isArray(members) || members.length === 0) {
      throw new Error(
        isEnglish
          ? "Select at least one member."
          : "حداقل یک عضو را انتخاب کن."
      );
    }

    if (members.length > 200) {
      throw new Error(
        isEnglish
          ? "A maximum of 200 members can be selected."
          : "حداکثر ۲۰۰ عضو قابل انتخاب است."
      );
    }

    const ownPhoneKey = getPhoneKey(currentUserMobile);

    const uniqueMembers = [];

    const seenPhones = new Set();

    for (const member of members) {
      const phone = normalizePhone(member?.mobile);

      const phoneKey = getPhoneKey(phone);

      if (!phone || !phoneKey) {
        throw new Error(
          isEnglish
            ? `Invalid phone number for ${member?.title || "a contact"}.`
            : `شماره تلفن مخاطب «${member?.title || "بدون نام"}» معتبر نیست.`
        );
      }

      if (ownPhoneKey && phoneKey === ownPhoneKey) {
        continue;
      }

      if (!seenPhones.has(phoneKey)) {
        seenPhones.add(phoneKey);

        uniqueMembers.push({
          ...member,
          mobile: phone,
          phoneKey,
        });
      }
    }

    if (uniqueMembers.length === 0) {
      throw new Error(
        isEnglish
          ? "No other members were selected."
          : "هیچ عضو دیگری انتخاب نشده است."
      );
    }

    const userIds = [];

    for (
      let start = 0;
      start < uniqueMembers.length;
      start += 8
    ) {
      const batch = uniqueMembers.slice(start, start + 8);

      const results = await Promise.all(
        batch.map(async (member) => {
          const response = await apiFetch(
            "/api/user/lookup-phone",
            {
              method: "POST",
              body: JSON.stringify({
                phone: member.mobile,
              }),
            }
          );

          if (
            response?.exists !== true ||
            !response?.user
          ) {
            throw new Error(
              isEnglish
                ? `${member.title || member.mobile} is not registered in Telegraph.`
                : `مخاطب «${member.title || member.mobile}» هنوز در تلگراف ثبت‌نام نکرده است.`
            );
          }

          const userId = String(
            response.user.id ??
              response.user._id ??
              ""
          );

          if (!userId) {
            throw new Error(
              isEnglish
                ? `The server did not return an ID for ${member.title || member.mobile}.`
                : `شناسهٔ مخاطب «${member.title || member.mobile}» از سرور دریافت نشد.`
            );
          }

          return userId;
        })
      );

      userIds.push(...results);
    }

    return [...new Set(userIds)];
  }

  /*
  |--------------------------------------------------------------------------
  | Create Group
  |--------------------------------------------------------------------------
  */

  async function handleCreateGroup(data) {
    const name = String(data?.name || "").trim();

    if (!name) {
      throw new Error(
        isEnglish
          ? "Enter a group name."
          : "نام گروه را وارد کن."
      );
    }

    const userIds = await resolveGroupMemberIds(
      data?.members
    );

    const response = await apiFetch(
      "/api/conversations/group",
      {
        method: "POST",
        body: JSON.stringify({
          title: name,
          description: String(data?.description || "").trim(),
          userIds,
        }),
      }
    );

    if (!response?.success || !response?.conversation) {
      throw new Error(
        response?.message ||
          (isEnglish
            ? "Could not create the group."
            : "ساخت گروه ناموفق بود.")
      );
    }

    openCreatedConversation(
      response,
      "group",
      name
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Create Channel
  |--------------------------------------------------------------------------
  */

  async function handleCreateChannel(data) {
    const name = String(data?.name || "").trim();

    if (!name) {
      throw new Error(
        isEnglish
          ? "Enter a channel name."
          : "نام کانال را وارد کن."
      );
    }

    const isPublic = data?.isPublic === true;

    const username = String(
      data?.username || ""
    )
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    if (
      isPublic &&
      !/^[a-z0-9_]{3,32}$/.test(username)
    ) {
      throw new Error(
        isEnglish
          ? "A public channel username must contain 3 to 32 English letters, numbers or underscores."
          : "نام کاربری کانال عمومی باید بین ۳ تا ۳۲ کاراکتر و شامل حروف انگلیسی، عدد یا زیرخط باشد."
      );
    }

    const response = await apiFetch(
      "/api/conversations/channel",
      {
        method: "POST",
        body: JSON.stringify({
          title: name,
          description: String(data?.description || "").trim(),
          username: isPublic ? username : null,
          isPublic,
        }),
      }
    );

    if (!response?.success || !response?.conversation) {
      throw new Error(
        response?.message ||
          (isEnglish
            ? "Could not create the channel."
            : "ساخت کانال ناموفق بود.")
      );
    }

    openCreatedConversation(
      response,
      "channel",
      name
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Verify User and Open Private Conversation
  |--------------------------------------------------------------------------
  */

  async function handleSelectContact(item) {
    const mobile = normalizePhone(item?.mobile);

    const phoneKey = getPhoneKey(mobile);

    if (!mobile || !phoneKey) {
      setConversationError(
        isEnglish
          ? "This contact does not have a valid phone number."
          : "شماره تلفن این مخاطب معتبر نیست."
      );

      return;
    }

    if (
      currentUserMobile &&
      phoneKey === getPhoneKey(currentUserMobile)
    ) {
      setConversationError(
        isEnglish
          ? "You cannot start a conversation with your own account."
          : "نمی‌توانی با حساب خودت مکالمه ایجاد کنی."
      );

      return;
    }

    setConversationError("");

    setSelectedConversation(mobile);

    setOpeningPhone(mobile);

    try {
      const lookupResponse = await apiFetch(
        "/api/user/lookup-phone",
        {
          method: "POST",
          body: JSON.stringify({
            phone: mobile,
          }),
        }
      );

      if (
        lookupResponse?.exists !== true ||
        !lookupResponse?.user
      ) {
        throw new Error("CONTACT_USER_NOT_FOUND");
      }

      const targetUser = lookupResponse.user;

      const userId = String(
        targetUser.id ??
          targetUser._id ??
          ""
      );

      if (!userId) {
        throw new Error("CONTACT_USER_ID_MISSING");
      }

      const response = await apiFetch(
        "/api/conversations/private",
        {
          method: "POST",
          body: JSON.stringify({
            userId,
          }),
        }
      );

      if (
        !response?.success ||
        !response?.conversation
      ) {
        throw new Error(
          response?.message ||
            "CONVERSATION_CREATION_FAILED"
        );
      }

      const peer = response.peer || targetUser;

      const peerName = [
        peer.firstName,
        peer.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const conversationId = String(
        response.conversation._id ??
          response.conversation.id ??
          ""
      );

      if (!conversationId) {
        throw new Error("CONVERSATION_ID_MISSING");
      }

      const username =
        typeof peer.username === "string" &&
        peer.username.trim()
          ? peer.username.trim()
          : typeof targetUser.username === "string" &&
              targetUser.username.trim()
            ? targetUser.username.trim()
            : "";

      const selectedChat = {
        title:
          peerName ||
          (peer.username
            ? `@${peer.username}`
            : item.title),

        category: "Pv",

        colorClasses:
          item.colorClasses ||
          getAvatarColor(phoneKey),

        mobile,

        username,

        conversationId,

        conversation: response.conversation,

        peer,

        membershipId: response.membershipId || null,

        unreadCount:
          Number(response.unreadCount) || 0,

        lastMessage:
          response.conversation.lastMessage || null,

        lastMessageText:
          typeof response.conversation.lastMessage?.text === "string"
            ? response.conversation.lastMessage.text
            : "",
      };

      setSelectedData(selectedChat);

      setActivePV(null);

      setActiveB("chat");

      if (typeof setActiveA === "function") {
        setActiveA(null);
      }
    } catch (error) {
      console.error(
        "Failed to open private conversation:",
        error
      );

      if (error?.message === "CONTACT_USER_NOT_FOUND") {
        setConversationError(
          isEnglish
            ? "This phone number is not registered in Telegraph. The contact has been saved, but a conversation cannot be created yet."
            : "این شماره در تلگراف ثبت‌نام نکرده است. مخاطب ذخیره شد، اما فعلاً امکان ایجاد مکالمه وجود ندارد."
        );
      } else if (
        error?.message === "CONTACT_USER_ID_MISSING"
      ) {
        setConversationError(
          isEnglish
            ? "The account was found, but its user ID was not returned by the server."
            : "حساب کاربر پیدا شد، اما شناسهٔ او از سرور دریافت نشد."
        );
      } else if (
        error?.message === "CONVERSATION_ID_MISSING"
      ) {
        setConversationError(
          isEnglish
            ? "The conversation was returned without a valid ID."
            : "مکالمه دریافت شد، اما شناسهٔ معتبری ندارد."
        );
      } else {
        setConversationError(
          error?.message ||
            (isEnglish
              ? "Could not create or open the conversation."
              : "ایجاد یا بازکردن مکالمه ناموفق بود.")
        );
      }
    } finally {
      setOpeningPhone("");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | New Contact Sheet
  |--------------------------------------------------------------------------
  */

  function openAddContact() {
    setFirstName("");
    setLastName("");
    setCountryCode("+");
    setPhoneNumber("");
    setSyncToPhone(false);
    setAddContactError("");
    setConversationError("");
    setIsAddContactOpen(true);
  }

  function closeAddContact() {
    if (contactSaving) {
      return;
    }

    setIsAddContactOpen(false);
    setAddContactError("");
  }

  function handleCountryCodeChange(event) {
    const digits = normalizeDigits(event.target.value)
      .replace(/\D/g, "")
      .slice(0, 4);

    setCountryCode(`+${digits}`);
  }

  function handlePhoneNumberChange(event) {
    setPhoneNumber(
      normalizeDigits(event.target.value).replace(/[^\d\s-]/g, "")
    );
  }

  function handleAddViaQr() {
    setAddContactError(
      isEnglish
        ? "Adding a contact via QR code is not available yet."
        : "افزودن مخاطب با کد QR هنوز در دسترس نیست."
    );
  }

  async function handleCreateContact(event) {
    event.preventDefault();

    setAddContactError("");
    setConversationError("");

    const first = firstName.trim();

    const last = lastName.trim();

    const title = [
      first,
      last,
    ]
      .filter(Boolean)
      .join(" ");

    const mobile = buildPhone(
      countryCode,
      phoneNumber
    );

    const phoneKey = getPhoneKey(mobile);

    if (!first) {
      setAddContactError(
        isEnglish
          ? "Enter the first name."
          : "نام مخاطب را وارد کن."
      );

      return;
    }

    if (
      !phoneKey ||
      phoneKey.length < 7 ||
      phoneKey.length > 15
    ) {
      setAddContactError(
        isEnglish
          ? "Enter a valid phone number."
          : "یک شماره تلفن معتبر وارد کن."
      );

      return;
    }

    if (
      currentUserMobile &&
      phoneKey === getPhoneKey(currentUserMobile)
    ) {
      setAddContactError(
        isEnglish
          ? "You cannot add your own number as a contact."
          : "نمی‌توانی شمارهٔ خودت را به‌عنوان مخاطب اضافه کنی."
      );

      return;
    }

    const existingContact = contacts.find(
      (item) => getPhoneKey(item.mobile) === phoneKey
    );

    if (existingContact) {
      setAddContactError(
        isEnglish
          ? "A contact with this phone number already exists."
          : "مخاطبی با این شماره تلفن از قبل وجود دارد."
      );

      return;
    }

    const contact = {
      title,
      category: "Pv",
      mobile,
      colorClasses: getAvatarColor(phoneKey),
      contactId: `manual-${phoneKey}`,
      isManual: true,
    };

    addContact(contact);

    if (syncToPhone) {
      void saveContactToDevice({
        firstName: first,
        lastName: last,
        mobile,
      });
    }

    setSearch("");
    setIsAddContactOpen(false);

    setContactSaving(true);

    try {
      await handleSelectContact(contact);
    } finally {
      setContactSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Contact Feedback
  |--------------------------------------------------------------------------
  */

  function renderContactFeedback() {
    return (
      <>
        {contactsLoading && (
          <div
            className={`
              w-full
              px-[20px]
              py-[12px]
              text-[14px]
              ${textSecondaryClass}
            `}
            dir={isEnglish ? "ltr" : "rtl"}
          >
            {isEnglish
              ? "Loading phone contacts..."
              : "در حال دریافت مخاطبین گوشی..."}
          </div>
        )}

        {contactError && (
          <div
            role="alert"
            className={`
              mx-[15px]
              my-[10px]
              rounded-xl
              bg-red-500/10
              px-[12px]
              py-[10px]
              text-[13px]
              ${textSecondaryClass}
            `}
            dir={isEnglish ? "ltr" : "rtl"}
          >
            {contactError}
          </div>
        )}
      </>
    );
  }

  function renderContactRows() {
    return visibleContacts.map((item) => (
      <ContactRow
        key={getPhoneKey(item.mobile)}
        item={item}
        language={language}
        palette={palette}
        avatarSize={44}
        highlighted={selectedConversation === item.mobile}
        loading={openingPhone === item.mobile}
        onClick={() => void handleSelectContact(item)}
      />
    ));
  }

  /*
  |--------------------------------------------------------------------------
  | Scroll
  |--------------------------------------------------------------------------
  */

  const handleScroll = (event) => {
    setIsScrolled2(event.currentTarget.scrollTop > 10);
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
       <div
        onScroll={handleScroll}
        className={`
          relative
          ${back[1]}
        h-screen
          w-full
          min-w-0
          max-w-full
          overflow-x-hidden
          overflow-y-auto
          overscroll-contain
          scrollbar-none
          pb-[200px]
          transition-colors
          duration-200
        `}
      >

        <div
          className={`
            fixed
            inset-x-0
            top-0
            w-full
            h-[110px]
            z-[40]
            flex
            items-center
            justify-between
            px-[15px]
            ${headerTextClass}
          `}
        >
          {/* Layer 1: soft blur across the whole header */}

          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              inset-0
              backdrop-blur-[7px]
              transition-opacity
              duration-300
              ease-out
              ${isScrolled2 ? "opacity-100" : "opacity-0"}
            `}
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 0%, #000 50%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, #000 0%, #000 50%, transparent 100%)",
            }}
          />

          {/* Layer 2: stronger blur at the top, fading out toward the bottom */}

          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              inset-0
              backdrop-blur-[3.5px]
              transition-opacity
              duration-300
              ease-out
              ${isScrolled2 ? "opacity-100" : "opacity-0"}
            `}
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 0%, #000 35%, transparent 75%)",
              maskImage:
                "linear-gradient(to bottom, #000 0%, #000 35%, transparent 75%)",
            }}
          />

          {/* Layer 3: dark (or white in light mode) gradient on top of the blur */}

          <div
            aria-hidden="true"
            className={`
              pointer-events-none
              absolute
              inset-0
              bg-linear-to-b
              transition-opacity
              duration-300
              ease-out
              ${
                isDark
                  ? "from-[#000]/55 via-[#000]/20"
                  : "from-[#ffffff]/55 via-[#ffffff]/20"
              }
              to-transparent
              ${isScrolled2 ? "opacity-100" : "opacity-0"}
            `}
          />

          {/* Back Button */}

          <div
          onClick={()=>setActiveA(null)}
            className={`
              w-[40px]
              h-[40px]
              rounded-full
              ${isDark ? "bg-[#151515]" : "bg-[#edebeb]"}
              z-[50]
              top-[14px]
              left-[15px]
              absolute
              outline-1
              outline-white/10
              -outline-offset-1
              flex
              items-center
              justify-center
              px-[12.5px]
            `}
          />

          {/* Header Title */}

          <span
            className={`
              relative
              text-[17px]
              -mt-[41px]
              font-bold
              mx-auto
              ${headerTextClass}
              transition-opacity
              duration-300
            
            `}
          >
            Settings
          </span>

          {/* Header Actions */}

          <div
            className={`
              ${
                isOpen2
                  ? `min-w-[160px] h-auto px-[15px] py-[10px] rounded-2xl ${
                      isDark ? "bg-[#151515]" : "bg-[#edebeb]"
                    }`
                  : `w-[85px] h-[40px] rounded-3xl ${
                      isDark ? "bg-[#151515]" : "bg-[#edebeb]"
                    }`
              }
              transition-all
              duration-100
              ease-in-out
              z-[50]
              top-[14px]
              right-[15px]
              absolute
              outline-1
              outline-white/10
              -outline-offset-1
              flex
              items-center
              justify-between
              px-[12.5px]
              ${textPrimaryClass}
            `}
          >
            {!isOpen2 && (
              <span
                className={`
                  transition-opacity
                  duration-100
                  ${isOpen2 ? "opacity-0" : "opacity-100"}
                  ${headerIconClass}
                `}
              >
                <SearchIcon size={20} />
              </span>
            )}

            {!isOpen2 && (
              <span
                onClick={() => setIsOpen2(true)}
                className={`
                  transition-opacity
                  duration-100
                  cursor-pointer
                  ${isOpen2 ? "opacity-0" : "opacity-100"}
                  ${headerIconClass}
                `}
              >
                <EllipsisVertical size={20} />
              </span>
            )}

            {isOpen2 && (
              <div
                className={`
                  flex
                  gap-[10px]
                  transition-opacity
                  duration-100
                  w-full
                  ${isOpen2 ? "opacity-100" : "opacity-0"}
                  ${textPrimaryClass}
                `}
              >
                <LogOut size={22} />

                <span className="tracking-wide">
                  Log Out
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Header Backdrop */}

        <div
          onClick={isOpen2 ? () => setIsOpen2(null) : undefined}
          className={`
            fixed
            inset-0
            z-[40]
            ${
              isOpen2
                ? "panels-a-backdrop-enter"
                : "panels-a-backdrop-exit"
            }
          `}
        />

        {/* Main Content */}

        <div className="relative pb-10">

          {/* Conversation Error */}

          {conversationError && (
            <div
              role="alert"
              className={`
                mx-[12px]
                mt-[12px]
                rounded-xl
                border
                border-red-400/20
                bg-red-500/10
                px-[12px]
                py-[10px]
                text-[13px]
                ${textSecondaryClass}
              `}
              dir={isEnglish ? "ltr" : "rtl"}
            >
              {conversationError}
            </div>
          )}

          {search.length > 0 ? (
            <div className="pt-[8px] mt-[110px]">
              <div className="flex w-full flex-col items-start">
                {renderContactFeedback()}

                {renderContactRows()}
              </div>

              <div
                className="mt-[15px] flex items-center justify-center"
                dir="rtl"
              >
                {visibleContacts.length === 0 &&
                  !contactsLoading &&
                  !contactError && (
                    <span
                      className={`
                        text-[17px]
                        font-medium
                        ${textSecondaryClass}
                      `}
                    >
                      {isEnglish
                        ? "No matching contacts found."
                        : "مخاطبی با این نام یا شماره یافت نشد."}
                    </span>
                  )}
              </div>
            </div>
          ) : (
            <div className="mt-[70px]">

              {/* New Group / New Channel */}

              <div
                className={`
                  mx-[12px]
                  mt-[8px]
                  overflow-hidden
                  rounded-2xl
                  ${back[2]}
                `}
              >
                <button
                  type="button"
                  onClick={() => setIsGroupOpen(true)}
                  className={`
                    flex
                    h-[50px]
                    w-full
                    cursor-pointer
                    items-center
                    gap-[12px]
                    px-[12px]
                    transition-colors
                    duration-200
                    hover:bg-white/[0.05]
                    active:bg-white/10
                    ${rowDir}
                  `}
                >
                  <span className="flex h-[28px] w-[28px] items-center justify-center rounded-lg bg-[#2a96e8] text-[15px] text-white">
                    <FontAwesomeIcon icon={faUserGroup} />
                  </span>

                  <span
                    className={`
                      text-[17px]
                      font-normal
                      ${textPrimaryClass}
                    `}
                  >
                    {isEnglish ? "New Group" : "گروه جدید"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsChannelOpen(true)}
                  className={`
                    flex
                    h-[50px]
                    w-full
                    cursor-pointer
                    items-center
                    gap-[12px]
                    px-[12px]
                    transition-colors
                    duration-200
                    hover:bg-white/[0.05]
                    active:bg-white/10
                    ${rowDir}
                  `}
                >
                  <span className="flex h-[28px] w-[28px] items-center justify-center rounded-lg bg-[#3cb64a] text-[15px] text-white">
                    <FontAwesomeIcon icon={faBullhorn} />
                  </span>

                  <span
                    className={`
                      text-[17px]
                      font-normal
                      ${textPrimaryClass}
                    `}
                  >
                    {isEnglish ? "New Channel" : "کانال جدید"}
                  </span>
                </button>
              </div>

              {/* Contacts */}

              <div
                className={`
                  mx-[12px]
                  mt-[12px]
                  overflow-hidden
                  rounded-2xl
                  pb-[6px]
                  pt-[17px]
                  ${back[2]}
                `}
              >
                <div
                  className={`
                    px-[21px]
                    text-[14px]
                    font-semibold
                    leading-[22px]
                    ${accentTextClass}
                    ${isEnglish ? "text-left" : "text-right"}
                  `}
                >
                  {sorted
                    ? isEnglish
                      ? "Sorted by name"
                      : "مرتب شده بر اساس نام"
                    : isEnglish
                      ? "Sorted by last seen time"
                      : "مرتب شده بر اساس آخرین بازدید"}
                </div>

                <div className="mt-[6px] flex w-full flex-col items-start">
                  {renderContactFeedback()}

                  {renderContactRows()}

                  {!contactsLoading &&
                    !contactError &&
                    contacts.length === 0 && (
                      <div
                        className={`
                          w-full
                          px-[20px]
                          py-[12px]
                          text-[14px]
                          ${textSecondaryClass}
                        `}
                        dir={isEnglish ? "ltr" : "rtl"}
                      >
                        {isEnglish
                          ? "No contacts with phone numbers were found. Use the add button to create a contact."
                          : "مخاطبی دارای شماره تلفن پیدا نشد. برای ایجاد مخاطب، دکمهٔ افزودن را انتخاب کن."}
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      

      {/* Add Contact Button */}

      <FloatingButton
        language={language}
        onClick={openAddContact}
        label={isEnglish ? "New contact" : "مخاطب جدید"}
        className={accentFillClass}
        delay={150}
      >
        <UserPlus size={24} fill="currentColor" />
      </FloatingButton>

      {/* New Contact Sheet */}

      <BottomSheet
        open={isAddContactOpen}
        onClose={closeAddContact}
        className={back[2]}
        label={isEnglish ? "New Contact" : "مخاطب جدید"}
        onEntered={() =>
          firstNameRef.current?.focus({ preventScroll: true })
        }
      >
        <form
          onSubmit={handleCreateContact}
          dir={isEnglish ? "ltr" : "rtl"}
          className="px-[16px] pb-[max(16px,env(safe-area-inset-bottom))] pt-[18px]"
        >
          <h2
            className={`
              mb-[17px]
              px-[5px]
              text-[20px]
              font-semibold
              leading-[28px]
              ${textPrimaryClass}
            `}
          >
            {isEnglish ? "New Contact" : "مخاطب جدید"}
          </h2>

          <div className="mb-[18px]">
            <OutlinedField
              id="new-contact-first-name"
              label={
                isEnglish
                  ? "First name (required)"
                  : "نام (الزامی)"
              }
              filled={firstName.length > 0}
              startFocused
              palette={palette}
            >
              <input
                ref={firstNameRef}
                id="new-contact-first-name"
                autoComplete="given-name"
                type="text"
                maxLength={40}
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                className={`
                  h-full
                  w-full
                  bg-transparent
                  px-[16px]
                  text-[16px]
                  ${textPrimaryClass}
                  outline-none
                `}
              />
            </OutlinedField>
          </div>

          <div className="mb-[20px]">
            <OutlinedField
              id="new-contact-last-name"
              label={
                isEnglish
                  ? "Last name (optional)"
                  : "نام خانوادگی (اختیاری)"
              }
              filled={lastName.length > 0}
              palette={palette}
            >
              <input
                id="new-contact-last-name"
                autoComplete="family-name"
                type="text"
                maxLength={40}
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                className={`
                  h-full
                  w-full
                  bg-transparent
                  px-[16px]
                  text-[16px]
                  ${textPrimaryClass}
                  outline-none
                `}
              />
            </OutlinedField>
          </div>

          <OutlinedField
            id="new-contact-phone"
            label={
              isEnglish
                ? "Phone number"
                : "شماره تلفن"
            }
            filled
            palette={palette}
          >
            <div
              className="flex h-full w-full items-center"
              dir="ltr"
            >
              <input
                aria-label={
                  isEnglish
                    ? "Country code"
                    : "کد کشور"
                }
                inputMode="tel"
                type="tel"
                value={countryCode}
                onChange={handleCountryCodeChange}
                className={`
                  h-full
                  w-[105px]
                  shrink-0
                  bg-transparent
                  text-center
                  text-[16px]
                  ${textPrimaryClass}
                  outline-none
                `}
              />

              <span className="h-[20px] w-px shrink-0 bg-white/25" />

              <input
                id="new-contact-phone"
                autoComplete="tel-national"
                inputMode="tel"
                type="tel"
                maxLength={20}
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                className={`
                  h-full
                  min-w-0
                  flex-1
                  bg-transparent
                  px-[14px]
                  text-left
                  text-[16px]
                  ${textPrimaryClass}
                  outline-none
                `}
              />
            </div>
          </OutlinedField>

          {/* Sync Contact */}

          <button
            type="button"
            role="checkbox"
            aria-checked={syncToPhone}
            onClick={() =>
              setSyncToPhone((previous) => !previous)
            }
            className="
              mt-[6px]
              flex
              h-[40px]
              w-full
              cursor-pointer
              items-center
              gap-[10px]
              px-[13px]
              text-start
            "
          >
            <span
              className={`
                flex
                h-[20px]
                w-[20px]
                shrink-0
                items-center
                justify-center
                rounded-full
                border-[1.5px]
                text-white
                transition-colors
                duration-150
                ${
                  syncToPhone
                    ? `border-transparent ${accentFillClass}`
                    : "border-white/45"
                }
              `}
            >
              {syncToPhone && (
                <Check size={13} strokeWidth={3} />
              )}
            </span>

            <span
              className={`
                text-[16px]
                ${textPrimaryClass}
              `}
            >
              {isEnglish
                ? "Sync Contact to Phone"
                : "همگام‌سازی مخاطب با گوشی"}
            </span>
          </button>

          <div className="mt-[21px] h-px w-full bg-white/10" />

          {/* Add via QR */}

          <button
            type="button"
            onClick={handleAddViaQr}
            className={`
              mt-[9px]
              flex
              h-[40px]
              w-full
              cursor-pointer
              items-center
              justify-center
              gap-[10px]
              text-[16px]
              font-medium
              ${accentTextClass}
            `}
          >
            <QrCode size={21} />

            <span>
              {isEnglish
                ? "Add via QR Code"
                : "افزودن با کد QR"}
            </span>
          </button>

          {addContactError && (
            <div
              role="alert"
              className={`
                mt-[10px]
                rounded-xl
                bg-red-500/10
                px-[12px]
                py-[10px]
                text-[13px]
                ${textSecondaryClass}
              `}
            >
              {addContactError}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={contactSaving}
            className={`
              mt-[17px]
              flex
              h-[48px]
              w-full
              cursor-pointer
              items-center
              justify-center
              gap-[8px]
              rounded-full
              text-[16px]
              font-semibold
              text-white
              transition-[opacity,transform]
              duration-150
              active:scale-[0.98]
              disabled:opacity-60
              ${accentFillClass}
            `}
          >
            {contactSaving ? (
              <>
                <span className="h-[16px] w-[16px] animate-spin rounded-full border-2 border-white/30 border-t-white" />

                <span>
                  {isEnglish
                    ? "Checking..."
                    : "در حال بررسی..."}
                </span>
              </>
            ) : isEnglish ? (
              "Create Contact"
            ) : (
              "ایجاد مخاطب"
            )}
          </button>
        </form>
      </BottomSheet>

      {/* New Channel */}

      <SlidePage
        open={isChannelOpen}
        from={slideFrom}
        background={pageHex}
      >
        <NewChannel
          type="channel"
          language={language}
          theme={theme}
          isDark={isDark}
          onBack={() => setIsChannelOpen(false)}
          onCreate={handleCreateChannel}
        />
      </SlidePage>

      {/* New Group */}

      <SlidePage
        open={isGroupOpen}
        from={slideFrom}
        background={pageHex}
      >
        <NewGroup
          setActiveA={setActiveA}
          onBack={() => setIsGroupOpen(false)}
          language={language}
          theme={theme}
          isDark={isDark}
          onCreateGroup={handleCreateGroup}
        />
      </SlidePage>


</div>


      
    </>
  );
}
