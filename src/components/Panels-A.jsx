"use client";

import { useEffect, useState } from "react";
import { useA } from "@/context/AContext";
import { useData } from "@/context/DataContext";
import { useTheme } from "@/context/ThemeContext";

import Username from "./Username";
import Username_T_A from "./Username-T-A";
import Username_S_A from "./Username-S-A";
import Account from "./Account";
import Account_S_A from "./Account-S-A";
import Settings from "./Settings";
import NewMessage from "./NewMessage";
import NewGroup from "./NewGroup";
import NewGroup_T_A from "./NewGroup-T-A";
import ChatSettings from "./ChatSettings-S-A";

export default function PanelsA() {
  const { activeA, setActiveA, isS, setIsS } = useA();
  const { language } = useData();
  const { theme, isDark, setTheme, setIsDark } = useTheme();

  const [isMounted, setIsMounted] = useState(false);

  // =========================================================
  // Reliable panel animation lifecycle
  // =========================================================

  useEffect(() => {
    let closeTimer;

    if (activeA) {
      // Mount the panel and let its CSS entrance animation run.
      setIsMounted(true);
      return;
    }

    // Keep the panel mounted while its exit animation runs.
    closeTimer = window.setTimeout(() => {
      setIsMounted(false);
    }, 320);

    return () => {
      window.clearTimeout(closeTimer);
    };
  }, [activeA]);

  return (
    <>
      <style jsx>{`
        @keyframes panelsAEnter {
          from {
            opacity: 0;
            scale: 0.94;
          }

          to {
            opacity: 1;
            scale: 1;
          }
        }

        @keyframes panelsAExit {
          from {
            opacity: 1;
            scale: 1;
          }

          to {
            opacity: 0;
            scale: 0.94;
          }
        }

        @keyframes panelsABackdropEnter {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes panelsABackdropExit {
          from {
            opacity: 1;
          }

          to {
            opacity: 0;
          }
        }

        .panels-a-enter {
          animation: panelsAEnter 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: center center;
          will-change: opacity, scale;
        }

        .panels-a-exit {
          animation: panelsAExit 240ms cubic-bezier(0.4, 0, 1, 1) both;
          transform-origin: center center;
          pointer-events: none;
          will-change: opacity, scale;
        }

        .panels-a-backdrop-enter {
          animation: panelsABackdropEnter 240ms ease-out both;
        }

        .panels-a-backdrop-exit {
          animation: panelsABackdropExit 240ms ease-in both;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .panels-a-enter,
          .panels-a-exit,
          .panels-a-backdrop-enter,
          .panels-a-backdrop-exit {
            animation-duration: 1ms;
          }
        }
      `}</style>

      {isMounted && (
        <>
          {/* Background overlay */}
          <div
            onClick={activeA ? () => setActiveA(null) : undefined}
            className={`fixed inset-0 bg-black/60 z-[80] ${
              activeA ? "panels-a-backdrop-enter" : "panels-a-backdrop-exit"
            }`}
          />

          {/* Main panel */}
          <div
            key={`panels-a-${activeA ?? "closing"}`}
            className={`${
              theme == "red" && isDark == true
                ? "bg-[#181818]"
                : theme == "blue" && isDark == true
                  ? "bg-[#1d202e]"
                  : theme == "blue" && isDark == false
                    ? "bg-[#eaf3ff]"
                    : theme == "red" && isDark == false
                      ? "bg-[#fff1f1]"
                      : ""
            } fixed top-0 bottom-0 left-0 w-full z-[90]
              md:top-[30px] md:bottom-[30px] md:left-1/2 md:-translate-x-1/2 md:w-[40%]
              min-md:rounded-2xl overflow-hidden overflow-y-scroll scrollbar-none transition-all duration-300 
              ${activeA ? "panels-a-enter" : "panels-a-exit"}`}
          >
            {activeA === "username" && (
              <Username
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveB={setActiveA}
              />
            )}

            {activeA === "username-t-a" && (
              <Username_T_A
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveB={setActiveA}
              />
            )}

            {activeA === "username-s-a" && (
              <Username_S_A
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveB={setActiveA}
              />
            )}

            {activeA === "account" && (
              <Account
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveB={setActiveA}
              />
            )}

            {activeA === "account-s-a" && (
              <Account_S_A
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveB={setActiveA}
              />
            )}

            {activeA === "settings" && (
              <Settings
                theme={theme}
                isDark={isDark}
                language={language}
                activeB={activeA}
                setActiveB={setActiveA}
                isS={isS}
                setIsS={setIsS}
                ChatSettings={<ChatSettings theme={theme} setTheme={setTheme} isDark={isDark} setIsDark={setIsDark} language={language} setActiveB={setActiveA} activeB={activeA}/>}
              />
            )}

            {activeA === "new-message" && (
              <NewMessage
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveA={setActiveA}
              />
            )}

            {activeA === "new-group" && (
              <NewGroup
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveA={setActiveA}
              />
            )}

            {activeA === "new-group-t-a" && (
              <NewGroup_T_A
                theme={theme}
                isDark={isDark}
                language={language}
                setActiveA={setActiveA}
              />
            )}

          
          </div>
        </>
      )}
    </>
  );
}
