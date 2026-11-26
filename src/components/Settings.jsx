
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
  const {back} = useTheme();
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

       async function handleLogout() {
    // Sign-in and sign-out are disabled in the temporary offline demo.
    setIsOpen2(false);
  }

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

      const displayName = [
    name,
    lastName,
  ]
    .filter(Boolean)
    .join(" ");  

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
  {des == "chat-settings" && (<ChatSettings

    theme={theme}
                setDes={setDes}
                setTheme={setTheme}
                isDark={isDark}
                setIsDark={setIsDark}
                language={language}
                setActiveB={setActiveB}
              
  />)}

   {des == "account" && (<Account
            setDes={setDes}
                theme={theme}
                 setIsOpen2={setIsOpen2}
                setTheme={setTheme}
                isDark={isDark}
                setIsDark={setIsDark}
                language={language}
                setActiveB={setActiveB}
              />)}
</div>

      <div
                      onScroll={(e) => {
                        setIsScrolled3(e.currentTarget.scrollTop > 10);
                      }}
                      className={`overflow-y-scroll scrollbar-none ${back[1]} pb-[90px] `}
                    >
                      <div className="fixed inset-x-0 h-[110px] z-[40] flex items-center justify-between px-[15px]">
        {/* Layer 1: soft blur across the whole header */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 backdrop-blur-[7px] transition-opacity duration-300 ease-out ${
            isScrolled3 ? "opacity-100" : "opacity-0"
          }`}
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
          className={`pointer-events-none absolute inset-0 backdrop-blur-[3.5px] transition-opacity duration-300 ease-out ${
            isScrolled3 ? "opacity-100" : "opacity-0"
          }`}
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
          className={`pointer-events-none absolute inset-0 bg-linear-to-b transition-opacity duration-300 ease-out ${
            isDark
              ? "from-[#000]/55 via-[#000]/20"
              : "from-[#ffffff]/55 via-[#ffffff]/20"
          } to-transparent ${
            isScrolled3 ? "opacity-100" : "opacity-0"
          }`}
        />
      
        <div
          className={`
           w-[40px] h-[40px] rounded-full ${isDark ? "bg-[#151515]" : "bg-[#edebeb]"}
            z-[50] top-[14px] left-[15px] absolute outline-1 outline-white/10 -outline-offset-1 flex items-center justify-center px-[12.5px]`}
        />
      
        <span className={`relative text-[17px] -mt-[41px] font-bold mx-auto text-white ${isScrolled3 ? "opacity-100" : "opacity-0"}`}>
          Settings
        </span>
      
        <div
          className={`${
            isOpen2 == true ? ` min-w-[160px] h-auto px-[15px] py-[10px] rounded-2xl ${isDark ? "bg-[#151515]" : "bg-[#edebeb]"} ` : `w-[85px] h-[40px] rounded-3xl ${isDark ? "bg-[#151515]" : "bg-[#edebeb]"}`
          } transition-all duration-100 ease-in-out z-[50] top-[14px] right-[15px] absolute outline-1 outline-white/10 -outline-offset-1 flex items-center justify-between px-[12.5px]`}
        >
          {!isOpen2 && <span
            className={`transition-opacity duration-100 ${
              isOpen2 ? "opacity-0" : "opacity-100"
            } text-white `}
          >
            <SearchIcon size={20} />
          </span>}
      
          {!isOpen2 && <span
            onClick={() => setIsOpen2(true)}
            className={`transition-opacity duration-100 ${
              isOpen2 ? "opacity-0" : "opacity-100"
            } text-white`}
          >
            <EllipsisVertical size={20} />
          </span>}
      
          {isOpen2 && <div className={`flex gap-[10px] transition-opacity duration-100 w-full ${isOpen2 ? "opacity-100" : "opacity-0"} text-white`} >
               <LogOut size={22}/>
               <span className="tracking-wide">Log Out</span>
          </div>}
        </div>
      </div>
      
      <div
                  onClick={isOpen2 ? () => setIsOpen2(null) : undefined}
                  className={`fixed inset-0 z-[40] ${
                    isOpen2 ? "panels-a-backdrop-enter" : "panels-a-backdrop-exit"
                  }`}
                />
      
                      
                        <div className={`  relative pb-10`}>
                         
                          {isOpen2 && (
                            <div
                              onClick={() => setIsOpen2(false)}
                              className="fixed inset-0 z-[40]"
                            />
                          )}
      
                          <div
                            className={`fixed z-[50] px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[25px] right-[20px] flex flex-col gap-[25px] origin-top-right transition-all duration-200 ease-out ${
                              isOpen
                                ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                                : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                            }`}
                          >
                            {language == "english" ? (
                              <div
                                onClick={handleLogout}
                                className="flex cursor-pointer gap-[10px]"
                              >
                                <span className="text-red-400">
                                  <LogOut size={22.5} />
                                </span>
      
                                <span className="text-red-400">
                                  Log Out
                                </span>
                              </div>
                            ) : (
                              <div
                                onClick={handleLogout}
                                className="flex cursor-pointer flex-row-reverse gap-[10px]"
                              >
                                <span className="text-red-400">
                                  <LogOut size={22.5} />
                                </span>
      
                                <span className="text-red-400">
                                  خروج از حساب
                                </span>
                              </div>
                            )}
                          </div>
      
                          <div className="mt-[70px] flex flex-col items-center justify-center w-full">
                            <div className="relative w-[110px] h-[110px] rounded-full object-cover bg-[url(/icon.png)] bg-cover bg-center">
                              <div className="absolute -bottom-[3px] -right-[3px] flex items-center justify-center text-white w-[30px] h-[30px] border-[2.5px] box-content border-black rounded-full bg-blue-600">
                                <FontAwesomeIcon icon={faCamera} />
                              </div>
                            </div>
      
                            <div className="flex flex-col items-center mt-[20px] leading-[25px]">
                              <span className="text-[20px] font-semibold text-white">
                                {displayName}
                              </span>
      
                              <div className="flex items-center gap-[10px] text-[13.5px] font-normal text-gray-400">
                                <span>{mobile}</span>
                                <span className="w-[5px] h-[5px] bg-gray-500 rounded-full"></span>
                                <span>{userName}</span>
                              </div>
                            </div>
                          </div>
      
                          <div
                            className={`${
                              back[2]
                            } max-w-full rounded-2xl h-auto py-[7px] flex flex-col items-start mt-[15px] mx-[15px] box-border`}
                          >
                            <div
                              onClick={() => setDes("account")}
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faCircleUser} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Account
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    Number, Username, Bio
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    حساب کاربری
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    شماره همراه, نام کاربری, بیو
                                  </span>
                                </div>
                              )}
                            </div>
      
                            <div
                              onClick={() => setDes("chat-settings")}
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-yellow-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <MessageCircleMore
                                  size={18}
                                  className="fill-current"
                                />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Chat Settings
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    Wallpaper, Night Mode, Animations
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    تنظیمات ظاهری
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    پس زمینه, تم, حالت شب
                                  </span>
                                </div>
                              )}
                            </div>
      
                            <div
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-green-500 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faKey} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Privacy & Security
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    Last Seen, Devices, Passkeys
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    امنیت
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    آخرین بازدید, دستگاه ها
                                  </span>
                                </div>
                              )}
                            </div>
      
                            <div
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-red-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faVolumeHigh} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Notifications
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    Sounds, Calls, Badges
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    اعلان ها
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    صدا
                                  </span>
                                </div>
                              )}
                            </div>
      
                            <div
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faFolder} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Chat Folders
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    Sort chats into folders
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    دسته بندی مکالمه ها
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    مرتب سازی چت ها با فولدر ها
                                  </span>
                                </div>
                              )}
                            </div>
      
                            <div
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faLaptop} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Devices
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    Manage connected devices
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    دستگاه ها
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    مدیریت دستگاه های متصل
                                  </span>
                                </div>
                              )}
                            </div>
      
                            <div
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-purple-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faGlobe} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Language
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    English
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    زبان
                                  </span>
      
                                  <span className="text-gray-500 font-normal text-[12.5px]">
                                    انگلیسی, فارسی
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
      
                          <div
                            className={`${
                               back[2]
                            } max-w-full rounded-2xl h-auto py-[7px] flex flex-col ${
                              language == "english" ? "items-start" : "items-end"
                            } mt-[15px] mx-[15px] box-border`}
                          >
                            {language == "english" ? (
                              <span className="text-left text-blue-300 font-semibold text-[15px] ml-[20px] mt-[5px]">
                                Help
                              </span>
                            ) : (
                              <span className="text-right text-blue-300 font-semibold text-[15px] mr-[20px] mt-[5px]">
                                کمک
                              </span>
                            )}
      
                            <div
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-blue-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faCircleQuestion} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Telegraph FAQ
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    سوالات متداول تلگراف
                                  </span>
                                </div>
                              )}
                            </div>
      
                            <div
                              className={`flex ${
                                language == "english"
                                  ? "flex-row"
                                  : "flex-row-reverse"
                              } gap-[17px] items-center h-[57px] w-full px-[20px]`}
                            >
                              <div className="w-[27px] h-[27px] rounded-lg bg-green-400 outline-[0.5px] outline-white/60 -outline-offset-1 flex items-center justify-center text-white">
                                <FontAwesomeIcon icon={faShield} />
                              </div>
      
                              {language == "english" ? (
                                <div className="flex flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
                                    Privacy Policy
                                  </span>
                                </div>
                              ) : (
                                <div className="flex text-right flex-col leading-[22.5px]">
                                  <span className="text-white font-medium text-[15px]">
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
