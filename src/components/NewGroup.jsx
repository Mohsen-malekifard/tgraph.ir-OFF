"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useData } from "@/context/DataContext";

import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
} from "lucide-react";

import {
  getContactErrorMessage,
  getPalette,
  getPhoneKey,
  normalizeDigits,
  sortContacts,
  useContacts,
} from "@/lib/contacts";

import ContactRow from "@/components/ContactRow";
import NewChannel from "@/components/NewChannel";

import {
  FloatingButton,
  SlidePage,
  getSlideSide,
} from "@/components/Motion";

const MAX_MEMBERS = 200;

/*
|--------------------------------------------------------------------------
| New Group
|--------------------------------------------------------------------------
|
| onCreateGroup receives:
| {
|   type: "group",
|   name,
|   description,
|   photo,
|   members
| }
|
*/

export default function NewGroup({
  setActiveA,
  onBack,
  language,
  theme,
  isDark,
  onCreateGroup,
}) {
  const isEnglish = language === "english";

  const palette = getPalette(theme, isDark);

  const rowDir = isEnglish
    ? "flex-row"
    : "flex-row-reverse";

  const BackIcon = isEnglish
    ? ArrowLeft
    : ArrowRight;

  const NextIcon = isEnglish
    ? ArrowRight
    : ArrowLeft;

  const { mobile: currentUserMobile } = useData();

  const {
    contacts,
    loading: contactsLoading,
    errorCode,
  } = useContacts();

  const contactError = errorCode
    ? getContactErrorMessage(errorCode, language)
    : "";

  const noticeTimer = useRef(null);

  const [isScrolled2, setIsScrolled2] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedKeys, setSelectedKeys] = useState([]);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [notice, setNotice] = useState("");

  useEffect(() => {
    return () => {
      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Sort and Filter Contacts
  |--------------------------------------------------------------------------
  */

  const visibleContacts = useMemo(() => {
    const ownKey = getPhoneKey(currentUserMobile);

    const others = contacts.filter(
      (item) =>
        !ownKey ||
        getPhoneKey(item.mobile) !== ownKey
    );

    const ordered = sortContacts(
      others,
      "lastSeen",
      language
    );

    const query = normalizeDigits(search)
      .toLocaleLowerCase()
      .trim();

    if (!query) {
      return ordered;
    }

    return ordered.filter((item) => {
      const normalizedTitle = normalizeDigits(item.title)
        .toLocaleLowerCase();

      const normalizedMobile = normalizeDigits(item.mobile)
        .toLocaleLowerCase();

      return (
        normalizedTitle.includes(query) ||
        normalizedMobile.includes(query)
      );
    });
  }, [
    contacts,
    currentUserMobile,
    language,
    search,
  ]);

  const selectedSet = useMemo(
    () => new Set(selectedKeys),
    [selectedKeys]
  );

  const selectedContacts = useMemo(
    () =>
      selectedKeys
        .map((key) =>
          contacts.find(
            (item) => getPhoneKey(item.mobile) === key
          )
        )
        .filter(Boolean),
    [selectedKeys, contacts]
  );

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  function handleBack() {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    if (typeof setActiveA === "function") {
      setActiveA("new-message");
    }
  }

  function showNotice(message) {
    setNotice(message);

    if (noticeTimer.current) {
      clearTimeout(noticeTimer.current);
    }

    noticeTimer.current = setTimeout(
      () => setNotice(""),
      2500
    );
  }

  function toggleContact(item) {
    const key = getPhoneKey(item.mobile);

    if (!key) {
      return;
    }

    setSelectedKeys((previous) => {
      if (previous.includes(key)) {
        return previous.filter(
          (value) => value !== key
        );
      }

      if (previous.length >= MAX_MEMBERS) {
        showNotice(
          isEnglish
            ? `A maximum of ${MAX_MEMBERS} members can be selected.`
            : `حداکثر ${MAX_MEMBERS.toLocaleString("fa-IR")} عضو قابل انتخاب است.`
        );

        return previous;
      }

      return [
        ...previous,
        key,
      ];
    });
  }

  function handleNext() {
    if (selectedContacts.length === 0) {
      showNotice(
        isEnglish
          ? "Select at least one member."
          : "حداقل یک عضو را انتخاب کن."
      );

      return;
    }

    setIsDetailsOpen(true);
  }

  const selectedCount = selectedContacts.length;

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
          className={`relative z-30 h-[96px] w-full overflow-hidden ${palette.raised}`}
        >
          <div
            className={`${
              isScrolled2
                ? "bg-[#31364d]"
                : ""
            } fixed z-[60] flex h-[48px] w-full items-center px-4 transition-colors duration-200 ${rowDir}`}
          >
            <div className={`flex items-center gap-[40px] ${rowDir}`}>
              <button
                type="button"
                onClick={handleBack}
                aria-label={
                  isEnglish
                    ? "Back"
                    : "بازگشت"
                }
                className="flex cursor-pointer items-center justify-center text-white"
              >
                <BackIcon size={26} />
              </button>

              <div
                className={`flex flex-col ${
                  isEnglish
                    ? "items-start text-left"
                    : "items-end text-right"
                }`}
              >
                <h1 className="text-[20px] font-semibold leading-[19px] tracking-tight text-white">
                  {isEnglish
                    ? "New Group"
                    : "گروه جدید"}
                </h1>

                <span className="text-[16px] leading-[18px] text-white/50">
                  {selectedCount > 0
                    ? isEnglish
                      ? `${selectedCount} of ${MAX_MEMBERS} members`
                      : `${selectedCount.toLocaleString("fa-IR")} از ${MAX_MEMBERS.toLocaleString("fa-IR")} عضو`
                    : isEnglish
                      ? `up to ${MAX_MEMBERS} members`
                      : `تا ${MAX_MEMBERS.toLocaleString("fa-IR")} عضو`}
                </span>
              </div>
            </div>
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
                  isEnglish
                    ? "text-left"
                    : "text-right"
                }`}
                placeholder={
                  isEnglish
                    ? "Who would you like to add?"
                    : "چه کسی را می‌خواهی اضافه کنی؟"
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

        {/* Contacts */}

        <div className="flex w-full flex-col items-start">
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

          {visibleContacts.map((item) => {
            const key = getPhoneKey(item.mobile);

            return (
              <ContactRow
                key={key}
                item={item}
                language={language}
                palette={palette}
                avatarSize={46}
                selected={selectedSet.has(key)}
                onClick={() => toggleContact(item)}
              />
            );
          })}
        </div>

        <div
          className="mt-[15px] flex items-center justify-center"
          dir="rtl"
        >
          {visibleContacts.length === 0 &&
            !contactsLoading &&
            !contactError && (
              <span className="text-[17px] font-medium text-gray-500">
                {search.length > 0
                  ? isEnglish
                    ? "No matching contacts found."
                    : "مخاطبی با این نام یا شماره یافت نشد."
                  : isEnglish
                    ? "No contacts with phone numbers were found."
                    : "مخاطبی دارای شماره تلفن پیدا نشد."}
              </span>
            )}
        </div>
      </div>

      {/* Notice */}

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[74px] z-[80] flex justify-center">
          <span className="rounded-full bg-black/70 px-[16px] py-[8px] text-[14px] text-white">
            {notice}
          </span>
        </div>
      )}

      {/* Next Button */}

      <FloatingButton
        language={language}
        onClick={handleNext}
        label={
          isEnglish
            ? "Next"
            : "بعدی"
        }
        className={palette.accentFill}
        delay={200}
      >
        <NextIcon
          size={24}
          strokeWidth={2.2}
        />
      </FloatingButton>

      {/* Group Details */}

      <SlidePage
        open={isDetailsOpen}
        from={getSlideSide(language)}
        background={palette.pageHex}
      >
        <NewChannel
          type="group"
          members={selectedContacts}
          language={language}
          theme={theme}
          isDark={isDark}
          onBack={() => setIsDetailsOpen(false)}
          onCreate={onCreateGroup}
        />
      </SlidePage>
    </>
  );
}
