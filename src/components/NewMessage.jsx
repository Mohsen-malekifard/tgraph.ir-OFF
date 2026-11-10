"use client";

import { useMemo, useRef, useState } from "react";

import { useB } from "@/context/BContext";
import { usePV } from "@/context/PVContext";
import { useChat } from "@/context/ChatContext";
import { useData } from "@/context/DataContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faUserGroup,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  QrCode,
  Search,
  UserPlus,
  X,
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
      className={`relative flex h-[50px] items-center rounded-xl border transition-colors duration-150 ${
        focused
          ? `${palette.accentText} ${palette.accentBorder} shadow-[inset_0_0_0_1px_currentColor]`
          : "border-white/15 text-white/55"
      }`}
    >
      <label
        htmlFor={id}
        className={`pointer-events-none absolute z-10 whitespace-nowrap transition-all duration-150 ${
          floating
            ? `-top-[10px] start-[11px] px-[4px] text-[13px] leading-[18px] ${palette.sheet}`
            : "start-[16px] top-1/2 -translate-y-1/2 text-[16px]"
        }`}
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

  const palette = getPalette(theme, isDark);

  const rowDir = isEnglish ? "flex-row" : "flex-row-reverse";

  const BackIcon = isEnglish ? ArrowLeft : ArrowRight;

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

    const category =
      type === "group"
        ? "Group"
        : "Channel";

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

    /*
     * Refresh the main list after the server has successfully created
     * the conversation. The main page listens for this event.
     */

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

    /*
     * Resolve contacts in small batches to avoid sending a large burst
     * of lookup requests to the API.
     */

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

    return [
      ...new Set(userIds),
    ];
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
            className="w-full px-[20px] py-[12px] text-[14px] text-gray-400"
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
            className="mx-[15px] my-[10px] rounded-xl bg-red-500/10 px-[12px] py-[10px] text-[13px] text-red-300"
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
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <div
        onScroll={(e) => {
          setIsScrolled2(e.currentTarget.scrollTop > 10);
        }}
        className="scrollbar-none overflow-y-scroll pb-[90px]"
      >
        {/* Header */}

        <div
          className={`relative z-30 h-[96px] w-full overflow-hidden ${palette.header}`}
        >
          <div
            className={`${
              isScrolled2 ? "bg-[#31364d]" : ""
            } fixed z-[60] flex h-[48px] w-full items-center justify-between px-4 transition-colors duration-200 ${rowDir}`}
          >
            <div className={`flex items-center gap-[40px] ${rowDir}`}>
              <button
                type="button"
                onClick={() => setActiveA(null)}
                aria-label={isEnglish ? "Back" : "بازگشت"}
                className="flex cursor-pointer items-center justify-center text-white"
              >
                <BackIcon size={26} />
              </button>

              <h1 className="text-[20px] font-semibold leading-none tracking-tight text-white">
                {isEnglish ? "New Message" : "مکالمه جدید"}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setSorted((previous) => !previous)}
              aria-label={
                sorted
                  ? isEnglish
                    ? "Sort by last seen time"
                    : "مرتب‌سازی بر اساس آخرین بازدید"
                  : isEnglish
                    ? "Sort contacts alphabetically"
                    : "مرتب‌سازی الفبایی مخاطبین"
              }
              className="flex cursor-pointer items-center justify-center text-white/70"
            >
              {sorted
                ? <Clock size={22} />
                : <SortByNameIcon size={26} />}
            </button>
          </div>

          {/* Search */}

          <div className="absolute bottom-[7px] left-0 z-[50] flex w-full flex-col px-[12px]">
            <div
              className={`relative flex h-[40px] w-full items-center gap-[10px] rounded-full bg-white/10 px-[15px] ${rowDir}`}
            >
              <span className="text-center text-gray-400">
                <Search size={20} />
              </span>

              <input
                className={`w-full bg-transparent text-[16px] text-white outline-none placeholder:text-[16px] placeholder:font-normal placeholder:text-gray-400 ${
                  isEnglish ? "text-left" : "text-right"
                }`}
                placeholder={
                  isEnglish
                    ? "Search Contacts"
                    : "جستجو در تلگراف"
                }
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label={
                  isEnglish
                    ? "Clear search"
                    : "پاک‌کردن جست‌وجو"
                }
                className={`text-center text-gray-400 transition-all duration-300 ${
                  search.length === 0
                    ? "pointer-events-none scale-75 opacity-0"
                    : "scale-100 opacity-100"
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Conversation Error */}

        {conversationError && (
          <div
            role="alert"
            className="mx-[12px] mt-[12px] rounded-xl border border-red-400/20 bg-red-500/10 px-[12px] py-[10px] text-[13px] text-red-300"
            dir={isEnglish ? "ltr" : "rtl"}
          >
            {conversationError}
          </div>
        )}

        {search.length > 0 ? (
          <div className="pt-[8px]">
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
                  <span className="text-[17px] font-medium text-gray-500">
                    {isEnglish
                      ? "No matching contacts found."
                      : "مخاطبی با این نام یا شماره یافت نشد."}
                  </span>
                )}
            </div>
          </div>
        ) : (
          <div>
            {/* New Group / New Channel */}

            <div
              className={`mx-[12px] mt-[8px] overflow-hidden rounded-2xl ${palette.raised}`}
            >
              <button
                type="button"
                onClick={() => setIsGroupOpen(true)}
                className={`flex h-[50px] w-full cursor-pointer items-center gap-[12px] px-[12px] transition-colors duration-200 hover:bg-white/[0.05] active:bg-white/10 ${rowDir}`}
              >
                <span className="flex h-[28px] w-[28px] items-center justify-center rounded-lg bg-[#2a96e8] text-[15px] text-white">
                  <FontAwesomeIcon icon={faUserGroup} />
                </span>

                <span className="text-[17px] font-normal text-white">
                  {isEnglish ? "New Group" : "گروه جدید"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsChannelOpen(true)}
                className={`flex h-[50px] w-full cursor-pointer items-center gap-[12px] px-[12px] transition-colors duration-200 hover:bg-white/[0.05] active:bg-white/10 ${rowDir}`}
              >
                <span className="flex h-[28px] w-[28px] items-center justify-center rounded-lg bg-[#3cb64a] text-[15px] text-white">
                  <FontAwesomeIcon icon={faBullhorn} />
                </span>

                <span className="text-[17px] font-normal text-white">
                  {isEnglish ? "New Channel" : "کانال جدید"}
                </span>
              </button>
            </div>

            {/* Contacts */}

            <div
              className={`mx-[12px] mt-[12px] overflow-hidden rounded-2xl pb-[6px] pt-[17px] ${palette.raised}`}
            >
              <div
                className={`px-[21px] text-[14px] font-semibold leading-[22px] ${palette.accentText} ${
                  isEnglish ? "text-left" : "text-right"
                }`}
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
                      className="w-full px-[20px] py-[12px] text-[14px] text-gray-500"
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
        className={palette.accentFill}
        delay={150}
      >
        <UserPlus size={24} fill="currentColor" />
      </FloatingButton>

      {/* New Contact Sheet */}

      <BottomSheet
        open={isAddContactOpen}
        onClose={closeAddContact}
        className={palette.sheet}
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
          <h2 className="mb-[17px] px-[5px] text-[20px] font-semibold leading-[28px] text-white">
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
                className="h-full w-full bg-transparent px-[16px] text-[16px] text-white outline-none"
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
                className="h-full w-full bg-transparent px-[16px] text-[16px] text-white outline-none"
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
                className="h-full w-[105px] shrink-0 bg-transparent text-center text-[16px] text-white outline-none"
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
                className="h-full min-w-0 flex-1 bg-transparent px-[14px] text-left text-[16px] text-white outline-none"
              />
            </div>
          </OutlinedField>

          <button
            type="button"
            role="checkbox"
            aria-checked={syncToPhone}
            onClick={() =>
              setSyncToPhone((previous) => !previous)
            }
            className="mt-[6px] flex h-[40px] w-full cursor-pointer items-center gap-[10px] px-[13px] text-start"
          >
            <span
              className={`flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-white transition-colors duration-150 ${
                syncToPhone
                  ? `border-transparent ${palette.accentFill}`
                  : "border-white/45"
              }`}
            >
              {syncToPhone && (
                <Check size={13} strokeWidth={3} />
              )}
            </span>

            <span className="text-[16px] text-white">
              {isEnglish
                ? "Sync Contact to Phone"
                : "همگام‌سازی مخاطب با گوشی"}
            </span>
          </button>

          <div className="mt-[21px] h-px w-full bg-white/10" />

          <button
            type="button"
            onClick={handleAddViaQr}
            className={`mt-[9px] flex h-[40px] w-full cursor-pointer items-center justify-center gap-[10px] text-[16px] font-medium ${palette.accentText}`}
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
              className="mt-[10px] rounded-xl bg-red-500/10 px-[12px] py-[10px] text-[13px] text-red-300"
            >
              {addContactError}
            </div>
          )}

          <button
            type="submit"
            disabled={contactSaving}
            className={`mt-[17px] flex h-[48px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-full text-[16px] font-semibold text-white transition-[opacity,transform] duration-150 active:scale-[0.98] disabled:opacity-60 ${palette.accentFill}`}
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
        background={palette.pageHex}
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
        background={palette.pageHex}
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
    </>
  );
}
