"use client";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

import { useState, useRef } from "react";
import { useData } from "@/context/DataContext";

export default function Username({ setActiveB, theme, isDark, language }) {
  const { userName } = useData();
  const [newUserName, setNewUserName] = useState(userName);
  const inputRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

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

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && inputRef.current.selectionStart <= 1) {
      e.preventDefault();
    }
  };

  return (
    <>
      <div
        onScroll={(e) => {
          setIsScrolled(e.currentTarget.scrollTop > 10);
        }}
        className="w-full h-screen  overflow-hidden max-md:overflow-y-scroll scrollbar-none"
      >
        {/* <div className="w-full h-[9%] px-[20px] bg-[#262B3D] flex items-center justify-between">
          <div className="flex items-center gap-[40px] text-white">
            <span>
              <ArrowLeft />
            </span>
            <span className="text-white font-bold text-[20px]">Username</span>
          </div>
          <span
            className={`text-white transition-all transition-diiscrerte ${
              newUserName == userName || newUserName.length < 6
                ? "opacity-0"
                : "opacity-100"
            }`}
          >
            <Check />
          </span>
        </div> */}
        <div
          className={`flex ${
            language == "english" ? "flex-row" : "flex-row-reverse"
          } px-[15px] w-full h-[54px] items-center justify-between ${
            isScrolled ? "bg-[#31364d]" : "bg-transparent"
          }`}
        >
          <div
            className={`flex ${
              language == "english" ? "flex-row" : "flex-row-reverse"
            } gap-[30px] text-white`}
          >
            {language == "english" ? (
              <span onClick={() => setActiveB("account")}>
                <ArrowLeft />
              </span>
            ) : (
              <span onClick={() => setActiveB("account")}>
                <ArrowRight />
              </span>
            )}
            {language == "english" ? (
              <span className="text-[17px] font-semibold">Username</span>
            ) : (
              <span className="text-[17px] font-semibold">
                تغییر نام کاربری
              </span>
            )}
          </div>
          <span
            className={`text-white transition-all transition-diiscrerte ${
              newUserName == userName || newUserName.length < 6
                ? "opacity-0"
                : "opacity-100"
            }`}
          >
            <Check />
          </span>
        </div>
        <div
          className={`relative max-w-full min-md:h-[12%] max-md:h-[14%] ${
            theme == "blue" && isDark == true
              ? "bg-[#282C3F]"
              : theme == "red" && isDark == true && "bg-[#252525]"
          } rounded-2xl px-[20px] pb-[17px] pt-[15px] flex flex-col ${
            language == "english" ? "items-start" : "items-end"
          } mt-[15px] mx-[15px] `}
        >
          {language == "english" ? (
            <span className="text-blue-300 font-semibold text-[16px]">
              Set username
            </span>
          ) : (
            <span className="text-blue-300 text-right font-semibold text-[16px]">
              نام کاربری
            </span>
          )}

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
            className="absolute border-0 caret-white text-white font-medium border-gray-700 w-full -bottom-[5px] left-[17px] h-[60px] appearance-none outline-0"
          />
        </div>
        <div className="flex flex-col gap-[15px] text-justify pt-[10px] px-[20px] min-w-full h-screen text-gray-400/80 text-[15px] tracking-normal font-normal">
          <span>
            You can choose a username on Telegraph. if you do, people will be
            able to find you by this username and contact you without needing
            your phone number.
          </span>
          <span className="tracking-normal">
            You can use a-z, 0-9 and underscores. Minimum length is 5
            characters.
          </span>
        </div>
      </div>
    </>
  );
}
