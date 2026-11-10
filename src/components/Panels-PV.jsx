"use client";

import { useState, useEffect } from "react";
import { usePV } from "@/context/PVContext";
import {
  createLucideIcon,
  CircleUserRound,
  Pencil,
  EllipsisVertical,
  Users,
  User,
  Bookmark,
  Search,
  ImageUp,
  AtSign,
  Link,
  CircleQuestionMark,
  SettingsIcon,
  UserRoundPlus,
  LucideSettings,
  MessageCircle,
  MessageCircleMore,
  MessageCirclePlus,
  X,
  Eraser,
  Trash,
  CircleArrowDown,
  CircleAlert,
  Hand,
  LogOut,
  ArrowLeft,
  ArrowRight,
  BellOff,
  UserPlus,
  Share2,
  Ban,
  CircleAlertIcon,
  CopyIcon,
  Bell,
  LogOutIcon,
} from "lucide-react";
import { useB } from "@/context/BContext";
import { useChat } from "@/context/ChatContext";
import { useA } from "@/context/AContext";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

export default function PanelsPV({ data }) {
  const { language } = useData();
  const { theme, isDark } = useTheme();
  const { activePV, setActivePV } = usePV();
  const { setActiveB } = useB();
  const { setActiveA } = useA();
  const { selectedData, setSelectedData } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Contact Username
  |--------------------------------------------------------------------------
  */

  const rawUsername = [
    data?.username,
    data?.peer?.username,
    data?.user?.username,
  ].find(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0
  );

  const contactUsername = rawUsername
    ? rawUsername.trim().startsWith("@")
      ? rawUsername.trim()
      : `@${rawUsername.trim()}`
    : "";

  // =========================================================
  // Animation system
  // =========================================================

  useEffect(() => {
    if (!activePV) {
      setIsOpen3(false);
      return;
    }

    // Reset internal action animations on every opening.
    setIsOpen3(false);

    let firstFrame = 0;
    let secondFrame = 0;

    // Wait for two browser frames before starting the
    // internal action animations.
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setIsOpen3(true);
      });
    });

    // Prevent stale animation callbacks when the panel closes
    // or the active panel changes.
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [activePV]);

  if (!activePV) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <style jsx>{`
        @keyframes pvPanelEnter {
          from {
            opacity: 0;
            scale: 0.94;
          }

          to {
            opacity: 1;
            scale: 1;
          }
        }

        @keyframes pvBackdropEnter {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .panels-pv-enter {
          animation: pvPanelEnter 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: center center;
          will-change: opacity, scale;
        }

        .panels-pv-backdrop-enter {
          animation: pvBackdropEnter 240ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          .panels-pv-enter,
          .panels-pv-backdrop-enter {
            animation-duration: 1ms;
          }
        }
      `}</style>

      {/* Background overlay */}

      <div
        onClick={() => setActivePV(null)}
        className="bg-black/60 z-[80] w-full h-screen absolute inset-0 panels-pv-backdrop-enter"
      />

      {/* Main panel */}

      <div
        key={`pv-${activePV}-${data?.category ?? ""}-${data?.title ?? ""}`}
        className={`${
          theme == "blue" && isDark == true
            ? "bg-[#1D202E]"
            : theme == "red" && isDark == true && "bg-[#181818]"
        } fixed inset-0 z-[90] overflow-hidden md:top-[30px] md:bottom-[30px] md:left-1/2 md:-translate-x-1/2 md:w-[40%] md:rounded-[24px] panels-pv-enter`}
      >
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="fixed w-full h-screen z-[95] inset-0 bg-black/60"
          />
        )}

        {isOpen2 && (
          <div
            onClick={() => setIsOpen2(false)}
            className="fixed w-full h-screen z-[95] inset-0 bg-black/60"
          />
        )}

        {/* ================================================ */}
        {/* Private chat contact preview                     */}
        {/* ================================================ */}

        {activePV === "preview" && data.category == "Pv" && (
          <div className="px-[16px] pt-[13px]">
            <div
              className={`fixed z-[100] ${
                theme == "blue" && isDark == true
                  ? "bg-[#31374F]"
                  : theme == "red" && isDark == true && "bg-[#252525]"
              } px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[22.5px] ${
                language == "english"
                  ? "right-[20px] origin-top-right"
                  : "right-[20px] origin-top-right"
              } flex flex-col gap-[25px] transition-all duration-200 ease-out ${
                isOpen
                  ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
              }`}
            >
              {language == "english" ? (
                <>
                  <div className="flex gap-[10px]">
                    <span className="text-gray-500">
                      <UserPlus />
                    </span>

                    <span className="text-white">Add to contacts</span>
                  </div>

                  <div className="flex gap-[10px]">
                    <span className="text-gray-500">
                      <Share2 />
                    </span>

                    <span className="text-white">Share contact</span>
                  </div>

                  <div className="flex gap-[10px]">
                    <span className="text-gray-500">
                      <Ban />
                    </span>

                    <span className="text-white">Block user</span>
                  </div>

                  <div className="flex gap-[10px] text-red-400">
                    <span>
                      <CircleAlert />
                    </span>

                    <span>Report</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-row-reverse gap-[10px]">
                    <span className="text-gray-500">
                      <Share2 />
                    </span>

                    <span className="text-white">ارسال مخاطب</span>
                  </div>

                  <div className="flex flex-row-reverse gap-[10px]">
                    <span className="text-gray-500">
                      <UserPlus />
                    </span>

                    <span className="text-white">افزودن به مخاطبین</span>
                  </div>

                  <div className="flex flex-row-reverse gap-[10px]">
                    <span className="text-gray-500">
                      <Ban />
                    </span>

                    <span className="text-white">مسدود</span>
                  </div>

                  <div className="flex flex-row-reverse gap-[10px] text-red-400">
                    <span>
                      <CircleAlert />
                    </span>

                    <span>گزارش</span>
                  </div>
                </>
              )}
            </div>

            <div
              className={`flex ${
                language == "english" ? "flex-row" : "flex-row"
              } justify-between`}
            >
              {language == "english" ? (
                <span onClick={() => setActivePV(null)} className="text-white">
                  <ArrowLeft />
                </span>
              ) : (
                <span onClick={() => setActivePV(null)} className="text-white">
                  <ArrowLeft />
                </span>
              )}

              <span onClick={() => setIsOpen(true)} className="text-white">
                <EllipsisVertical />
              </span>
            </div>

            <div className="flex flex-col gap-[20px] items-center mt-[20px]">
              <div
                className={`w-[110px] h-[110px] rounded-full bg-conic-180 ${data?.colorClasses}`}
              />

              <div className="flex flex-col leading-[25px]">
                <span className="text-white font-medium text-[20px] text-center">
                  {data.title}
                </span>

                <span className="text-gray-500 font-semibold text-[14px] text-center">
                  last seen Aug 04 at 22:10
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-[15px] w-full mt-[20px]">
              <div className="flex justify-between w-full gap-[15px]">
                <span
                  onClick={() => {
                    setActiveB("chat");
                    setActivePV(null);
                    setActiveA(null);
                  }}
                  className={`basis-1/2 ${
                    theme == "blue" && isDark == true
                      ? "bg-[#33374E]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[3px] origin-right transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen3 ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                  }`}
                >
                  <span>
                    <MessageCircle size={20} className="fill-current" />
                  </span>

                  <span className="text-[14.5px] font-bold">Message</span>
                </span>

                <span
                  className={`basis-1/2 ${
                    theme == "blue" && isDark == true
                      ? "bg-[#33374E]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[3px] origin-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen3 ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                  }`}
                >
                  <span>
                    <BellOff size={20} className="fill-current" />
                  </span>

                  <span className="text-[14.5px] font-bold">Mute</span>
                </span>
              </div>

              {language == "english" ? (
                <div
                  onClick={() => setIsOpen2(true)}
                  className={`w-full h-[55px] rounded-2xl ${
                    theme == "blue" && isDark == true
                      ? "bg-[#2b2f42]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } px-[10px] flex flex-col justify-center leading-[20px] items-start`}
                >
                  <span className="text-white text-[17px] font-medium">
                    {data.mobile ? data.mobile : "+98 994 579 5036"}
                  </span>

                  <span className="text-gray-500 font-semibold text-[12px]">
                    Mobile
                  </span>
                </div>
              ) : (
                <div
                  onClick={() => setIsOpen2(true)}
                  className={`w-full relative h-[55px] rounded-2xl ${
                    theme == "blue" && isDark == true
                      ? "bg-[#2b2f42]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } px-[10px] flex flex-row justify-between leading-[20px] items-center`}
                >
                  <span className="text-white text-right text-[17px] font-medium">
                    {data.mobile ? data.mobile : "+98 994 579 5036"}
                  </span>

                  <span className="flex items-center right-[10px] text-gray-500 text-right font-semibold text-[12px]">
                    شماره همراه
                  </span>
                </div>
              )}

              {/* Username */}

              {contactUsername && (
                language == "english" ? (
                  <div
                    className={`w-full h-[55px] rounded-2xl ${
                      theme == "blue" && isDark == true
                        ? "bg-[#2b2f42]"
                        : theme == "red" && isDark == true && "bg-[#252525]"
                    } px-[10px] flex flex-col justify-center leading-[20px] items-start`}
                  >
                    <span
                      dir="ltr"
                      className="text-white text-[17px] font-medium"
                    >
                      {contactUsername}
                    </span>

                    <span className="text-gray-500 font-semibold text-[12px]">
                      Username
                    </span>
                  </div>
                ) : (
                  <div
                    className={`w-full relative h-[55px] rounded-2xl ${
                      theme == "blue" && isDark == true
                        ? "bg-[#2b2f42]"
                        : theme == "red" && isDark == true && "bg-[#252525]"
                    } px-[10px] flex flex-row justify-between leading-[20px] items-center`}
                  >
                    <span
                      dir="ltr"
                      className="text-white text-right text-[17px] font-medium"
                    >
                      {contactUsername}
                    </span>

                    <span className="flex items-center right-[10px] text-gray-500 text-right font-semibold text-[12px]">
                      نام کاربری
                    </span>
                  </div>
                )
              )}

              {language == "english" ? (
                <div
                  className={`fixed z-[100] ${
                    theme == "blue" && isDark == true
                      ? "bg-[#31374F]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[55%] right-[20px] flex flex-col gap-[25px] origin-top-right transition-all duration-200 ease-out ${
                    isOpen2
                      ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                  }`}
                >
                  <div className="flex gap-[10px]">
                    <span className="text-gray-500">
                      <CopyIcon />
                    </span>

                    <span className="text-white">Copy</span>
                  </div>
                </div>
              ) : (
                <div
                  className={`fixed z-[100] ${
                    theme == "blue" && isDark == true
                      ? "bg-[#31374F]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[52.5%] right-[45px] flex flex-col gap-[25px] origin-top-right transition-all duration-200 ease-out ${
                    isOpen2
                      ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                  }`}
                >
                  <div className="flex flex-row-reverse gap-[10px]">
                    <span className="text-gray-500">
                      <CopyIcon />
                    </span>

                    <span className="text-white">کپی</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================ */}
        {/* Channel preview                                  */}
        {/* ================================================ */}

        {activePV === "preview" && data.category == "Channel" && (
          <div className="px-[16px] pt-[13px]">
            <div
              className={`fixed z-[100] ${
                theme == "blue" && isDark == true
                  ? "bg-[#31374F]"
                  : theme == "red" && isDark == true && "bg-[#252525]"
              } px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[22.5px] ${
                language == "english"
                  ? "right-[20px] origin-top-right"
                  : "left-[20px] origin-top-left"
              } flex flex-col gap-[25px] transition-all duration-200 ease-out ${
                isOpen
                  ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
              }`}
            >
              {language == "english" ? (
                <>
                  <div className="flex gap-[15px]">
                    <span className="text-gray-500">
                      <Share2 />
                    </span>

                    <span className="text-white">Share</span>
                  </div>

                  <div className="flex gap-[15px]">
                    <span className="text-gray-500">
                      <LogOutIcon />
                    </span>

                    <span className="text-white">Leave Channel</span>
                  </div>

                  <div className="flex gap-[15px] text-red-400">
                    <span>
                      <CircleAlert />
                    </span>

                    <span>Report</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-row-reverse gap-[15px]">
                    <span className="text-gray-500">
                      <Share2 />
                    </span>

                    <span className="text-white">ارسال</span>
                  </div>

                  <div className="flex flex-row-reverse gap-[15px]">
                    <span className="text-gray-500">
                      <LogOutIcon />
                    </span>

                    <span className="text-white">ترک کانال</span>
                  </div>

                  <div className="flex flex-row-reverse gap-[15px] text-red-400">
                    <span>
                      <CircleAlert />
                    </span>

                    <span>گزارش</span>
                  </div>
                </>
              )}
            </div>

            <div
              className={`flex ${
                language == "english" ? "flex-row" : "flex-row-reverse"
              } justify-between`}
            >
              {language == "english" ? (
                <span onClick={() => setActivePV(null)} className="text-white">
                  <ArrowLeft />
                </span>
              ) : (
                <span onClick={() => setActivePV(null)} className="text-white">
                  <ArrowRight />
                </span>
              )}

              <span onClick={() => setIsOpen(true)} className="text-white">
                <EllipsisVertical />
              </span>
            </div>

            <div className="flex flex-col gap-[20px] items-center mt-[20px]">
              <div
                className={`w-[110px] h-[110px] rounded-full bg-conic-180 ${data?.colorClasses}`}
              />

              <div className="flex flex-col leading-[25px]">
                <span className="text-white font-medium text-[20px] text-center">
                  {data.title}
                </span>

                <span className="text-gray-500 font-semibold text-[14px] text-center">
                  1960 subscribers
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-[15px] w-full mt-[20px]">
              <div className="flex justify-between w-full gap-[15px]">
                <span
                  className={`basis-1/3 ${
                    theme == "blue" && isDark == true
                      ? "bg-[#33374E]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[3px] origin-right transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen3 ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                  }`}
                >
                  <span>
                    <Bell size={20} className="fill-current" />
                  </span>

                  <span className="text-[12.5px] font-semibold">Mute</span>
                </span>

                <span
                  className={`basis-1/3 ${
                    theme == "blue" && isDark == true
                      ? "bg-[#33374E]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[3px] origin-center transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen3 ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                  }`}
                >
                  <span>
                    <Share2 size={20} className="fill-current" />
                  </span>

                  <span className="text-[12.5px] font-semibold">Share</span>
                </span>

                <span
                  className={`basis-1/3 ${
                    theme == "blue" && isDark == true
                      ? "bg-[#33374E]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } h-[55px] rounded-2xl flex flex-col items-center justify-center text-white gap-[3px] origin-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen3 ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                  }`}
                >
                  <span>
                    <LogOutIcon size={20} />
                  </span>

                  <span className="text-[12.5px] font-semibold">Leave</span>
                </span>
              </div>

              <div
                onClick={() => setIsOpen2(true)}
                className={`w-full h-[60px] rounded-2xl ${
                  theme == "blue" && isDark == true
                    ? "bg-[#33374E]"
                    : theme == "red" && isDark == true && "bg-[#252525]"
                } px-[15px] flex flex-col justify-center leading-[20px] items-start`}
              >
                <span className="text-white text-[16px] font-normal">
                  @/alureai
                </span>

                {language == "english" ? (
                  <span className="text-gray-500 font-semibold text-[12px]">
                    Invite Link
                  </span>
                ) : (
                  <span className="text-gray-500 font-semibold text-[12px]">
                    لینک دعوت
                  </span>
                )}
              </div>

              {language == "english" ? (
                <div
                  className={`fixed z-[100] bg-[#31374F] px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[55%] right-[20px] flex flex-col gap-[25px] origin-top-right transition-all duration-200 ease-out ${
                    isOpen2
                      ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                  }`}
                >
                  <div className="flex gap-[10px]">
                    <span className="text-gray-500">
                      <CopyIcon />
                    </span>

                    <span className="text-white">Copy</span>
                  </div>
                </div>
              ) : (
                <div
                  className={`fixed z-[100] ${
                    theme == "blue" && isDark == true
                      ? "bg-[#31374F]"
                      : theme == "red" && isDark == true && "bg-[#252525]"
                  } px-[12.5px] py-[12.5px] w-[200px] rounded-[5px] top-[52.5%] right-[45px] flex flex-col gap-[25px] origin-top-left transition-all duration-200 ease-out ${
                    isOpen2
                      ? "opacity-100 scale-100 translate-x-0 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-0 translate-x-[-10px] translate-y-[10px] pointer-events-none"
                  }`}
                >
                  <div
                    className="flex flex-row-reverse gap-[10px] w-full "
                    onClick={() => setIsOpen2(false)}
                  >
                    <span className="text-gray-500">
                      <CopyIcon />
                    </span>

                    <span className="text-white">کپی</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
