"use client";

import { useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  UserPlus,
  LogOut,
} from "lucide-react";

import { useData } from "@/context/DataContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faPhone,
  faAt,
  faCakeCandles,
} from "@fortawesome/free-solid-svg-icons";

export default function Account_S_A({
  setActiveB,
  language,
  theme,
  isDark,
}) {
  const { name, lastName, bio } = useData();

  const [newName, setNewName] = useState(name);
  const [newLastName, setNewLastName] = useState(lastName);
  const [newBio, setNewBio] = useState(bio);

  const [divide, setDevide] = useState(70 - (bio?.length || 0));

  const isBlueTheme = theme === "blue";
  const isEnglish = language === "english";

  // Accent color
  const accentColor = isBlueTheme
    ? isDark
      ? "#91a8ef"
      : "#1278e6"
    : isDark
      ? "#f08080"
      : "#d93636";

  // Accent text
  const accentTextClass = isBlueTheme
    ? isDark
      ? "text-[#91a8ef]"
      : "text-[#1278e6]"
    : isDark
      ? "text-[#f08080]"
      : "text-[#d93636]";

  // Main panel background
  const panelBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#282C3F]"
      : "bg-[#dceaff]"
    : isDark
      ? "bg-[#252525]"
      : "bg-[#ffe0e0]";

  // Header background
  const headerBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#1d202e]"
      : "bg-[#1278e6]"
    : isDark
      ? "bg-[#181818]"
      : "bg-[#ec5454]";

  // Divider color
  const dividerBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#303346]"
      : "bg-[#b8cfee]"
    : isDark
      ? "bg-[#3a3030]"
      : "bg-[#efbcbc]";

  // Main text color
  const mainTextClass = isDark
    ? "text-white"
    : "text-[#252525]";

  // Input text and cursor colors
  const inputTextClass = isDark
    ? "text-white caret-white"
    : "text-[#252525] caret-[#252525]";

  // Input placeholder colors
  const placeholderClass = isDark
    ? "placeholder:text-gray-500"
    : "placeholder:text-gray-500";

  // Handle profile information changes
  const handleBioChange = (e) => {
    const value = e.target.value;

    setNewBio(value);
    setDevide(70 - value.length);
  };

  // Detect whether profile information has changed
  const hasChanges =
    newName !== name ||
    newLastName !== lastName ||
    newBio !== bio;

  return (
    <div
      className="
        relative
        h-screen
        w-full
        min-w-0
        max-w-full
        overflow-x-hidden
        overflow-y-auto
        overscroll-contain
      "
    >
      {/* Header */}
      <div
        className={`
          sticky
          top-0
          z-[30]
          flex
          ${isEnglish ? "flex-row" : "flex-row-reverse"}
          px-[15px]
          w-full
          h-[54px]
          shrink-0
          items-center
          justify-between
          ${headerBackgroundClass}
          transition-colors
          duration-200
        `}
      >
        <div
          className={`
            flex
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            items-center
            gap-[30px]
            text-white
          `}
        >
          {isEnglish ? (
            <button
              type="button"
              onClick={() => setActiveB("settings")}
              aria-label="Back to settings"
              className="flex items-center justify-center"
            >
              <ArrowLeft size={24} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveB("settings")}
              aria-label="بازگشت به تنظیمات"
              className="flex items-center justify-center"
            >
              <ArrowRight size={24} />
            </button>
          )}

          <span className="text-[17px] font-semibold">
            {isEnglish ? "Account" : "حساب کاربری"}
          </span>
        </div>

        <span
          aria-label={hasChanges ? "Unsaved changes" : "No changes"}
          className={`
            flex
            items-center
            justify-center
            text-white
            transition-opacity
            duration-200
            ${hasChanges ? "opacity-100" : "opacity-0"}
          `}
        >
          <Check size={23} />
        </span>
      </div>

      {/* Name */}
      <div
        className={`
          relative
          mx-[15px]
          mt-[15px]
          flex
          h-[155px]
          max-w-full
          flex-col
          rounded-2xl
          ${panelBackgroundClass}
          py-[15px]
          transition-colors
          duration-200
          ${isEnglish ? "items-start pl-[20px]" : "items-end pr-[20px]"}
        `}
      >
        <span
          className={`
            text-[16px]
            font-semibold
            ${accentTextClass}
          `}
        >
          {isEnglish ? "Your name" : "نام شما"}
        </span>

        <div className="mt-[-10px] flex w-full flex-col">
          <input
            maxLength={35}
            required
            type="text"
            autoComplete="off"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={isEnglish ? "First name" : "نام"}
            aria-label={isEnglish ? "First name" : "نام"}
            className={`
              mt-[10px]
              h-[60px]
              w-full
              appearance-none
              border-0
              bg-transparent
              outline-none
              font-medium
              ${isEnglish ? "text-left" : "text-right"}
              ${inputTextClass}
              ${placeholderClass}
            `}
          />

          <span
            className={`
              h-[1px]
              w-full
              ${dividerBackgroundClass}
            `}
          />

          <input
            required
            maxLength={35}
            type="text"
            autoComplete="off"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
            placeholder={isEnglish ? "Last name" : "نام خانوادگی"}
            aria-label={isEnglish ? "Last name" : "نام خانوادگی"}
            className={`
              mt-[10px]
              h-[60px]
              w-full
              appearance-none
              border-0
              bg-transparent
              outline-none
              font-medium
              ${isEnglish ? "text-left" : "text-right"}
              ${inputTextClass}
              ${placeholderClass}
            `}
          />
        </div>
      </div>

      {/* Bio */}
      <div
        className={`
          relative
          mx-[15px]
          mt-[15px]
          box-border
          flex
          max-w-full
          flex-col
          rounded-2xl
          ${panelBackgroundClass}
          py-[15px]
          transition-colors
          duration-200
          ${isEnglish ? "items-start pl-[20px]" : "items-end pr-[20px]"}
        `}
      >
        <div
          className={`
            flex
            w-full
            items-center
            justify-between
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
          `}
        >
          <textarea
            required
            maxLength={70}
            autoComplete="off"
            dir="auto"
            placeholder={isEnglish ? "Bio" : "معرفی شما"}
            value={newBio}
            onChange={handleBioChange}
            aria-label={isEnglish ? "Biography" : "معرفی شما"}
            className={`
              mt-[5px]
              flex
              basis-8/9
              resize-none
              flex-wrap
              text-wrap
              overflow-hidden
              appearance-none
              border-0
              bg-transparent
              font-medium
              outline-none
              field-sizing-content
              ${inputTextClass}
              ${placeholderClass}
            `}
          />

          <span
            className={`
              flex
              basis-1/9
              items-center
              justify-center
              tabular-nums
              ${
                divide === 0
                  ? "text-red-400"
                  : mainTextClass
              }
            `}
          >
            {divide}
          </span>
        </div>
      </div>

      {/* Bio Description */}
      {isEnglish ? (
        <div className="ml-[20px] mt-[7px] text-[13.7px] font-normal text-gray-500">
          A few words about you.
        </div>
      ) : (
        <div className="mr-[20px] mt-[7px] text-right text-[13.7px] font-normal text-gray-500">
          عبارت یا جمله‌ای برای معرفی شما
        </div>
      )}

      {/* Your Info */}
      <div
        className={`
          mx-[15px]
          mt-[7px]
          box-border
          flex
          h-auto
          max-w-full
          flex-col
          rounded-2xl
          ${panelBackgroundClass}
          py-[7px]
          transition-colors
          duration-200
          ${isEnglish ? "items-start" : "items-end"}
        `}
      >
        <span
          className={`
            mt-[5px]
            text-[15px]
            font-semibold
            ${accentTextClass}
            ${isEnglish ? "ml-[20px]" : "mr-[20px]"}
          `}
        >
          {isEnglish ? "Your Info" : "اطلاعات شما"}
        </span>

        {/* Phone Number */}
        <div
          className={`
            flex
            h-[57px]
            w-full
            items-center
            gap-[17px]
            px-[20px]
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
          `}
        >
          <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-lg bg-green-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
            <FontAwesomeIcon icon={faPhone} />
          </div>

          <div className="flex min-w-0 flex-col leading-[22px]">
            <span
              dir="ltr"
              className={`
                text-[15px]
                font-medium
                ${mainTextClass}
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              +98 994 579 5036
            </span>

            <span
              className={`
                text-[12.5px]
                font-normal
                text-gray-500
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              {isEnglish
                ? "Tap to change phone number"
                : "برای تغییر شماره همراه ضربه بزنید"}
            </span>
          </div>
        </div>

        {/* Username */}
        <button
          type="button"
          onClick={() => setActiveB("username")}
          className={`
            flex
            h-[57px]
            w-full
            items-center
            gap-[17px]
            px-[20px]
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
          `}
        >
          <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-lg bg-yellow-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
            <FontAwesomeIcon icon={faAt} />
          </div>

          <div className="flex min-w-0 flex-col leading-[22px]">
            <span
              dir="ltr"
              className={`
                text-[15px]
                font-medium
                ${mainTextClass}
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              @Jjjscfff
            </span>

            <span
              className={`
                text-[12.5px]
                font-normal
                text-gray-500
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              {isEnglish ? "Username" : "نام کاربری"}
            </span>
          </div>
        </button>

        {/* Birthday */}
        <div
          className={`
            flex
            h-[57px]
            w-full
            items-center
            gap-[17px]
            px-[20px]
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
          `}
        >
          <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-lg bg-blue-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
            <FontAwesomeIcon icon={faCakeCandles} />
          </div>

          <div className="flex min-w-0 flex-col leading-[22px]">
            <span
              dir="ltr"
              className={`
                text-[15px]
                font-medium
                ${mainTextClass}
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              Apr 16, 2010
            </span>

            <span
              className={`
                text-[12.5px]
                font-normal
                text-gray-500
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              {isEnglish ? "Birthday" : "تاریخ تولد"}
            </span>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div
        className={`
          mx-[15px]
          mt-[15px]
          mb-[20px]
          flex
          h-auto
          max-w-full
          flex-col
          rounded-2xl
          ${panelBackgroundClass}
          py-[7px]
          transition-colors
          duration-200
        `}
      >
        {/* Add Account */}
        <button
          type="button"
          className={`
            flex
            h-[57px]
            w-full
            items-center
            gap-[17px]
            px-[20px]
            transition-colors
            duration-200
            hover:opacity-80
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            ${accentTextClass}
          `}
        >
          <UserPlus size={22.5} />

          <span className="text-[15px] font-semibold">
            {isEnglish ? "Add Account" : "افزودن حساب"}
          </span>
        </button>

        {/* Log Out */}
        <button
          type="button"
          className={`
            flex
            h-[57px]
            w-full
            items-center
            gap-[17px]
            px-[20px]
            text-red-500
            transition-colors
            duration-200
            hover:opacity-80
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
          `}
        >
          <LogOut size={22.5} />

          <span className="text-[15px] font-semibold">
            {isEnglish ? "Log Out" : "خروج از حساب"}
          </span>
        </button>
      </div>
    </div>
  );
}
