"use client";

import { X, Check, UserPlus, LogOut } from "lucide-react";
import { useState } from "react";
import { useData } from "@/context/DataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faAt,
  faCakeCandles,
} from "@fortawesome/free-solid-svg-icons";

export default function Account({ setActiveB, language, theme, isDark }) {
  const { name, lastName, bio } = useData();

  const [newName, setNewName] = useState(name);
  const [newLastName, setNewLastName] = useState(lastName);
  const [newBio, setNewBio] = useState(bio);
  const [divide, setDevide] = useState(70);
  const [isScrolled, setIsScrolled] = useState(false);

  const isEnglish = language === "english";
  const isBlueTheme = theme === "blue";

  // Accent colors
  const accentTextClass = isBlueTheme
    ? isDark
      ? "text-[#91a8ef]"
      : "text-[#1278e6]"
    : isDark
      ? "text-[#f08080]"
      : "text-[#d93636]";

  // Main text colors
  const mainTextClass = isDark ? "text-white" : "text-[#252525]";

  // Input text and cursor colors
  const inputTextClass = isDark
    ? "text-white caret-white"
    : "text-[#252525] caret-[#252525]";

  // Gray text: stronger contrast in light themes
  const grayTextClass = isDark ? "text-gray-500" : "text-gray-700";

  // Placeholder colors
  const placeholderClass = isDark
    ? "placeholder:text-gray-500"
    : "placeholder:text-gray-600";

  // Panel background
  const panelBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#282C3F]"
      : "bg-[#dceaff]"
    : isDark
      ? "bg-[#252525]"
      : "bg-[#ffe0e0]";

  // Header background when scrolling
  const headerBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#1d202e]"
      : "bg-[#1278e6]"
    : isDark
      ? "bg-[#181818]"
      : "bg-[#ec5454]";

  // Divider colors
  const dividerBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#303346]"
      : "bg-[#b8cfee]"
    : isDark
      ? "bg-[#3a3030]"
      : "bg-[#efbcbc]";

  return (
    <div
      onScroll={(e) => {
        setIsScrolled(e.currentTarget.scrollTop > 10);
      }}
      className="h-screen w-full overflow-y-scroll overflow-x-hidden"
    >
      {/* Header */}
      <div
        className={`
          flex
          ${isEnglish ? "flex-row" : "flex-row-reverse"}
          px-[15px]
          w-full
          h-[54px]
          items-center
          justify-between
          ${isScrolled ? headerBackgroundClass : "bg-transparent"}
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
            ${mainTextClass}
          `}
        >
          <button
            type="button"
            onClick={() => setActiveB(null)}
            aria-label={isEnglish ? "Close account" : "بستن حساب کاربری"}
            className="flex items-center justify-center"
          >
            <X size={23} />
          </button>

          <span className="text-[17px] font-semibold">
            {isEnglish ? "Account" : "حساب کاربری"}
          </span>
        </div>

        <span
          className={`
            ${mainTextClass}
            transition-opacity
            duration-200
            ${
              newName !== name ||
              newLastName !== lastName ||
              newBio !== bio
                ? "opacity-100"
                : "opacity-0"
            }
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
          max-w-full
          rounded-2xl
          h-[155px]
          ${panelBackgroundClass}
          py-[15px]
          flex
          flex-col
          transition-colors
          duration-200
          ${isEnglish ? "items-start pl-[20px]" : "items-end pr-[20px]"}
        `}
      >
        <span
          className={`font-semibold text-[16px] ${accentTextClass}`}
        >
          {isEnglish ? "Your name" : "نام شما"}
        </span>

        <div className="w-full flex flex-col -space-y-[10px] -mt-[10px]">
          <input
            maxLength={35}
            required
            type="text"
            autoFocus
            autoComplete="off"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="First name"
            className={`
              ${isEnglish ? "text-left" : "text-right"}
              border-0
              bg-transparent
              ${inputTextClass}
              ${placeholderClass}
              font-medium
              w-full
              mt-[10px]
              h-[60px]
              appearance-none
              outline-0
            `}
          />

          <span className={`w-full h-[1px] ${dividerBackgroundClass}`} />

          <input
            required
            maxLength={35}
            type="text"
            autoComplete="off"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
            placeholder="Last name"
            className={`
              ${isEnglish ? "text-left" : "text-right"}
              border-0
              bg-transparent
              ${inputTextClass}
              ${placeholderClass}
              font-medium
              w-full
              mt-[10px]
              h-[60px]
              appearance-none
              outline-0
            `}
          />
        </div>
      </div>

      {/* Bio */}
      <div
        className={`
          relative
          max-w-full
          mx-[15px]
          rounded-2xl
          ${panelBackgroundClass}
          mt-[15px]
          ${isEnglish ? "pl-[20px] items-start" : "pr-[20px] items-end"}
          py-[15px]
          box-border
          flex
          flex-col
          transition-colors
          duration-200
        `}
      >
        <div
          className={`
            w-full
            flex
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            items-center
            justify-between
          `}
        >
          <textarea
            required
            dir="auto"
            maxLength={70}
            autoComplete="off"
            placeholder="bio"
            value={newBio}
            onChange={(e) => {
              setNewBio(e.target.value);
              setDevide(70 - e.target.value.length);
            }}
            className={`
              text-start
              field-sizing-content
              ${placeholderClass}
              basis-8/9
              flex
              text-wrap
              border-0
              bg-transparent
              ${inputTextClass}
              font-medium
              w-full
              mt-[5px]
              flex-wrap
              overflow-hidden
              appearance-none
              outline-0
              resize-none
            `}
          />

          <span
            className={`
              ${
                divide === 0
                  ? "text-red-500"
                  : mainTextClass
              }
              basis-1/9
              flex
              items-center
              justify-center
            `}
          >
            {divide}
          </span>
        </div>
      </div>

      {/* Bio Description */}
      {isEnglish ? (
        <div
          className={`
            ml-[20px]
            mt-[7px]
            text-[13.7px]
            font-normal
            ${grayTextClass}
          `}
        >
          A few words about you.
        </div>
      ) : (
        <div
          className={`
            mr-[20px]
            text-right
            mt-[7px]
            text-[13.7px]
            font-normal
            ${grayTextClass}
          `}
        >
          عبارت یا جمله ای برای معرفی شما
        </div>
      )}

      {/* Your Info */}
      <div
        className={`
          ${panelBackgroundClass}
          max-w-full
          rounded-2xl
          h-auto
          py-[7px]
          flex
          flex-col
          ${isEnglish ? "items-start" : "items-end"}
          mt-[7px]
          mx-[15px]
          box-border
          transition-colors
          duration-200
        `}
      >
        <span
          className={`
            font-semibold
            text-[15px]
            mt-[5px]
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
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            gap-[17px]
            items-center
            h-[57px]
            w-full
            px-[20px]
          `}
        >
          <div className="w-[27px] h-[27px] shrink-0 rounded-lg bg-green-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faPhone} />
          </div>

          <div className="flex min-w-0 flex-col leading-[22px]">
            <span
              dir="ltr"
              className={`
                ${mainTextClass}
                font-medium
                text-[15px]
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              +98 994 579 5036
            </span>

            <span
              className={`
                ${grayTextClass}
                font-normal
                text-[12.5px]
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              {isEnglish
                ? "Tap to change phone number"
                : "ضربه برای تغییر شماره همراه"}
            </span>
          </div>
        </div>

        {/* Username */}
        <button
          type="button"
          onClick={() => setActiveB("username")}
          className={`
            flex
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            gap-[17px]
            items-center
            h-[57px]
            w-full
            px-[20px]
            text-left
          `}
        >
          <div className="w-[27px] h-[27px] shrink-0 rounded-lg bg-yellow-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faAt} />
          </div>

          <div className="flex min-w-0 flex-col leading-[22px]">
            <span
              dir="ltr"
              className={`
                ${mainTextClass}
                font-medium
                text-[15px]
              `}
            >
              @Jjjscfff
            </span>

            <span
              className={`
                ${grayTextClass}
                font-normal
                text-[12.5px]
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
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            gap-[17px]
            items-center
            h-[57px]
            w-full
            px-[20px]
          `}
        >
          <div className="w-[27px] h-[27px] shrink-0 rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
            <FontAwesomeIcon icon={faCakeCandles} />
          </div>

          <div className="flex min-w-0 flex-col leading-[22px]">
            <span
              dir="ltr"
              className={`
                ${mainTextClass}
                font-medium
                text-[15px]
                ${isEnglish ? "text-left" : "text-right"}
              `}
            >
              Apr 16, 2010
            </span>

            <span
              className={`
                ${grayTextClass}
                font-normal
                text-[12.5px]
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
          ${panelBackgroundClass}
          max-w-full
          rounded-2xl
          h-auto
          py-[7px]
          flex
          flex-col
          mt-[15px]
          mx-[15px]
          mb-[20px]
          box-border
          transition-colors
          duration-200
        `}
      >
        {/* Add Account */}
        <button
          type="button"
          className={`
            flex
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            gap-[17px]
            items-center
            h-[57px]
            w-full
            px-[20px]
            ${accentTextClass}
          `}
        >
          <UserPlus size={22.5} />

          <span className="font-semibold text-[15px]">
            {isEnglish ? "Add Account" : "افزودن حساب"}
          </span>
        </button>

        {/* Log Out */}
        <button
          type="button"
          className={`
            flex
            ${isEnglish ? "flex-row" : "flex-row-reverse"}
            gap-[17px]
            items-center
            h-[57px]
            w-full
            px-[20px]
            text-red-500
          `}
        >
          <LogOut size={22.5} />

          <span className="font-semibold text-[15px]">
            {isEnglish ? "Log Out" : "خروج از حساب"}
          </span>
        </button>
      </div>
    </div>
  );
}
