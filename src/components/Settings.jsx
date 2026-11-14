
"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
} from "@fortawesome/free-solid-svg-icons";
import {
  EllipsisVertical,
  MessageCircleMore,
  LogOut,
  Search,
  X,
} from "lucide-react";
import ChatSettings from "./ChatSettings-S-A";

export default function Settings({
  setActiveB,
  theme,
  setTheme,
  isDark,
  setIsDark,
  language,
  isS,
  setIsS,
  activeB,
}) {
  const [isScrolled3, setIsScrolled3] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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

  const menuBackgroundClass = isBlueTheme
    ? isDark
      ? "bg-[#282C3F]"
      : "bg-[#e4eeff]"
    : isDark
      ? "bg-[#252525]"
      : "bg-[#ffe8e8]";

  const headerScrolledClass = isBlueTheme
    ? isDark
      ? "bg-[#31364d]"
      : "bg-[#dceaff]"
    : isDark
      ? "bg-[#302727]"
      : "bg-[#ffe0e0]";

  const headerInitialClass = "bg-transparent";

  const headerIconClass = isDark ? "text-white/80" : accentTextClass;

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

  return (
    <>
      {/* Chat Settings - Sliding Panel */}
      {/* Chat Settings - Right to Left Sliding Panel */}
<div
  className={`
    fixed
    inset-0
    z-[70]
    h-screen
    w-full
    overflow-hidden
    transform-gpu
    will-change-transform
    transition-[transform,opacity]
    duration-300
    ease-[cubic-bezier(0.22,1,0.36,1)]
    ${
      isS
        ? "opacity-100 pointer-events-auto"
        : "opacity-0 pointer-events-none"
    }
  `}
  style={{
    transform: isS
      ? "translateX(0)"
      : "translateX(100%)",
  }}
>
  <ChatSettings
    setActiveB={setActiveB}
    setIsS={setIsS}
    theme={theme}
    setTheme={setTheme}
    isDark={isDark}
    setIsDark={setIsDark}
    language={language}
  />
</div>

      <div
        onScroll={(e) => {
          setIsScrolled3(e.currentTarget.scrollTop > 10);
        }}
        className="overflow-y-scroll scrollbar-none pb-[90px] z-50"
      >
        {/* Header2 */}
        <div
          className="
            relative
            z-30
            h-[58px]
            w-full
            overflow-hidden
            transition-[height]
            duration-300
            ease-out
          "
        >
          {/* Header Top */}
          {language == "english" ? (
            <div
              className={`fixed z-[60] flex w-full items-center justify-between px-4 py-3 transition-colors duration-200 ${
                isScrolled3 ? headerScrolledClass : headerInitialClass
              }`}
            >
              <h1
                onClick={() => setActiveB(null)}
                className={`cursor-pointer text-[19px] font-semibold tracking-tight ${
                  isDark ? "text-white" : accentTextClass
                }`}
              >
                <X />
              </h1>

              <span
                className={`flex flex-row-reverse items-center gap-[25px] p-1 ${headerIconClass}`}
              >
                <span
                  onClick={() => setIsOpen(true)}
                  className="cursor-pointer"
                >
                  <EllipsisVertical size={20} />
                </span>

                <span className="mb-[2.5px] cursor-pointer">
                  <Search size={20} />
                </span>
              </span>
            </div>
          ) : (
            <div
              className={`fixed z-[60] flex w-full flex-row-reverse items-center justify-between px-4 py-3 transition-colors duration-200 ${
                isScrolled3 ? headerScrolledClass : headerInitialClass
              }`}
            >
              <h1
                onClick={() => setActiveB(null)}
                className={`cursor-pointer text-[19px] font-semibold tracking-tight ${
                  isDark ? "text-white" : accentTextClass
                }`}
              >
                <X />
              </h1>

              <span
                className={`flex items-center gap-[25px] p-1 ${headerIconClass}`}
              >
                <span
                  onClick={() => setIsOpen(true)}
                  className="cursor-pointer"
                >
                  <EllipsisVertical size={20} />
                </span>

                <span className="mb-[2.5px] cursor-pointer">
                  <Search size={20} />
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="relative">
          {isOpen && (
            <div
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[40]"
            />
          )}

          {/* Menu */}
          <div
            className={`absolute -top-[30px] z-50 flex h-auto w-[200px] flex-col gap-[25px] rounded-[5px] ${menuBackgroundClass} px-[12.5px] py-[12.5px] shadow-lg ring-1 ring-black/[0.06] transition-all duration-200 ease-out ${
              language == "english"
                ? "right-[30px] origin-top-right"
                : "left-[30px] origin-top-left"
            } ${
              isOpen
                ? "pointer-events-auto translate-x-0 translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-x-[-10px] translate-y-[10px] scale-0 opacity-0"
            }`}
          >
            {language == "english" ? (
              <div
                onClick={() => setIsOpen(false)}
                className={`flex cursor-pointer gap-[10px] ${textPrimaryClass}`}
              >
                <span className={accentTextClass}>
                  <LogOut size={22.5} />
                </span>

                <span>Log Out</span>
              </div>
            ) : (
              <div
                onClick={() => setIsOpen(false)}
                className={`flex cursor-pointer flex-row-reverse gap-[10px] ${textPrimaryClass}`}
              >
                <span className={accentTextClass}>
                  <LogOut size={22.5} />
                </span>

                <span>خروج از حساب</span>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="mt-[10px] flex w-full flex-col items-center justify-center">
            <div className="relative h-[110px] w-[110px] rounded-full bg-[url(/icon.png)] bg-cover bg-center">
              <div
                className={`absolute -bottom-[3px] -right-[3px] box-content flex h-[30px] w-[30px] items-center justify-center rounded-full border-[2.5px] text-white ${
                  isDark
                    ? "border-black"
                    : isBlueTheme
                      ? "border-[#dceaff]"
                      : "border-[#ffe0e0]"
                }`}
                style={{ backgroundColor: accentColor }}
              >
                <FontAwesomeIcon icon={faCamera} />
              </div>
            </div>

            <div className="mt-[20px] flex flex-col items-center leading-[25px]">
              <span className={`text-[20px] font-semibold ${textPrimaryClass}`}>
                Mohsen Dev
              </span>

              <div
                className={`flex items-center gap-[10px] text-[13.5px] font-normal ${textSecondaryClass}`}
              >
                <span>+98 994 579 5036</span>
                <span className="h-[5px] w-[5px] rounded-full bg-gray-500"></span>
                <span>@Jjdjakdl</span>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div
            className={`mx-[15px] mt-[15px] box-border flex h-auto max-w-full flex-col items-start rounded-2xl ${panelBackgroundClass} py-[7px] transition-colors duration-200`}
          >
            <div
              onClick={() => setActiveB("account-s-a")}
              className={`flex h-[57px] w-full cursor-pointer items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-blue-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faCircleUser} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Account
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    Number, Username, Bio
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    حساب کاربری
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    شماره همراه, نام کاربری, بیو
                  </span>
                </div>
              )}
            </div>

            <div
              onClick={() => setIsS(true)}
              className={`flex h-[57px] w-full cursor-pointer items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-yellow-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <MessageCircleMore size={18} className="fill-current" />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Chat Settings
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    Wallpaper, Night Mode, Animations
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    تنظیمات ظاهری
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    پس زمینه, تم, حالت شب
                  </span>
                </div>
              )}
            </div>

            <div
              className={`flex h-[57px] w-full items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-green-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faKey} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Privacy & Security
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    Last Seen, Devices, Passkeys
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    امنیت
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    آخرین بازدید, دستگاه ها
                  </span>
                </div>
              )}
            </div>

            <div
              className={`flex h-[57px] w-full items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-red-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faVolumeHigh} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Notifications
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    Sounds, Calls, Badges
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    اعلان ها
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    صدا
                  </span>
                </div>
              )}
            </div>

            {/* Data and Storage */}

            <div
              className={`flex h-[57px] w-full items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-blue-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faFolder} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Chat Folders
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    Sort chats into folders
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    دسته بندی مکالمه ها
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    مرتب سازی چت ها با فولدر ها
                  </span>
                </div>
              )}
            </div>

            <div
              className={`flex h-[57px] w-full items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-blue-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faLaptop} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Devices
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    Manage connected devices
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    دستگاه ها
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    مدیریت دستگاه های متصل
                  </span>
                </div>
              )}
            </div>

            {/* Power Saving */}

            <div
              className={`flex h-[57px] w-full items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-purple-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faGlobe} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Language
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    English
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    زبان
                  </span>
                  <span className={`text-[12.5px] font-normal ${textSecondaryClass}`}>
                    انگلیسی, فارسی
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Help */}
          <div
            className={`mx-[15px] mt-[15px] flex h-auto max-w-full flex-col rounded-2xl ${panelBackgroundClass} py-[7px] transition-colors duration-200 ${
              language == "english" ? "items-start" : "items-end"
            }`}
          >
            {language == "english" ? (
              <span
                className={`ml-[20px] mt-[5px] text-left text-[15px] font-semibold ${accentTextClass}`}
              >
                Help
              </span>
            ) : (
              <span
                className={`mr-[20px] mt-[5px] text-right text-[15px] font-semibold ${accentTextClass}`}
              >
                کمک
              </span>
            )}

            <div
              className={`flex h-[57px] w-full items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-blue-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faCircleQuestion} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Telegraph FAQ
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    سوالات متداول تلگراف
                  </span>
                </div>
              )}
            </div>

            <div
              className={`flex h-[57px] w-full items-center gap-[17px] px-[20px] ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              }`}
            >
              <div className="flex h-[27px] w-[27px] items-center justify-center rounded-lg bg-green-400 text-white outline-[0.5px] -outline-offset-1 outline-white/60">
                <FontAwesomeIcon icon={faShield} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    Privacy Policy
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right leading-[22.5px]">
                  <span className={`text-[15px] font-medium ${textPrimaryClass}`}>
                    گزارش امنیتی
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
