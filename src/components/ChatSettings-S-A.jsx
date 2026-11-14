"use client";

import { useEffect, useState } from "react";

import {
  ArrowRight,
  ArrowLeft,
  X,
  LogOut,
  EllipsisVertical,
  SunMedium,
  Paintbrush,
} from "lucide-react";
import { useData } from "@/context/DataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage } from "@fortawesome/free-solid-svg-icons";
import Gap from "./Gap";

export default function ChatSettings({
  setActiveB,
  setIsS,
  theme,
  setTheme,
  isDark,
  setIsDark,
  language,
}) {
  const { name } = useData();

  const [divide, setDevide] = useState(16);
  const [divide2, setDevide2] = useState(15);
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(10);
  const [isDayMode, setIsDayMode] = useState(false);

  const MIN_TEXT_SIZE = 12;
  const MAX_TEXT_SIZE = 20;
  const TEXT_SIZE_STORAGE_KEY = "chat_message_text_size";
  const THEME_STORAGE_KEY = "chat_color_theme";
  const DAY_MODE_STORAGE_KEY = "chat_day_mode";

  const MIN_CORNER_SIZE = 10;
  const MAX_CORNER_SIZE = 20;
  const CORNER_SIZE_STORAGE_KEY = "chat_message_corner_size";

  const isBlueTheme = theme === "blue";

  const accentColor = isBlueTheme
    ? isDark
      ? "#91a8ef"
      : "#1278e6"
    : isDark
      ? "#f08080"
      : "#e04444";

  const accentTextClass = isBlueTheme
    ? isDark
      ? "text-[#91a8ef]"
      : "text-[#1278e6]"
    : isDark
      ? "text-[#f08080]"
      : "text-[#d93636]";

  const panelBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#282C3F]"
      : "bg-[#dceaff]"
    : isDark
      ? "bg-[#252525]"
      : "bg-[#ffe0e0]";

  const headerBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#1d202e]"
      : "bg-[#1278e6]"
    : isDark
      ? "bg-[#181818]"
      : "bg-[#ec5454]";

  const menuBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#31374F]"
      : "bg-[#e4eeff]"
    : isDark
      ? "bg-[#302727]"
      : "bg-[#ffe8e8]";

  const dividerBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#303346]"
      : "bg-[#b8cfee]"
    : isDark
      ? "bg-[#3a3030]"
      : "bg-[#efbcbc]";

  const menuTextClass = isDark ? "text-white" : "text-[#252525]";

  const themes = [
    {
      isDark: true,
      id: 1,
      bg: "radial-gradient(circle at 70% 15%, rgba(52,153,255,.2), transparent 100%), #07090d",
      accent: "#2c9cf2",
      second: "#30343b",
      pattern:
        "radial-gradient(circle at 10% 90%, rgba(255,255,255,.08) 1px, transparent 1px)",
    },
    {
      isDark: true,
      id: 2,
      bg: "radial-gradient(circle at 70% 15%, rgba(185, 86, 86, 0.4), transparent 100%), #080b09",
      accent: "#f22c2c",
      second: "#303833",
      pattern:
        "radial-gradient(circle at 10% 90%, rgba(255,255,255,.08) 1px, transparent 1px)",
    },
    {
      isDark: false,
      id: 3,
      bg: "radial-gradient(circle at 60% 20%, rgba(79,186,217,.8), transparent 100%), #ffffff",
      accent: "#50b7d0",
      second: "#343b40",
      pattern:
        "radial-gradient(circle at 10% 90%, rgba(255,255,255,.08) 1px, transparent 1px)",
    },
    {
      isDark: false,
      id: 4,
      bg: "radial-gradient(circle at 60% 20%, rgba(217, 79, 79, 0.8), transparent 100%), #ffffff",
      accent: "#ec5454",
      second: "#30313a",
      pattern:
        "radial-gradient(circle at 10% 90%, rgba(255,255,255,.08) 1px, transparent 1px)",
    },
  ];

  useEffect(() => {
    const savedTextSize = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);

    if (savedTextSize !== null) {
      const parsedTextSize = Number(savedTextSize);

      if (
        Number.isFinite(parsedTextSize) &&
        parsedTextSize >= MIN_TEXT_SIZE &&
        parsedTextSize <= MAX_TEXT_SIZE
      ) {
        setDevide(parsedTextSize);
      }
    }

    const savedCornerSize = localStorage.getItem(CORNER_SIZE_STORAGE_KEY);

    if (savedCornerSize !== null) {
      const parsedCornerSize = Number(savedCornerSize);

      if (
        Number.isFinite(parsedCornerSize) &&
        parsedCornerSize >= MIN_CORNER_SIZE &&
        parsedCornerSize <= MAX_CORNER_SIZE
      ) {
        setDevide2(parsedCornerSize);
      }
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const parsedTheme = Number(savedTheme);

    let nextTheme = theme === "blue" ? "blue" : "red";
    let nextIsDark = isDark;

    let nextThemeId =
      nextTheme === "blue"
        ? nextIsDark
          ? 1
          : 3
        : nextIsDark
          ? 2
          : 4;

    if (
      savedTheme !== null &&
      Number.isInteger(parsedTheme) &&
      parsedTheme >= 1 &&
      parsedTheme <= themes.length
    ) {
      nextThemeId = parsedTheme;

      nextTheme =
        parsedTheme === 1 || parsedTheme === 3 ? "blue" : "red";

      nextIsDark = parsedTheme === 1 || parsedTheme === 2;
    }

    const savedDayMode = localStorage.getItem(DAY_MODE_STORAGE_KEY);

    if (savedDayMode !== null) {
      nextIsDark = savedDayMode !== "true";

      nextThemeId =
        nextTheme === "blue"
          ? nextIsDark
            ? 1
            : 3
          : nextIsDark
            ? 2
            : 4;
    }

    setSelectedTheme(nextThemeId);
    setTheme?.(nextTheme);
    setIsDark?.(nextIsDark);
    setIsDayMode(!nextIsDark);

    localStorage.setItem(THEME_STORAGE_KEY, String(nextThemeId));
    localStorage.setItem(DAY_MODE_STORAGE_KEY, String(!nextIsDark));
  }, []);

  const sliderPercent =
    ((divide - MIN_TEXT_SIZE) / (MAX_TEXT_SIZE - MIN_TEXT_SIZE)) * 100;

  const sliderPercent2 =
    ((divide2 - MIN_CORNER_SIZE) / (MAX_CORNER_SIZE - MIN_CORNER_SIZE)) *
    100;

  const handleTextSizeChange = (e) => {
    const newSize = Number(e.target.value);

    setDevide(newSize);
    localStorage.setItem(TEXT_SIZE_STORAGE_KEY, String(newSize));
  };

  const handleCornerSizeChange = (e) => {
    const newSize = Number(e.target.value);

    setDevide2(newSize);
    localStorage.setItem(CORNER_SIZE_STORAGE_KEY, String(newSize));
  };

  const handleScroll = (e) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  const handleThemeChange = (themeId) => {
    const selectedColor = [1, 3].includes(themeId) ? "blue" : "red";
    const selectedDarkMode = themeId === 1 || themeId === 2;

    setSelectedTheme(themeId);
    setTheme?.(selectedColor);
    setIsDark?.(selectedDarkMode);
    setIsDayMode(!selectedDarkMode);

    localStorage.setItem(THEME_STORAGE_KEY, String(themeId));
    localStorage.setItem(
      DAY_MODE_STORAGE_KEY,
      String(!selectedDarkMode)
    );
  };

  const handleDayMode = () => {
    const nextIsDark = !isDark;

    const nextThemeId =
      theme === "blue"
        ? nextIsDark
          ? 1
          : 3
        : nextIsDark
          ? 2
          : 4;

    setIsDark?.(nextIsDark);
    setIsDayMode(!nextIsDark);
    setSelectedTheme(nextThemeId);

    localStorage.setItem(THEME_STORAGE_KEY, String(nextThemeId));
    localStorage.setItem(
      DAY_MODE_STORAGE_KEY,
      String(!nextIsDark)
    );
  };

  // Close Chat Settings and return to Settings
  const handleBack = () => {
    setIsS?.(false);
    setActiveB?.("settings");
  };

  return (
    <div
      onScroll={handleScroll}
      className="
        relative
        h-screen
        w-full
        min-w-0
        max-w-full
        overflow-x-hidden
        overflow-y-auto
        overscroll-contain
        pb-[200px]
      "
    >
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[40]"
        />
      )}

      {/* Menu */}
      <div
        className={`fixed ${
          language == "english"
            ? "right-[20px] origin-top-right"
            : "left-[20px] origin-top-left"
        } top-[62px] z-[50] flex w-[200px] flex-col gap-[25px] rounded-[5px] ${menuBackgroundClass} px-[12.5px] py-[12.5px] shadow-lg ring-1 ring-black/[0.06] transition-all duration-200 ease-out ${
          isOpen
            ? "pointer-events-auto translate-x-0 translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-x-[-10px] translate-y-[10px] scale-0 opacity-0"
        }`}
      >
        <div
          onClick={() => setIsOpen(false)}
          className={`flex cursor-pointer gap-[10px] ${menuTextClass}`}
        >
          <span className={accentTextClass}>
            <LogOut size={22.5} />
          </span>

          <span>Log Out</span>
        </div>
      </div>

      {/* Header */}
      <div
        className={`sticky top-0 z-[30] flex ${
          language == "english" ? "flex-row" : "flex-row-reverse"
        } px-[15px] w-full h-[54px] items-center justify-between ${headerBackgroundClass} transition-colors duration-200`}
      >
        <div
          className={`flex ${
            language == "english" ? "flex-row" : "flex-row-reverse"
          } items-center gap-[30px] text-white`}
        >
          {language == "english" ? (
            <span onClick={handleBack} className="cursor-pointer">
              <ArrowLeft />
            </span>
          ) : (
            <span onClick={handleBack} className="cursor-pointer">
              <ArrowRight />
            </span>
          )}

          {language == "english" ? (
            <span className="text-center text-[17px] font-semibold tracking-wider">
              Chat Settings
            </span>
          ) : (
            <span className="text-center text-[17px] font-semibold tracking-wider">
              تنظیمات ظاهری
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="More options"
          className="text-white"
        >
          <EllipsisVertical />
        </button>
      </div>

      {/* Settings Content */}
      <div className="relative mt-[6px] w-full px-[15px] pb-[15px]">
        <div className="w-full overflow-hidden rounded-[15px]">
          {/* Message text size */}
          <div
            className={`h-[98px] w-full ${panelBackgroundClass} px-[20px] pt-[15px] transition-colors duration-200`}
          >
            {language == "english" ? (
              <div
                className={`text-[15.5px] font-semibold ${accentTextClass}`}
              >
                Message text size
              </div>
            ) : (
              <div
                className={`text-[15.5px] text-right font-semibold ${accentTextClass}`}
              >
                اندازه متن پیام
              </div>
            )}

            <div className="mt-[22px] flex items-center gap-[14px]">
              <div className="relative h-[18px] min-w-0 flex-1">
                {/* Track */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-0
                    right-0
                    top-1/2
                    h-[3px]
                    -translate-y-1/2
                    rounded-full
                    bg-[#46495a]
                  "
                />

                {/* Active Track */}
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-0
                    top-1/2
                    h-[3px]
                    -translate-y-1/2
                    rounded-full
                  "
                  style={{
                    width: `${sliderPercent}%`,
                    backgroundColor: accentColor,
                  }}
                />

                {/* Range */}
                <input
                  type="range"
                  min={MIN_TEXT_SIZE}
                  max={MAX_TEXT_SIZE}
                  step={1}
                  value={divide}
                  onChange={handleTextSizeChange}
                  aria-label="Message text size"
                  aria-valuemin={MIN_TEXT_SIZE}
                  aria-valuemax={MAX_TEXT_SIZE}
                  aria-valuenow={divide}
                  aria-valuetext={`${divide}px`}
                  style={{
                    "--slider-accent": accentColor,
                  }}
                  className="
                    absolute
                    left-0
                    right-0
                    top-1/2
                    h-[18px]
                    w-full
                    -translate-y-1/2
                    cursor-pointer
                    appearance-none
                    bg-transparent
                    p-0

                    [&::-webkit-slider-runnable-track]:h-[3px]
                    [&::-webkit-slider-runnable-track]:rounded-full
                    [&::-webkit-slider-runnable-track]:bg-transparent

                    [&::-webkit-slider-thumb]:mt-[-4.5px]
                    [&::-webkit-slider-thumb]:h-[12px]
                    [&::-webkit-slider-thumb]:w-[12px]
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:border-0
                    [&::-webkit-slider-thumb]:bg-[var(--slider-accent)]

                    [&::-moz-range-track]:h-[3px]
                    [&::-moz-range-track]:rounded-full
                    [&::-moz-range-track]:bg-transparent

                    [&::-moz-range-thumb]:h-[12px]
                    [&::-moz-range-thumb]:w-[12px]
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:bg-[var(--slider-accent)]
                  "
                />
              </div>

              <span
                className={`w-[22px] select-none text-[15px] tabular-nums ${accentTextClass}`}
              >
                {divide}
              </span>
            </div>
          </div>

          {/* Message Preview */}
          <div className="h-auto w-full overflow-hidden bg-black px-[7px] py-[14px] scrollbar-none">
            {language == "english" ? (
              <div className="flex h-full flex-col gap-[12px]">
                <Gap
                  messageId="chat-settings-preview-1"
                  side="left"
                  time="20:18"
                  selectionMode={true}
                  messageTextSize={divide}
                  messageCornerSize={divide2}
                  bubbleClassName="max-w-[calc(100%_-_18px)]"
                >
                  <div className="text-[#7bd46b]">
                    <span className="font-semibold">Mohsen Dev</span>
                  </div>

                  <div>Good morning!</div>

                  <div>Do you know what time it is?</div>
                </Gap>

                <Gap
                  messageId="chat-settings-preview-2"
                  side="right"
                  time="20:33"
                  status="read"
                  selectionMode={true}
                  messageTextSize={divide}
                  messageCornerSize={divide2}
                  bubbleClassName="max-w-[calc(100%_-_18px)]"
                >
                  It's morning in Tokyo
                </Gap>
              </div>
            ) : (
              <div className="flex h-full flex-col gap-[12px]">
                <Gap
                  messageId="chat-settings-preview-1"
                  side="left"
                  time="20:18"
                  selectionMode={true}
                  messageTextSize={divide}
                  messageCornerSize={divide2}
                  bubbleClassName="max-w-[calc(100%_-_18px)]"
                >
                  <div className="text-[#7bd46b]">
                    <span className="font-semibold">Mohsen Dev</span>
                  </div>

                  <div className="text-right">صبح بخیر!</div>

                  <div className="text-right">میدونی ساعت چنده؟</div>
                </Gap>

                <Gap
                  messageId="chat-settings-preview-2"
                  side="right"
                  time="20:33"
                  status="read"
                  selectionMode={true}
                  messageTextSize={divide}
                  messageCornerSize={divide2}
                  bubbleClassName="max-w-[calc(100%_-_18px)]"
                >
                  تو توکیو شبه!
                </Gap>
              </div>
            )}
          </div>

          {/* Wallpaper / Name color */}
          <div
            className={`h-[52px] w-full ${panelBackgroundClass} px-[20px] transition-colors duration-200`}
          >
            {language == "english" ? (
              <div className="flex h-[52px] items-center">
                <div className="flex w-[43px] justify-start">
                  <FontAwesomeIcon
                    icon={faImage}
                    className={`text-[21px] ${accentTextClass}`}
                  />
                </div>

                <div className="flex-1">
                  <span
                    className={`text-[15.5px] font-medium ${accentTextClass}`}
                  >
                    Change Chat Wallpaper
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-row-reverse h-[52px] items-center">
                <div className="flex flex-row-reverse w-[43px] justify-start">
                  <FontAwesomeIcon
                    icon={faImage}
                    className={`text-[21px] ${accentTextClass}`}
                  />
                </div>

                <div className="flex-1 text-right">
                  <span
                    className={`text-[15.5px] text-right font-medium ${accentTextClass}`}
                  >
                    تغییر پس زمینه مکالمه
                  </span>
                </div>
              </div>
            )}

            {language == "english" ? (
              <div className={`ml-[43px] h-px ${dividerBackgroundClass}`} />
            ) : (
              <div className={`mr-[43px] h-px ${dividerBackgroundClass}`} />
            )}
          </div>
        </div>

        {/* Color Theme */}
        <div
          className={`mt-[14px] w-full overflow-hidden rounded-[15px] ${panelBackgroundClass} transition-colors duration-200`}
        >
          <div className="px-[20px] pt-[17px]">
            {language == "english" ? (
              <div
                className={`text-[15.5px] font-semibold ${accentTextClass}`}
              >
                Color theme
              </div>
            ) : (
              <div
                className={`text-[15.5px] text-right font-semibold ${accentTextClass}`}
              >
                تغییر تم
              </div>
            )}
          </div>

          {/* Theme List */}
          <div className="mt-[23px] w-full overflow-x-auto px-[20px] scrollbar-none">
            <div className="flex min-w-max gap-[11px] pb-[3px]">
              {themes.map((themeOption) => {
                const isSelected = selectedTheme === themeOption.id;

                return (
                  <div key={themeOption.id}>
                    {themeOption.isDark === true && isDark === true ? (
                      <button
                        type="button"
                        onClick={() => handleThemeChange(themeOption.id)}
                        aria-label={`Theme ${themeOption.id}`}
                        style={
                          isSelected
                            ? { borderColor: accentColor }
                            : undefined
                        }
                        className={`group relative h-[126px] w-[88px] shrink-0 overflow-hidden rounded-[12px] bg-[#101218] p-[2px] transition-all duration-200 ${
                          isSelected
                            ? "scale-[1.01] shadow-[0_8px_22px_rgba(0,0,0,.28)] border-2"
                            : "ring-1 ring-white/[0.07] hover:-translate-y-[2px] hover:ring-white/[0.14]"
                        }`}
                      >
                        <div
                          className="relative h-full w-full overflow-hidden rounded-[10px]"
                          style={{
                            background: themeOption.bg,
                          }}
                        >
                          {/* Pattern */}
                          <div
                            className="absolute inset-0 opacity-50"
                            style={{
                              backgroundImage: themeOption.pattern,
                              backgroundSize: "20px 20px",
                            }}
                          />

                          {/* Soft overlay */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.08] via-transparent to-black/20" />

                          {/* Header */}
                          <div className="absolute left-0 right-0 top-0 flex h-[24px] items-center justify-between px-[7px]">
                            <div className="flex items-center gap-[3px]">
                              <span className="h-[3px] w-[3px] rounded-full bg-white/45" />
                              <span className="h-[3px] w-[3px] rounded-full bg-white/30" />
                              <span className="h-[3px] w-[3px] rounded-full bg-white/20" />
                            </div>

                            <div className="h-[4px] w-[20px] rounded-full bg-white/15" />
                          </div>

                          {/* Left message */}
                          <div
                            className="absolute left-[7px] top-[43px] rounded-[7px] rounded-tl-[3px] px-[7px] py-[4px] shadow-[0_3px_8px_rgba(0,0,0,.12)]"
                            style={{
                              backgroundColor: themeOption.second,
                            }}
                          >
                            <div className="h-[3px] w-[26px] rounded-full bg-white/35" />
                            <div className="mt-[3px] h-[3px] w-[18px] rounded-full bg-white/20" />
                          </div>

                          {/* Right message */}
                          <div
                            className="absolute right-[7px] top-[31px] rounded-[7px] rounded-tr-[3px] px-[7px] py-[5px] shadow-[0_3px_8px_rgba(0,0,0,.14)]"
                            style={{
                              backgroundColor: themeOption.accent,
                            }}
                          >
                            <div className="h-[3px] w-[25px] rounded-full bg-white/65" />
                            <div className="mt-[3px] h-[3px] w-[16px] rounded-full bg-white/35" />
                          </div>

                          {/* Small right message */}
                          <div
                            className="absolute right-[8px] top-[62px] rounded-[6px] rounded-tr-[2px] px-[6px] py-[4px]"
                            style={{
                              backgroundColor: themeOption.second,
                            }}
                          >
                            <div className="h-[3px] w-[16px] rounded-full bg-white/20" />
                          </div>

                          {/* Bottom emoji badge */}
                          {themeOption.id === 1 ? (
                            <div className="absolute bottom-[8px] left-1/2 flex h-[31px] w-[31px] -translate-x-1/2 rounded-full bg-radial-[at_50%_75%] rotate-180 from-[#092188]/30 via-[#092188]/80 to-[#092188] to-90%" />
                          ) : (
                            themeOption.id === 2 && (
                              <div className="absolute bottom-[8px] left-1/2 flex h-[31px] w-[31px] -translate-x-1/2 rounded-full bg-radial-[at_50%_75%] from-[#880909]/30 via-[#880909]/80 to-[#880909] rotate-180 to-90%" />
                            )
                          )}

                          {/* Selected */}
                          {isSelected && (
                            <div
                              style={{ backgroundColor: accentColor }}
                              className="absolute right-[6px] top-[6px] flex h-[19px] w-[19px] items-center justify-center rounded-full border border-white/30 text-[11px] font-bold text-[#151824] shadow-[0_3px_10px_rgba(0,0,0,.3)]"
                            >
                              ✓
                            </div>
                          )}

                          {/* Hover highlight */}
                          <div className="pointer-events-none absolute inset-0 rounded-[10px] bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-[0.045]" />
                        </div>
                      </button>
                    ) : themeOption.isDark === false && isDark === false ? (
                      <button
                        type="button"
                        onClick={() => handleThemeChange(themeOption.id)}
                        aria-label={`Theme ${themeOption.id}`}
                        style={
                          isSelected
                            ? { borderColor: accentColor }
                            : undefined
                        }
                        className={`group relative h-[126px] w-[88px] shrink-0 overflow-hidden rounded-[12px] bg-[#101218] p-[2px] transition-all duration-200 ${
                          isSelected
                            ? "scale-[1.01] shadow-[0_8px_22px_rgba(0,0,0,.28)] border-2"
                            : "ring-1 ring-white/[0.07] hover:-translate-y-[2px] hover:ring-white/[0.14]"
                        }`}
                      >
                        <div
                          className="relative h-full w-full overflow-hidden rounded-[10px]"
                          style={{
                            background: themeOption.bg,
                          }}
                        >
                          {/* Pattern */}
                          <div
                            className="absolute inset-0 opacity-50"
                            style={{
                              backgroundImage: themeOption.pattern,
                              backgroundSize: "20px 20px",
                            }}
                          />

                          {/* Soft overlay */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/[0.08] via-transparent to-black/20" />

                          {/* Header */}
                          <div className="absolute left-0 right-0 top-0 flex h-[24px] items-center justify-between px-[7px]">
                            <div className="flex items-center gap-[3px]">
                              <span className="h-[3px] w-[3px] rounded-full bg-black/45" />
                              <span className="h-[3px] w-[3px] rounded-full bg-black/30" />
                              <span className="h-[3px] w-[3px] rounded-full bg-black/20" />
                            </div>

                            <div className="h-[4px] w-[20px] rounded-full bg-black/15" />
                          </div>

                          {/* Left message */}
                          <div
                            className="absolute left-[7px] top-[43px] rounded-[7px] rounded-tl-[3px] px-[7px] py-[4px] shadow-[0_3px_8px_rgba(0,0,0,.12)]"
                            style={{
                              backgroundColor: themeOption.second,
                            }}
                          >
                            <div className="h-[3px] w-[26px] rounded-full bg-white/35" />
                            <div className="mt-[3px] h-[3px] w-[18px] rounded-full bg-white/20" />
                          </div>

                          {/* Right message */}
                          <div
                            className="absolute right-[7px] top-[31px] rounded-[7px] rounded-tr-[3px] px-[7px] py-[5px] shadow-[0_3px_8px_rgba(0,0,0,.14)]"
                            style={{
                              backgroundColor: themeOption.accent,
                            }}
                          >
                            <div className="h-[3px] w-[25px] rounded-full bg-white/65" />
                            <div className="mt-[3px] h-[3px] w-[16px] rounded-full bg-white/35" />
                          </div>

                          {/* Small right message */}
                          <div
                            className="absolute right-[8px] top-[62px] rounded-[6px] rounded-tr-[2px] px-[6px] py-[4px]"
                            style={{
                              backgroundColor: themeOption.second,
                            }}
                          >
                            <div className="h-[3px] w-[16px] rounded-full bg-white/20" />
                          </div>

                          {/* Bottom emoji badge */}
                          {themeOption.id === 3 ? (
                            <div className="absolute bottom-[8px] left-1/2 flex h-[31px] w-[31px] -translate-x-1/2 rounded-full bg-radial-[at_50%_75%] from-cyan-50 via-cyan-300 to-cyan-500 rotate-180 to-90%" />
                          ) : (
                            themeOption.id === 4 && (
                              <div className="absolute bottom-[8px] left-1/2 flex h-[31px] w-[31px] -translate-x-1/2 rounded-full bg-radial-[at_50%_75%] from-red-50 via-red-300 to-red-500 rotate-180 to-90%" />
                            )
                          )}

                          {/* Selected */}
                          {isSelected && (
                            <div
                              style={{ backgroundColor: accentColor }}
                              className="absolute right-[6px] top-[6px] flex h-[19px] w-[19px] items-center justify-center rounded-full border border-white/30 text-[11px] font-bold text-[#151824] shadow-[0_3px_10px_rgba(0,0,0,.3)]"
                            >
                              ✓
                            </div>
                          )}

                          {/* Hover highlight */}
                          <div className="pointer-events-none absolute inset-0 rounded-[10px] bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-[0.045]" />
                        </div>
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Switch to Day Mode */}
          {language == "english" ? (
            <button
              type="button"
              onClick={handleDayMode}
              className="flex h-[59px] w-full items-center px-[20px] transition-colors duration-200"
            >
              <div className="flex w-[43px] shrink-0 justify-start">
                <SunMedium
                  size={27}
                  strokeWidth={1.8}
                  className={accentTextClass}
                />
              </div>

              <span
                className={`text-[15.5px] font-medium ${accentTextClass}`}
              >
                {isDayMode ? "Switch to Night Mode" : "Switch to Day Mode"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDayMode}
              className="flex flex-row-reverse h-[59px] w-full items-center px-[20px] transition-colors duration-200"
            >
              <div className="flex flex-row-reverse w-[43px] shrink-0">
                <SunMedium
                  size={27}
                  strokeWidth={1.8}
                  className={accentTextClass}
                />
              </div>

              <span
                className={`text-[15.5px] text-right font-medium ${accentTextClass}`}
              >
                {isDayMode ? "تغییر به حالت شب" : "تغییر به حالت روز"}
              </span>
            </button>
          )}

          {language == "english" ? (
            <div className={`ml-[43px] h-px ${dividerBackgroundClass}`} />
          ) : (
            <div className={`mr-[55px] h-px ${dividerBackgroundClass}`} />
          )}

          {/* Browse Themes */}
          {language == "english" ? (
            <button
              type="button"
              className="flex h-[59px] w-full items-center px-[20px] transition-colors duration-200"
            >
              <div className="flex w-[43px] shrink-0 justify-start">
                <Paintbrush
                  size={27}
                  strokeWidth={1.8}
                  className={accentTextClass}
                />
              </div>

              <span
                className={`text-[15.5px] font-medium ${accentTextClass}`}
              >
                Browse Themes
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="flex flex-row-reverse h-[59px] w-full items-center px-[20px] transition-colors duration-200"
            >
              <div className="flex flex-row-reverse w-[43px] shrink-0 justify-start">
                <Paintbrush
                  size={27}
                  strokeWidth={1.8}
                  className={accentTextClass}
                />
              </div>

              <span
                className={`text-[15.5px] text-right font-medium ${accentTextClass}`}
              >
                مشاهده تم ها
              </span>
            </button>
          )}
        </div>

        {/* Message Corners */}
        <div
          className={`mt-[14px] h-[98px] w-full rounded-[15px] ${panelBackgroundClass} px-[20px] pt-[15px] transition-colors duration-200`}
        >
          {language == "english" ? (
            <div
              className={`text-[15.5px] font-semibold ${accentTextClass}`}
            >
              Message corners
            </div>
          ) : (
            <div
              className={`text-[15.5px] text-right font-semibold ${accentTextClass}`}
            >
              میزان گرد بودن گوشه های پیام
            </div>
          )}

          <div className="mt-[22px] flex items-center gap-[14px]">
            <div className="relative h-[18px] min-w-0 flex-1">
              {/* Track */}
              <div
                className="
                  pointer-events-none
                  absolute
                  left-0
                  right-0
                  top-1/2
                  h-[3px]
                  -translate-y-1/2
                  rounded-full
                  bg-[#46495a]
                "
              />

              {/* Active Track */}
              <div
                className="
                  pointer-events-none
                  absolute
                  left-0
                  top-1/2
                  h-[3px]
                  -translate-y-1/2
                  rounded-full
                "
                style={{
                  width: `${sliderPercent2}%`,
                  backgroundColor: accentColor,
                }}
              />

              {/* Range */}
              <input
                type="range"
                min={MIN_CORNER_SIZE}
                max={MAX_CORNER_SIZE}
                step={1}
                value={divide2}
                onChange={handleCornerSizeChange}
                aria-label="Message corners size"
                aria-valuemin={MIN_CORNER_SIZE}
                aria-valuemax={MAX_CORNER_SIZE}
                aria-valuenow={divide2}
                aria-valuetext={`${divide2}px`}
                style={{
                  "--slider-accent": accentColor,
                }}
                className="
                  absolute
                  left-0
                  right-0
                  top-1/2
                  h-[18px]
                  w-full
                  -translate-y-1/2
                  cursor-pointer
                  appearance-none
                  bg-transparent
                  p-0

                  [&::-webkit-slider-runnable-track]:h-[3px]
                  [&::-webkit-slider-runnable-track]:rounded-full
                  [&::-webkit-slider-runnable-track]:bg-transparent

                  [&::-webkit-slider-thumb]:mt-[-4.5px]
                  [&::-webkit-slider-thumb]:h-[12px]
                  [&::-webkit-slider-thumb]:w-[12px]
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:border-0
                  [&::-webkit-slider-thumb]:bg-[var(--slider-accent)]

                  [&::-moz-range-track]:h-[3px]
                  [&::-moz-range-track]:rounded-full
                  [&::-moz-range-track]:bg-transparent

                  [&::-moz-range-thumb]:h-[12px]
                  [&::-moz-range-thumb]:w-[12px]
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:bg-[var(--slider-accent)]
                "
              />
            </div>

            <span
              className={`w-[22px] select-none text-[15px] tabular-nums ${accentTextClass}`}
            >
              {divide2}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}