"use client";

import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Smile,
  Globe,
  LockKeyhole,
} from "lucide-react";

import { getPalette } from "@/lib/contacts";

import { SLIDE_ANIMATION_MS } from "@/components/Motion";

function CameraPlusIcon({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="white"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 3.5h5.2l1.3 2.2H18A3 3 0 0 1 21 8.7v4.8h-6.2a1.7 1.7 0 0 0-1.7 1.7V20H6A3 3 0 0 1 3 17V8.7a3 3 0 0 1 3-3h1.7L9 3.5zm-.2 6.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"
      />
      <path
        d="M18 15.6v5.6M15.2 18.4h5.6"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| New Group / New Channel Details
|--------------------------------------------------------------------------
*/

export default function NewChannel({
  type = "channel",
  members = [],
  onBack,
  onCreate,
  language,
  theme,
  isDark,
}) {
  const isChannel = type === "channel";

  const isEnglish = language === "english";

  const palette = getPalette(theme, isDark);

  const rowDir = isEnglish
    ? "flex-row"
    : "flex-row-reverse";

  const nameInputRef = useRef(null);

  const fileInputRef = useRef(null);

  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [photoFile, setPhotoFile] = useState(null);

  const [photoUrl, setPhotoUrl] = useState("");

  const [username, setUsername] = useState("");

  const [isPublic, setIsPublic] = useState(false);

  const [nameFocused, setNameFocused] = useState(true);

  const [descriptionFocused, setDescriptionFocused] = useState(false);

  const [nameError, setNameError] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      nameInputRef.current?.focus({
        preventScroll: true,
      });
    }, SLIDE_ANIMATION_MS + 30);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (photoUrl) {
        URL.revokeObjectURL(photoUrl);
      }
    };
  }, [photoUrl]);

  /*
  |--------------------------------------------------------------------------
  | Photo Preview
  |--------------------------------------------------------------------------
  */

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError(
        isEnglish
          ? "The selected image must be smaller than 5 MB."
          : "حجم تصویر انتخابی باید کمتر از ۵ مگابایت باشد."
      );

      return;
    }

    setSubmitError("");

    setPhotoFile(file);

    setPhotoUrl(URL.createObjectURL(file));
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  async function handleSubmit() {
    if (submitting) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setNameError(true);

      nameInputRef.current?.focus({
        preventScroll: true,
      });

      return;
    }

    const cleanUsername = username
      .trim()
      .toLowerCase()
      .replace(/^@/, "");

    if (
      isChannel &&
      isPublic &&
      !/^[a-z0-9_]{3,32}$/.test(cleanUsername)
    ) {
      setSubmitError(
        isEnglish
          ? "Enter a username with 3 to 32 English letters, numbers or underscores."
          : "نام کاربری باید ۳ تا ۳۲ کاراکتر و شامل حروف انگلیسی، عدد یا زیرخط باشد."
      );

      return;
    }

    if (typeof onCreate !== "function") {
      setSubmitError(
        isEnglish
          ? "The creation handler is not connected."
          : "عملیات ساخت به سرور متصل نیست."
      );

      return;
    }

    setSubmitError("");

    setSubmitting(true);

    try {
      await onCreate({
        type,

        name: trimmedName,

        description: description.trim(),

        photo: photoFile,

        members,

        isPublic: isChannel ? isPublic : false,

        username: isChannel && isPublic
          ? cleanUsername
          : "",
      });
    } catch (error) {
      setSubmitError(
        error?.message ||
          (isEnglish
            ? "Could not create the chat."
            : "ایجاد گفتگو ناموفق بود.")
      );
    } finally {
      setSubmitting(false);
    }
  }

  const BackIcon = isEnglish
    ? ArrowLeft
    : ArrowRight;

  const title = isChannel
    ? isEnglish
      ? "New Channel"
      : "کانال جدید"
    : isEnglish
      ? "New Group"
      : "گروه جدید";

  const namePlaceholder = isChannel
    ? isEnglish
      ? "Channel name"
      : "نام کانال"
    : isEnglish
      ? "Group name"
      : "نام گروه";

  const memberCount = members.length;

  return (
    <div className="scrollbar-none h-full w-full overflow-y-auto">
      {/* Header */}

      <div
        className={`flex h-[48px] w-full items-center justify-between border-b border-white/[0.07] px-4 ${rowDir} ${palette.raised}`}
      >
        <div className={`flex items-center gap-[40px] ${rowDir}`}>
          <button
            type="button"
            onClick={onBack}
            aria-label={
              isEnglish
                ? "Back"
                : "بازگشت"
            }
            className="flex cursor-pointer items-center justify-center text-white"
          >
            <BackIcon size={26} />
          </button>

          <h1 className="text-[20px] font-semibold leading-none tracking-tight text-white">
            {title}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          aria-label={
            isEnglish
              ? "Create"
              : "ایجاد"
          }
          className="flex cursor-pointer items-center justify-center text-white transition-transform duration-150 active:scale-90 disabled:opacity-60"
        >
          {submitting ? (
            <span className="h-[20px] w-[20px] animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Check size={26} />
          )}
        </button>
      </div>

      {/* Photo and Name */}

      <div
        className={`flex items-start gap-[16px] px-[16px] pt-[12px] ${rowDir}`}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label={
            isEnglish
              ? "Choose photo"
              : "انتخاب تصویر"
          }
          className={`relative flex h-[64px] w-[64px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-linear-to-b transition-transform duration-150 active:scale-95 ${palette.accentGradient}`}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <CameraPlusIcon size={30} />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />

        <div className="mt-[8px] min-w-0 flex-1">
          <div
            className={`flex h-[40px] items-center gap-[8px] border-b-2 transition-colors duration-150 ${rowDir} ${
              nameError
                ? "border-red-400"
                : nameFocused
                  ? palette.accentBorder
                  : "border-white/25"
            }`}
          >
            <input
              ref={nameInputRef}
              type="text"
              dir="auto"
              maxLength={128}
              value={name}
              placeholder={namePlaceholder}
              aria-invalid={nameError}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(false);
              }}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              className={`h-full min-w-0 flex-1 bg-transparent text-[18px] text-white outline-none placeholder:text-white/40 ${
                isEnglish
                  ? "text-left"
                  : "text-right"
              }`}
            />

            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() =>
                nameInputRef.current?.focus({
                  preventScroll: true,
                })
              }
              aria-label="Emoji"
              className="flex shrink-0 cursor-pointer items-center justify-center text-white/55"
            >
              <Smile size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* Description or Member Count */}

      {isChannel ? (
        <div className="mx-[24px] mt-[28px]">
          <input
            type="text"
            dir="auto"
            maxLength={500}
            value={description}
            placeholder={
              isEnglish
                ? "Description"
                : "توضیحات"
            }
            onChange={(event) =>
              setDescription(event.target.value)
            }
            onFocus={() => setDescriptionFocused(true)}
            onBlur={() => setDescriptionFocused(false)}
            className={`h-[30px] w-full bg-transparent text-[18px] text-white outline-none transition-colors duration-150 placeholder:text-white/40 ${
              isEnglish
                ? "text-left"
                : "text-right"
            } ${
              descriptionFocused
                ? `border-b-2 ${palette.accentBorder}`
                : "border-b border-white/25"
            }`}
          />

          <p
            className={`mt-[12px] text-[15px] leading-[22px] text-white/45 ${
              isEnglish
                ? "text-left"
                : "text-right"
            }`}
          >
            {isEnglish
              ? "You can provide an optional description for your channel."
              : "می‌توانی یک توضیح اختیاری برای کانالت بنویسی."}
          </p>
        </div>
      ) : (
        <div
          className={`mx-[24px] mt-[28px] text-[14px] font-semibold leading-[22px] ${palette.accentText} ${
            isEnglish
              ? "text-left"
              : "text-right"
          }`}
        >
          {isEnglish
            ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
            : `${memberCount.toLocaleString("fa-IR")} عضو`}
        </div>
      )}

      {/* Channel Privacy */}

      {isChannel && (
        <div className="mx-[24px] mt-[28px]">
          <h2
            className={`mb-[12px] text-[15px] font-semibold text-white ${
              isEnglish
                ? "text-left"
                : "text-right"
            }`}
          >
            {isEnglish
              ? "Channel type"
              : "نوع کانال"}
          </h2>

          <div className="flex flex-col gap-[10px]">
            <button
              type="button"
              onClick={() => {
                setIsPublic(false);
                setSubmitError("");
              }}
              className={`flex items-center gap-[12px] rounded-xl border px-[13px] py-[13px] text-start transition-colors ${
                rowDir
              } ${
                !isPublic
                  ? `${palette.accentBorder} bg-white/[0.06]`
                  : "border-white/10 bg-transparent"
              }`}
            >
              <LockKeyhole
                size={21}
                className={
                  !isPublic
                    ? palette.accentText
                    : "text-white/50"
                }
              />

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[15px] font-medium text-white">
                  {isEnglish
                    ? "Private Channel"
                    : "کانال خصوصی"}
                </span>

                <span className="text-[12px] leading-[18px] text-white/45">
                  {isEnglish
                    ? "Only people with an invite link can join."
                    : "فقط افرادی که لینک دعوت دارند می‌توانند عضو شوند."}
                </span>
              </div>

              <span
                className={`h-[18px] w-[18px] shrink-0 rounded-full border flex items-center justify-center ${
                  !isPublic
                    ? `border-transparent ${palette.accentFill}`
                    : "border-white/35"
                }`}
              >
                {!isPublic && (
                  <Check
                    size={12}
                    className="text-white"
                    strokeWidth={3}
                  />
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPublic(true);
                setSubmitError("");
              }}
              className={`flex items-center gap-[12px] rounded-xl border px-[13px] py-[13px] text-start transition-colors ${
                rowDir
              } ${
                isPublic
                  ? `${palette.accentBorder} bg-white/[0.06]`
                  : "border-white/10 bg-transparent"
              }`}
            >
              <Globe
                size={21}
                className={
                  isPublic
                    ? palette.accentText
                    : "text-white/50"
                }
              />

              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="text-[15px] font-medium text-white">
                  {isEnglish
                    ? "Public Channel"
                    : "کانال عمومی"}
                </span>

                <span className="text-[12px] leading-[18px] text-white/45">
                  {isEnglish
                    ? "Anyone can find this channel by its username."
                    : "همه می‌توانند با نام کاربری، کانال را پیدا کنند."}
                </span>
              </div>

              <span
                className={`h-[18px] w-[18px] shrink-0 rounded-full border flex items-center justify-center ${
                  isPublic
                    ? `border-transparent ${palette.accentFill}`
                    : "border-white/35"
                }`}
              >
                {isPublic && (
                  <Check
                    size={12}
                    className="text-white"
                    strokeWidth={3}
                  />
                )}
              </span>
            </button>
          </div>

          {isPublic && (
            <div className="mt-[18px]">
              <div
                className={`flex h-[43px] items-center gap-[8px] border-b border-white/25 ${
                  rowDir
                }`}
              >
                <span className="text-[16px] text-white/45">
                  t.me/
                </span>

                <input
                  type="text"
                  dir="ltr"
                  maxLength={32}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => {
                    setUsername(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "")
                    );

                    setSubmitError("");
                  }}
                  placeholder="channel_username"
                  className="h-full min-w-0 flex-1 bg-transparent text-left text-[16px] text-white outline-none placeholder:text-white/35"
                />
              </div>

              <p
                className={`mt-[9px] text-[12px] leading-[19px] text-white/45 ${
                  isEnglish
                    ? "text-left"
                    : "text-right"
                }`}
              >
                {isEnglish
                  ? "Use 3–32 English letters, numbers or underscores. The username must be unique."
                  : "از ۳ تا ۳۲ حرف انگلیسی، عدد یا زیرخط استفاده کن. نام کاربری باید منحصربه‌فرد باشد."}
              </p>
            </div>
          )}
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className="mx-[24px] mt-[16px] rounded-xl bg-red-500/10 px-[12px] py-[10px] text-[13px] leading-[21px] text-red-300"
        >
          {submitError}
        </div>
      )}
    </div>
  );
}
