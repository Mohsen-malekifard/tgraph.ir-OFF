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
  SearchIcon,
  X,
} from "lucide-react";
import ChatSettings from "./ChatSettings";
import Account from "./Account";
import { useTheme } from "@/context/ThemeContext";
import { useData } from "@/context/DataContext";

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
  des,
  setDes
}) {
  const [isScrolled3, setIsScrolled3] = useState(false);
  const { back } = useTheme();

  const {
    name,
    lastName,
    userName,
    mobile,
    bio
  } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  const isB = false;

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

  const headerIconClass = isDark
    ? "text-white/80"
    : accentTextClass;

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

  const dangerTextClass = isDark
    ? "text-red-400"
    : "text-red-600";

  async function handleLogout() {
    // Sign-in and sign-out are disabled in the temporary offline demo.
    setIsOpen2(false);
  }

  const displayName = [
    name,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const handleScroll = (e) => {
    setIsScrolled3(e.currentTarget.scrollTop > 10);
  };

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
            des
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }
        `}
        style={{
          transform: des
            ? "translateX(0)"
            : "translateX(100%)",
        }}
      >
        {des == "chat-settings" && (
          <ChatSettings
            theme={theme}
            setDes={setDes}
            setTheme={setTheme}
            isDark={isDark}
            setIsDark={setIsDark}
            language={language}
            setActiveB={setActiveB}
          />
        )}

        {des == "account" && (
          <Account
            setDes={setDes}
            theme={theme}
            setIsOpen2={setIsOpen2}
            setTheme={setTheme}
            isDark={isDark}
            setIsDark={setIsDark}
            language={language}
            setActiveB={setActiveB}
          />
        )}
      </div>

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

        {/* Header */}

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
              ${isScrolled3 ? "opacity-100" : "opacity-0"}
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
              ${isScrolled3 ? "opacity-100" : "opacity-0"}
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
              ${isScrolled3 ? "opacity-100" : "opacity-0"}
            `}
          />

          {/* Back Button */}

          <div
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
              ${isScrolled3 ? "opacity-100" : "opacity-0"}
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

        {/* Settings Content */}

        <div className="relative pb-10">

          {/* Logout Menu */}

          {isOpen2 && (
            <div
              onClick={() => setIsOpen2(false)}
              className="fixed inset-0 z-[40]"
            />
          )}

          <div
            className={`
              fixed
              z-[50]
              px-[12.5px]
              py-[12.5px]
              w-[200px]
              rounded-[5px]
              top-[25px]
              right-[20px]
              flex
              flex-col
              gap-[25px]
              origin-top-right
              transition-all
              duration-200
              ease-out
              ${menuBackgroundClass}
              ${
                isOpen
                  ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
              }
            `}
          >
            {language == "english" ? (
              <div
                onClick={handleLogout}
                className={`
                  flex
                  cursor-pointer
                  gap-[10px]
                  ${dangerTextClass}
                `}
              >
                <span>
                  <LogOut size={22.5} />
                </span>

                <span>
                  Log Out
                </span>
              </div>
            ) : (
              <div
                onClick={handleLogout}
                className={`
                  flex
                  cursor-pointer
                  flex-row-reverse
                  gap-[10px]
                  ${dangerTextClass}
                `}
              >
                <span>
                  <LogOut size={22.5} />
                </span>

                <span>
                  خروج از حساب
                </span>
              </div>
            )}
          </div>

          {/* Profile */}

          <div className="mt-[70px] flex flex-col items-center justify-center w-full">

            <div className="relative w-[110px] h-[110px] rounded-full object-cover bg-[url(/icon.png)] bg-cover bg-center">
              <div className="absolute -bottom-[3px] -right-[3px] flex items-center justify-center text-white w-[30px] h-[30px] border-[2.5px] box-content border-black rounded-full bg-blue-600">
                <FontAwesomeIcon icon={faCamera} />
              </div>
            </div>

            <div className="flex flex-col items-center mt-[20px] leading-[25px]">

              <span className={`text-[20px] font-semibold ${textPrimaryClass}`}>
                {displayName}
              </span>

              <div
                className={`
                  flex
                  items-center
                  gap-[10px]
                  text-[13.5px]
                  font-normal
                  ${textSecondaryClass}
                `}
              >
                <span>{mobile}</span>

                <span className="w-[5px] h-[5px] bg-gray-500 rounded-full" />

                <span>{userName}</span>
              </div>

            </div>
          </div>

          {/* Account Settings */}

          <div
            className={`
              ${back[2]}
              max-w-full
              rounded-2xl
              h-auto
              py-[7px]
              flex
              flex-col
              items-start
              mt-[15px]
              mx-[15px]
              box-border
              transition-colors
              duration-200
            `}
          >

            {/* Account */}

            <div
              onClick={() => setDes("account")}
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faCircleUser} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Account
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    Number, Username, Bio
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    حساب کاربری
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    شماره همراه, نام کاربری, بیو
                  </span>

                </div>
              )}
            </div>

            {/* Chat Settings */}

            <div
              onClick={() => setDes("chat-settings")}
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-yellow-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <MessageCircleMore
                  size={18}
                  className="fill-current"
                />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Chat Settings
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    Wallpaper, Night Mode, Animations
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    تنظیمات ظاهری
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    پس زمینه, تم, حالت شب
                  </span>

                </div>
              )}
            </div>

            {/* Privacy & Security */}

            <div
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-green-500 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faKey} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Privacy & Security
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    Last Seen, Devices, Passkeys
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    امنیت
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    آخرین بازدید, دستگاه ها
                  </span>

                </div>
              )}
            </div>

            {/* Notifications */}

            <div
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-red-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faVolumeHigh} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Notifications
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    Sounds, Calls, Badges
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    اعلان ها
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    صدا
                  </span>

                </div>
              )}
            </div>

            {/* Chat Folders */}

            <div
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faFolder} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Chat Folders
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    Sort chats into folders
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    دسته بندی مکالمه ها
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    مرتب سازی چت ها با فولدر ها
                  </span>

                </div>
              )}
            </div>

            {/* Devices */}

            <div
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faLaptop} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Devices
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    Manage connected devices
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    دستگاه ها
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    مدیریت دستگاه های متصل
                  </span>

                </div>
              )}
            </div>

            {/* Language */}

            <div
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-purple-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faGlobe} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Language
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    English
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    زبان
                  </span>

                  <span className={`font-normal text-[12.5px] ${textSecondaryClass}`}>
                    انگلیسی, فارسی
                  </span>

                </div>
              )}
            </div>

          </div>

          {/* Help */}

          <div
            className={`
              ${back[2]}
              max-w-full
              rounded-2xl
              h-auto
              py-[7px]
              flex
              flex-col
              ${
                language == "english"
                  ? "items-start"
                  : "items-end"
              }
              mt-[15px]
              mx-[15px]
              box-border
            `}
          >

            {language == "english" ? (
              <span
                className={`
                  text-left
                  font-semibold
                  text-[15px]
                  ml-[20px]
                  mt-[5px]
                  ${accentTextClass}
                `}
              >
                Help
              </span>
            ) : (
              <span
                className={`
                  text-right
                  font-semibold
                  text-[15px]
                  mr-[20px]
                  mt-[5px]
                  ${accentTextClass}
                `}
              >
                کمک
              </span>
            )}

            {/* Telegraph FAQ */}

            <div
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faCircleQuestion} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Telegraph FAQ
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    سوالات متداول تلگراف
                  </span>

                </div>
              )}
            </div>

            {/* Privacy Policy */}

            <div
              className={`
                flex
                ${
                  language == "english"
                    ? "flex-row"
                    : "flex-row-reverse"
                }
                gap-[17px]
                items-center
                h-[57px]
                w-full
                px-[20px]
              `}
            >
              <div className="w-[27px] h-[27px] rounded-lg bg-green-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                <FontAwesomeIcon icon={faShield} />
              </div>

              {language == "english" ? (
                <div className="flex flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
                    Privacy Policy
                  </span>

                </div>
              ) : (
                <div className="flex text-right flex-col leading-[22.5px]">

                  <span className={`font-medium text-[15px] ${textPrimaryClass}`}>
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