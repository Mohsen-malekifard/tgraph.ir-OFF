"use client";

import { memo } from "react";
import {
  Info,
  Link2,
  LogOut,
  Search,
  Settings2,
  Users,
  X,
} from "lucide-react";

function MenuAction({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[11px] rounded-[10px] px-[10px] py-[10px] text-start text-[13px] font-medium transition-colors hover:bg-white/[0.07] active:bg-white/[0.11] ${danger ? "text-red-400" : "text-white"}`}
    >
      <Icon size={18} className={danger ? "text-red-400" : "text-white/65"} />
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  );
}

function ChatMenu({
  category,
  selectedData,
  language,
  theme,
  isDark,
  isOpen,
  onClose,
  onManage,
}) {
  const isEnglish = language === "english";
  const isGroup = category === "Group" || selectedData?.conversation?.type === "group";
  const isChannel = category === "Channel" || selectedData?.conversation?.type === "channel";
  const role = selectedData?.membership?.role || "member";
  const canManage = role === "owner" || role === "admin";

  const panelClass = isDark
    ? theme === "blue" ? "bg-[#282C3F]" : "bg-[#252525]"
    : theme === "blue" ? "bg-[#e0ebfb]" : "bg-[#ffe3e3]";
  const textClass = isDark ? "text-white" : "text-[#263247]";

  if (!isOpen) return null;

  if (!isGroup && !isChannel) {
    return (
      <>
        <div className="fixed inset-0 z-[95]" onClick={onClose} />
        <div className={`fixed right-[16px] top-[78px] z-[100] w-[220px] rounded-[15px] border border-white/10 p-[8px] shadow-2xl ${panelClass}`} dir={isEnglish ? "ltr" : "rtl"}>
          <div className={`flex items-center justify-between px-[10px] pb-[5px] pt-[4px] text-[12px] font-semibold opacity-55 ${textClass}`}>
            {isEnglish ? "Conversation" : "گفتگو"}
            <button type="button" onClick={onClose} className="opacity-65"><X size={16} /></button>
          </div>
          <MenuAction icon={Search} label={isEnglish ? "Search in chat" : "جستجو در گفتگو"} onClick={onClose} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[95]" onClick={onClose} />
      <div
        className={`fixed right-[16px] top-[78px] z-[100] w-[236px] rounded-[15px] border border-white/10 p-[8px] shadow-2xl ${panelClass}`}
        dir={isEnglish ? "ltr" : "rtl"}
      >
        <div className={`flex items-center justify-between px-[10px] pb-[5px] pt-[4px] text-[12px] font-semibold opacity-55 ${textClass}`}>
          {isGroup ? (isEnglish ? "Group options" : "گزینه‌های گروه") : (isEnglish ? "Channel options" : "گزینه‌های کانال")}
          <button type="button" onClick={onClose} className="opacity-65"><X size={16} /></button>
        </div>

        <MenuAction
          icon={Info}
          label={isEnglish ? "Conversation details" : "اطلاعات گفتگو"}
          onClick={() => { onClose?.(); onManage?.("settings"); }}
        />
        <MenuAction
          icon={Users}
          label={isEnglish ? "Members" : "اعضا"}
          onClick={() => { onClose?.(); onManage?.("members"); }}
        />
        {canManage && (
          <MenuAction
            icon={Link2}
            label={isEnglish ? "Invite links" : "لینک‌های دعوت"}
            onClick={() => { onClose?.(); onManage?.("invites"); }}
          />
        )}
        {canManage && (
          <MenuAction
            icon={Settings2}
            label={isEnglish ? "Manage conversation" : "مدیریت گفتگو"}
            onClick={() => { onClose?.(); onManage?.("settings"); }}
          />
        )}
        <div className="my-[5px] h-px bg-white/10" />
        <MenuAction
          icon={LogOut}
          danger
          label={isEnglish ? "Manage / leave conversation" : "مدیریت / ترک گفتگو"}
          onClick={() => { onClose?.(); onManage?.("settings"); }}
        />
      </div>
    </>
  );
}

export default memo(ChatMenu);
