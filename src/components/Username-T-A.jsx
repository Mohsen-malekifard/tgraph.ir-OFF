"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useState, useRef } from "react";
import { useData } from "@/context/DataContext";

export default function Username_T_A({ setActiveB, theme, isDark, language }) {
  const { userName } = useData();

  const [newUserName, setNewUserName] = useState(userName);
  const inputRef = useRef(null);

  const isEnglish = language === "english";
  const isBlueTheme = theme === "blue";

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

  // Panel background
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

  // Main text
  const mainTextClass = isDark
    ? "text-white"
    : "text-[#252525]";

  // Input text and caret
  const inputTextClass = isDark
    ? "text-white caret-white"
    : "text-[#252525] caret-[#252525]";

  // Placeholder
  const placeholderClass = isDark
    ? "placeholder:text-gray-500"
    : "placeholder:text-gray-600";

  // Description text
  const descriptionTextClass = isDark
    ? "text-gray-400/80"
    : "text-gray-700";

  // Handle username changes
  const handleChange = (e) => {
    const newValue = e.target.value;

    if (!newValue.startsWith("@")) return;

    const usernameWithoutAt = newValue.slice(1);

    const allowedChars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";

    const isValid = [...usernameWithoutAt].every((char) =>
      allowedChars.includes(char)
    );

    if (isValid) {
      setNewUserName(newValue);
    }
  };

  // Prevent deleting the @ prefix
  const handleKeyDown = (e) => {
    if (
      e.key === "Backspace" &&
      inputRef.current &&
      inputRef.current.selectionStart <= 1
    ) {
      e.preventDefault();
    }
  };

  const hasChanges = newUserName !== userName;
  const isValidUsername = newUserName.length >= 6;

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
        scrollbar-none
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
          <button
            type="button"
            onClick={() => setActiveB(null)}
            aria-label={isEnglish ? "Close" : "بستن"}
            className="flex items-center justify-center"
          >
            <X size={23} />
          </button>

          <span className="text-[17px] font-semibold">
            {isEnglish ? "Username" : "تغییر نام کاربری"}
          </span>
        </div>

        <span
          aria-label={isEnglish ? "Save changes" : "ذخیره تغییرات"}
          className={`
            flex
            items-center
            justify-center
            text-white
            transition-opacity
            duration-200
            ${
              hasChanges && isValidUsername
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        >
          <Check size={23} />
        </span>
      </div>

      {/* Username Input */}
      <div
        className={`
          relative
          max-w-full
          min-md:h-[12%]
          max-md:h-[14%]
          ${panelBackgroundClass}
          rounded-2xl
          px-[20px]
          pb-[17px]
          pt-[15px]
          flex
          flex-col
          ${isEnglish ? "items-start" : "items-end"}
          mt-[15px]
          mx-[15px]
          transition-colors
          duration-200
        `}
      >
        <span
          className={`
            text-[16px]
            font-semibold
            ${accentTextClass}
            ${isEnglish ? "text-left" : "text-right"}
          `}
        >
          {isEnglish ? "Set username" : "نام کاربری"}
        </span>

        <input
          ref={inputRef}
          required
          minLength={5}
          maxLength={20}
          type="text"
          autoFocus
          autoComplete="off"
          value={newUserName}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          dir="ltr"
          aria-label={isEnglish ? "Username" : "نام کاربری"}
          placeholder="@username"
          className={`
            absolute
            border-0
            bg-transparent
            ${inputTextClass}
            ${placeholderClass}
            font-medium
            inset-x-[17px]
            w-[calc(100%-34px)]
            bottom-[-5px]
            h-[60px]
            appearance-none
            outline-0
            text-left
          `}
        />
      </div>

      {/* Username Information */}
      <div
        className={`
          flex
          flex-col
          gap-[15px]
          text-justify
          pt-[10px]
          px-[20px]
          min-w-full
          h-screen
          ${descriptionTextClass}
          text-[15px]
          tracking-normal
          font-normal
          transition-colors
          duration-200
        `}
      >
        <span>
          {isEnglish
            ? "You can choose a username on Telegraph. If you do, people will be able to find you by this username and contact you without needing your phone number."
            : "شما می‌توانید برای حساب تلگراف خود یک نام کاربری انتخاب کنید. با این کار، دیگران می‌توانند شما را از طریق نام کاربری پیدا کنند و بدون نیاز به شماره تلفن با شما ارتباط برقرار کنند."}
        </span>

        <span className="tracking-normal">
          {isEnglish
            ? "You can use a-z, 0-9 and underscores. Minimum length is 5 characters."
            : "برای نام کاربری می‌توانید از حروف انگلیسی، اعداد و آندرلاین (_) استفاده کنید. نام کاربری باید حداقل ۵ کاراکتر داشته باشد."}
        </span>
      </div>
    </div>
  );
}
