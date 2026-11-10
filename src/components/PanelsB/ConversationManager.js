"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Link2,
  LoaderCircle,
  Megaphone,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { compressConversationAvatar } from "@/lib/conversationAvatar";
import { useAuth } from "@/context/AuthContext";

function getId(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const nested = value._id ?? value.id;
    return nested !== undefined && nested !== null ? String(nested) : String(value);
  }
  return String(value);
}

function getUserName(user, language) {
  if (!user || typeof user !== "object") return language === "english" ? "Unknown user" : "کاربر ناشناس";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || (user.username ? `@${user.username}` : (language === "english" ? "Unknown user" : "کاربر ناشناس"));
}

export default function ConversationManager({
  open,
  onClose,
  onConversationUpdated,
  onConversationRemoved,
  conversationId,
  language = "english",
  theme = "blue",
  isDark = true,
  initialTab = "members",
}) {
  const isEnglish = language === "english";
  const { user } = useAuth();
  const currentUserId = getId(user?.id ?? user?._id);

  const [tab, setTab] = useState(initialTab);
  const [conversation, setConversation] = useState(null);
  const [membership, setMembership] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersCursor, setMembersCursor] = useState(null);
  const [membersHasMore, setMembersHasMore] = useState(false);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [bannedMembers, setBannedMembers] = useState([]);
  const [bannedCursor, setBannedCursor] = useState(null);
  const [bannedHasMore, setBannedHasMore] = useState(false);
  const [loadingMoreBanned, setLoadingMoreBanned] = useState(false);
  const [showBanned, setShowBanned] = useState(false);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyUser, setBusyUser] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [publicLinkUrl, setPublicLinkUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarInputRef = useRef(null);

  const isChannel = conversation?.type === "channel";
  const role = membership?.role || "member";
  const canManage = role === "owner" || role === "admin";
  const isOwner = role === "owner";

  const panelClass = isDark
    ? theme === "blue" ? "bg-[#20263b]" : "bg-[#252525]"
    : theme === "blue" ? "bg-[#eaf2ff]" : "bg-[#fff0f0]";
  const surfaceClass = isDark
    ? theme === "blue" ? "bg-[#2a314b]" : "bg-[#303030]"
    : theme === "blue" ? "bg-[#dceaff]" : "bg-[#ffe0e0]";
  const textClass = isDark ? "text-white" : "text-[#263247]";
  const mutedClass = isDark ? "text-white/50" : "text-[#526078]";
  const accentClass = theme === "blue"
    ? (isDark ? "text-[#9eb4ff]" : "text-[#126fcd]")
    : (isDark ? "text-[#ff9999]" : "text-[#c72e2e]");

  const reload = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError("");

    try {
      const [detailsResponse, membersResponse] = await Promise.all([
        apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}`),
        apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members?limit=100`),
      ]);

      const nextConversation = detailsResponse?.conversation || null;
      const nextMembership = detailsResponse?.membership || null;
      const nextMembers = Array.isArray(membersResponse?.members) ? membersResponse.members : [];

      setConversation(nextConversation);
      setMembership(nextMembership);
      setMembers(nextMembers);
      setMembersCursor(membersResponse?.nextCursor || null);
      setMembersHasMore(Boolean(membersResponse?.hasMore));

      if (nextMembership?.role === "owner" || nextMembership?.role === "admin") {
        try {
          const bannedResponse = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members?limit=100&bannedOnly=true`);
          setBannedMembers(Array.isArray(bannedResponse?.members) ? bannedResponse.members : []);
          setBannedCursor(bannedResponse?.nextCursor || null);
          setBannedHasMore(Boolean(bannedResponse?.hasMore));
        } catch {
          setBannedMembers([]);
          setBannedCursor(null);
          setBannedHasMore(false);
        }
      } else {
        setBannedMembers([]);
        setBannedCursor(null);
        setBannedHasMore(false);
      }

      setTitle(nextConversation?.title || "");
      setDescription(nextConversation?.description || "");
      setUsername(nextConversation?.username || "");
      setIsPublic(Boolean(nextConversation?.isPublic));
      setAvatarPreview(nextConversation?.avatar || "");

      if (nextMembership?.role === "owner" || nextMembership?.role === "admin") {
        try {
          const inviteResponse = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/invites`);
          setInvites(Array.isArray(inviteResponse?.invites) ? inviteResponse.invites : []);
        } catch {
          setInvites([]);
        }
      } else {
        setInvites([]);
      }

      onConversationUpdated?.(nextConversation, nextMembership);
    } catch (loadError) {
      setError(loadError?.message || (isEnglish ? "Could not load conversation details." : "دریافت اطلاعات گفتگو ناموفق بود."));
    } finally {
      setLoading(false);
    }
  }, [conversationId, isEnglish, onConversationUpdated]);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab || "members");
    setInviteUrl("");
    setPublicLinkUrl("");
    setNotice("");
    setMemberPhone("");
    setShowBanned(false);
    void reload();
  }, [open, conversationId, initialTab, reload]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const activeMembers = useMemo(
    () => members.filter((item) => item?.user && !item.isBanned),
    [members]
  );

  async function loadMoreMembers() {
    if (!conversationId || !membersHasMore || !membersCursor || loadingMoreMembers) return;
    setLoadingMoreMembers(true);
    try {
      const response = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members?limit=100&before=${encodeURIComponent(membersCursor)}`);
      const nextMembers = Array.isArray(response?.members) ? response.members : [];
      setMembers((previous) => {
        const seen = new Set(previous.map((member) => getId(member?._id)));
        return [...previous, ...nextMembers.filter((member) => !seen.has(getId(member?._id)))];
      });
      setMembersCursor(response?.nextCursor || null);
      setMembersHasMore(Boolean(response?.hasMore));
    } catch (loadError) {
      setError(loadError?.message || (isEnglish ? "Could not load more members." : "دریافت اعضای بیشتر ناموفق بود."));
    } finally {
      setLoadingMoreMembers(false);
    }
  }

  async function loadMoreBannedMembers() {
    if (!conversationId || !bannedHasMore || !bannedCursor || loadingMoreBanned) return;
    setLoadingMoreBanned(true);
    try {
      const response = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members?limit=100&bannedOnly=true&before=${encodeURIComponent(bannedCursor)}`);
      const nextMembers = Array.isArray(response?.members) ? response.members : [];
      setBannedMembers((previous) => {
        const seen = new Set(previous.map((member) => getId(member?._id)));
        return [...previous, ...nextMembers.filter((member) => !seen.has(getId(member?._id)))];
      });
      setBannedCursor(response?.nextCursor || null);
      setBannedHasMore(Boolean(response?.hasMore));
    } catch (loadError) {
      setError(loadError?.message || (isEnglish ? "Could not load banned members." : "دریافت اعضای مسدودشده ناموفق بود."));
    } finally {
      setLoadingMoreBanned(false);
    }
  }

  async function runAction(action, successMessage) {
    if (busy) return null;
    setBusy(true);
    setError("");
    try {
      const result = await action();
      if (successMessage) setNotice(successMessage);
      await reload();
      window.dispatchEvent(new Event("telegraph:conversations:refresh"));
      return result;
    } catch (actionError) {
      setError(actionError?.message || (isEnglish ? "The operation failed." : "انجام عملیات ناموفق بود."));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    const phone = memberPhone.trim();
    if (!phone || busy) return;

    setBusy(true);
    setError("");
    try {
      const lookup = await apiFetch("/api/user/lookup-phone", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });

      if (lookup?.exists !== true || !lookup?.user) {
        throw new Error(isEnglish ? "This phone number is not registered in Telegraph." : "این شماره در تلگراف ثبت‌نام نکرده است.");
      }

      const userId = getId(lookup.user);
      if (!userId || userId === currentUserId) {
        throw new Error(isEnglish ? "This user cannot be added." : "افزودن این کاربر امکان‌پذیر نیست.");
      }

      await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });

      setMemberPhone("");
      setNotice(isEnglish ? "Member added." : "عضو اضافه شد.");
      await reload();
      window.dispatchEvent(new Event("telegraph:conversations:refresh"));
    } catch (actionError) {
      setError(actionError?.message || (isEnglish ? "Could not add this member." : "افزودن عضو ناموفق بود."));
    } finally {
      setBusy(false);
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canManage || busy) return;

    setBusy(true);
    setError("");
    try {
      const avatar = await compressConversationAvatar(file);
      const response = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        body: JSON.stringify({ avatar }),
      });
      if (!response?.success || !response?.conversation) {
        throw new Error(response?.message || "Could not update conversation photo");
      }
      setAvatarPreview(response.conversation.avatar || "");
      onConversationUpdated?.(response.conversation, membership);
      setNotice(isEnglish ? "Conversation photo updated." : "تصویر گفتگو به‌روزرسانی شد.");
      window.dispatchEvent(new Event("telegraph:conversations:refresh"));
    } catch (avatarError) {
      setError(avatarError?.message || (isEnglish ? "Could not update the photo." : "به‌روزرسانی تصویر ناموفق بود."));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!canManage || busy || !avatarPreview) return;
    await runAction(async () => {
      const response = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        body: JSON.stringify({ avatar: null }),
      });
      if (!response?.success || !response?.conversation) throw new Error(response?.message || "Could not remove photo");
      setAvatarPreview("");
      onConversationUpdated?.(response.conversation, membership);
      return response;
    }, isEnglish ? "Conversation photo removed." : "تصویر گفتگو حذف شد.");
  }

  async function handleSaveDetails(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError(isEnglish ? "Enter a title." : "عنوان را وارد کن.");
      return;
    }

    const body = {
      title: title.trim(),
      description: description.trim(),
    };

    if (isChannel) {
      body.isPublic = isPublic;
      body.username = isPublic ? username.trim().replace(/^@/, "").toLowerCase() : "";
      if (isPublic && !/^[a-z0-9_]{3,32}$/.test(body.username)) {
        setError(isEnglish ? "A public channel needs a valid username (3–32 characters)." : "برای کانال عمومی یک نام کاربری معتبر ۳ تا ۳۲ کاراکتری وارد کن.");
        return;
      }
    }

    await runAction(async () => {
      const response = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!response?.success || !response?.conversation) throw new Error(response?.message || "Could not update conversation");
      onConversationUpdated?.(response.conversation, membership);
      return response;
    }, isEnglish ? "Conversation updated." : "اطلاعات گفتگو به‌روزرسانی شد.");
  }

  async function handleCreateInvite() {
    const response = await runAction(async () => {
      const result = await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/invites`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!result?.success || !result?.invite?.token) throw new Error(result?.message || "Could not create invite link");
      const url = `${window.location.origin}/join/${result.invite.token}`;
      setInviteUrl(url);
      return result;
    }, isEnglish ? "Invite link created." : "لینک دعوت ساخته شد.");
    return response;
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setNotice(isEnglish ? "Invite link copied." : "لینک دعوت کپی شد.");
    } catch {
      setError(isEnglish ? "Could not copy the link." : "کپی لینک ناموفق بود.");
    }
  }

  async function copyPublicLink() {
    if (!username || !isPublic) return;
    const url = `${window.location.origin}/channel/${encodeURIComponent(username)}`;
    setPublicLinkUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setNotice(isEnglish ? "Public channel link copied." : "لینک عمومی کانال کپی شد.");
    } catch {
      setError(isEnglish ? "Could not copy the public link." : "کپی لینک عمومی ناموفق بود.");
    }
  }

  async function handleMemberRequest(member, action) {
    const targetUserId = getId(member?.user);
    const targetRole = member?.role || "member";
    if (!targetUserId || busyUser) return;

    if (action === "remove" && !window.confirm(isEnglish ? "Remove this member?" : "این عضو از گفتگو حذف شود؟")) return;
    if (action === "ban" && !window.confirm(isEnglish ? "Ban this member from the conversation?" : "این عضو از گفتگو مسدود شود؟")) return;

    setBusyUser(targetUserId);
    setError("");
    try {
      if (action === "remove") {
        await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(targetUserId)}`, { method: "DELETE" });
      } else if (action === "ban") {
        await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(targetUserId)}/ban`, { method: "POST" });
      } else if (action === "unban") {
        await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(targetUserId)}/ban`, { method: "DELETE" });
      } else if (action === "mute" || action === "unmute") {
        await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(targetUserId)}/mute`, { method: action === "mute" ? "POST" : "DELETE" });
      } else if (action === "promote" || action === "demote") {
        await apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/members/${encodeURIComponent(targetUserId)}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: action === "promote" ? "admin" : "member" }),
        });
      }

      setNotice(isEnglish ? "Member updated." : "وضعیت عضو به‌روزرسانی شد.");
      await reload();
      window.dispatchEvent(new Event("telegraph:conversations:refresh"));
    } catch (actionError) {
      setError(actionError?.message || (isEnglish ? "Could not update this member." : "به‌روزرسانی عضو ناموفق بود."));
    } finally {
      setBusyUser("");
    }
  }

  async function handleTransferOwnership(member) {
    const targetUserId = getId(member?.user);
    if (!targetUserId) return;
    if (!window.confirm(isEnglish ? "Transfer ownership to this member? You will become an administrator." : "مالکیت گفتگو به این عضو منتقل شود؟ نقش شما به مدیر تغییر می‌کند.")) return;

    await runAction(async () => apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/transfer-ownership`, {
      method: "POST",
      body: JSON.stringify({ userId: targetUserId }),
    }), isEnglish ? "Ownership transferred." : "مالکیت گفتگو منتقل شد.");
  }

  async function handleRevokeInvite(inviteId) {
    if (!window.confirm(isEnglish ? "Revoke this invite link?" : "این لینک دعوت باطل شود؟")) return;
    await runAction(async () => apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/invites/${encodeURIComponent(inviteId)}`, { method: "DELETE" }), isEnglish ? "Invite revoked." : "لینک دعوت باطل شد.");
  }

  async function handleLeaveOrDelete() {
    if (isOwner) {
      if (!window.confirm(isEnglish ? "Permanently delete this conversation and its membership records?" : "این گفتگو و عضویت تمام اعضا برای همیشه حذف شود؟")) return;
      const result = await runAction(async () => apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}`, { method: "DELETE" }), null);
      if (!result) return;
    } else {
      if (!window.confirm(isEnglish ? "Leave this conversation?" : "از این گفتگو خارج می‌شوی؟")) return;
      const result = await runAction(async () => apiFetch(`/api/conversations/${encodeURIComponent(conversationId)}/leave`, { method: "POST" }), null);
      if (!result) return;
    }

    onConversationRemoved?.();
    onClose?.();
  }

  if (!open) return null;

  const titleText = conversation?.title || (isEnglish ? "Conversation" : "گفتگو");

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 px-[12px] py-[18px] backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={isEnglish ? "Conversation management" : "مدیریت گفتگو"}
        dir={isEnglish ? "ltr" : "rtl"}
        className={`flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${panelClass}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center gap-[12px] border-b border-white/10 px-[16px] py-[14px]">
          <button type="button" onClick={onClose} aria-label={isEnglish ? "Close" : "بستن"} className={`flex h-[36px] w-[36px] items-center justify-center rounded-full ${surfaceClass} ${textClass}`}>
            <ArrowLeft size={19} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className={`truncate text-[17px] font-semibold ${textClass}`}>{titleText}</h2>
            <p className={`mt-[2px] text-[12px] ${mutedClass}`}>
              {isChannel ? (isEnglish ? "Channel" : "کانال") : (isEnglish ? "Group" : "گروه")} · {activeMembers.length.toLocaleString(isEnglish ? "en-US" : "fa-IR")}{membersHasMore ? "+" : ""} {isEnglish ? "members loaded" : "عضو دریافت‌شده"}
            </p>
          </div>
          <button type="button" onClick={onClose} className={`flex h-[34px] w-[34px] items-center justify-center rounded-full ${textClass} opacity-65`} aria-label={isEnglish ? "Close" : "بستن"}>
            <X size={20} />
          </button>
        </header>

        <nav className="flex gap-[7px] border-b border-white/10 px-[12px] py-[10px]">
          <button type="button" onClick={() => setTab("members")} className={`flex-1 rounded-xl px-[8px] py-[9px] text-[13px] font-semibold ${tab === "members" ? `${surfaceClass} ${accentClass}` : `${textClass} opacity-55`}`}>
            <Users className="mx-auto mb-[3px]" size={17} />{isEnglish ? "Members" : "اعضا"}
          </button>
          <button type="button" onClick={() => setTab("settings")} className={`flex-1 rounded-xl px-[8px] py-[9px] text-[13px] font-semibold ${tab === "settings" ? `${surfaceClass} ${accentClass}` : `${textClass} opacity-55`}`}>
            <Pencil className="mx-auto mb-[3px]" size={17} />{isEnglish ? "Details" : "اطلاعات"}
          </button>
          {canManage && (
            <button type="button" onClick={() => setTab("invites")} className={`flex-1 rounded-xl px-[8px] py-[9px] text-[13px] font-semibold ${tab === "invites" ? `${surfaceClass} ${accentClass}` : `${textClass} opacity-55`}`}>
              <Link2 className="mx-auto mb-[3px]" size={17} />{isEnglish ? "Invites" : "دعوت‌ها"}
            </button>
          )}
        </nav>

        {(error || notice) && (
          <div className={`mx-[14px] mt-[12px] rounded-xl px-[12px] py-[9px] text-[12px] ${error ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`} role={error ? "alert" : "status"}>
            {error || notice}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-[14px] py-[14px]">
          {loading ? (
            <div className={`flex items-center justify-center gap-[9px] py-[35px] text-[13px] ${mutedClass}`}>
              <LoaderCircle size={18} className="animate-spin" />{isEnglish ? "Loading..." : "در حال دریافت اطلاعات..."}
            </div>
          ) : tab === "members" ? (
            <>
              {canManage && (
                <div className="mb-[12px] flex gap-[7px]">
                  <button type="button" onClick={() => setShowBanned(false)} className={`flex-1 rounded-xl px-[10px] py-[9px] text-[12px] font-semibold ${!showBanned ? `${surfaceClass} ${accentClass}` : `${textClass} opacity-55`}`}>
                    {isEnglish ? "Active members" : "اعضای فعال"}
                  </button>
                  <button type="button" onClick={() => setShowBanned(true)} className={`flex-1 rounded-xl px-[10px] py-[9px] text-[12px] font-semibold ${showBanned ? "bg-red-500/10 text-red-400" : `${textClass} opacity-55`}`}>
                    {isEnglish ? `Banned (${bannedMembers.length}${bannedHasMore ? "+" : ""})` : `مسدودشده‌ها (${bannedMembers.length.toLocaleString("fa-IR")}${bannedHasMore ? "+" : ""})`}
                  </button>
                </div>
              )}

              {canManage && !showBanned && (
                <form onSubmit={handleAddMember} className={`mb-[14px] flex gap-[8px] rounded-[14px] p-[9px] ${surfaceClass}`}>
                  <input
                    type="tel"
                    dir="ltr"
                    value={memberPhone}
                    onChange={(event) => setMemberPhone(event.target.value)}
                    placeholder={isEnglish ? "Add by phone number" : "افزودن با شماره تلفن"}
                    className={`min-w-0 flex-1 bg-transparent px-[6px] text-[13px] outline-none ${textClass} placeholder:opacity-45`}
                  />
                  <button type="submit" disabled={busy || !memberPhone.trim()} className={`flex h-[36px] shrink-0 items-center gap-[5px] rounded-[10px] px-[10px] text-[12px] font-semibold text-white disabled:opacity-50 ${theme === "blue" ? "bg-blue-600" : "bg-red-600"}`}>
                    {busy ? <LoaderCircle size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    {isEnglish ? "Add" : "افزودن"}
                  </button>
                </form>
              )}

              {showBanned ? (
                bannedMembers.length === 0 ? (
                  <p className={`py-[24px] text-center text-[13px] ${mutedClass}`}>{isEnglish ? "No banned members." : "عضو مسدودشده‌ای وجود ندارد."}</p>
                ) : (
                  <div className="flex flex-col gap-[8px]">
                    {bannedMembers.map((member) => {
                      const person = member.user;
                      const personId = getId(person);
                      const personName = getUserName(person, language);
                      return (
                        <div key={String(member._id || personId)} className={`flex min-w-0 items-center gap-[10px] rounded-[14px] px-[10px] py-[9px] ${surfaceClass}`}>
                          <div className="flex h-[39px] w-[39px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-500/15 text-red-400">
                            {person?.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-[15px] font-semibold">{personName.charAt(0).toUpperCase()}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-[13px] font-semibold ${textClass}`}>{personName}</p>
                            <p className={`mt-[2px] truncate text-[11px] ${mutedClass}`}>{person?.username ? `@${person.username} · ` : ""}{isEnglish ? "Banned from conversation" : "از گفتگو مسدود شده است"}</p>
                          </div>
                          {(isOwner || member.role === "member") && (
                            <button type="button" disabled={busyUser === personId} onClick={() => void handleMemberRequest(member, "unban")} className="rounded-lg bg-emerald-500/10 px-[10px] py-[8px] text-[11px] font-semibold text-emerald-400 disabled:opacity-50">
                              {isEnglish ? "Unban" : "رفع مسدودیت"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              ) : activeMembers.length === 0 ? (
                <p className={`py-[24px] text-center text-[13px] ${mutedClass}`}>{isEnglish ? "No members found." : "عضوی پیدا نشد."}</p>
              ) : (
                <div className="flex flex-col gap-[8px]">
                  {activeMembers.map((member) => {
                    const person = member.user;
                    const personId = getId(person);
                    const memberRole = member.role || "member";
                    const isSelf = personId === currentUserId;
                    const manageable = canManage && !isSelf && memberRole !== "owner" && (isOwner || memberRole === "member");
                    const personName = getUserName(person, language);

                    return (
                      <div key={String(member._id || personId)} className={`flex min-w-0 items-center gap-[10px] rounded-[14px] px-[10px] py-[9px] ${surfaceClass}`}>
                        <div className={`flex h-[39px] w-[39px] shrink-0 items-center justify-center overflow-hidden rounded-full ${theme === "blue" ? "bg-blue-500/20 text-blue-300" : "bg-red-500/20 text-red-300"}`}>
                          {person?.avatar ? <img src={person.avatar} alt="" className="h-full w-full object-cover" /> : <span className="text-[15px] font-semibold">{personName.charAt(0).toUpperCase()}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`flex min-w-0 items-center gap-[6px] ${textClass}`}>
                            <span className="truncate text-[13px] font-semibold">{personName}</span>
                            {memberRole === "owner" && <Crown size={13} className="shrink-0 text-amber-400" />}
                            {memberRole === "admin" && <Shield size={13} className="shrink-0 text-emerald-400" />}
                          </div>
                          <p className={`mt-[2px] truncate text-[11px] ${mutedClass}`}>
                            {person?.username ? `@${person.username} · ` : ""}
                            {memberRole === "owner" ? (isEnglish ? "Owner" : "مالک") : memberRole === "admin" ? (isEnglish ? "Administrator" : "مدیر") : (isEnglish ? "Member" : "عضو")}
                            {member.isMuted ? (isEnglish ? " · Muted" : " · بی‌صدا") : ""}
                          </p>
                        </div>

                        {manageable && (
                          <div className="flex shrink-0 items-center gap-[3px]">
                            <button type="button" title={member.isMuted ? (isEnglish ? "Unmute" : "فعال‌کردن اعلان") : (isEnglish ? "Mute" : "بی‌صدا کردن")} disabled={busyUser === personId} onClick={() => void handleMemberRequest(member, member.isMuted ? "unmute" : "mute")} className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg ${textClass} opacity-65 hover:bg-white/10`}>
                              {member.isMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                            </button>
                            {isOwner && (
                              <button type="button" title={memberRole === "admin" ? (isEnglish ? "Demote" : "لغو مدیریت") : (isEnglish ? "Promote to admin" : "ارتقا به مدیر")} disabled={busyUser === personId} onClick={() => void handleMemberRequest(member, memberRole === "admin" ? "demote" : "promote")} className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg ${textClass} opacity-65 hover:bg-white/10`}>
                                <Shield size={15} />
                              </button>
                            )}
                            {isOwner && (
                              <button type="button" title={isEnglish ? "Transfer ownership" : "انتقال مالکیت"} disabled={busyUser === personId} onClick={() => void handleTransferOwnership(member)} className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-amber-400 hover:bg-white/10">
                                <Crown size={15} />
                              </button>
                            )}
                            <button type="button" title={isEnglish ? "Remove member" : "حذف عضو"} disabled={busyUser === personId} onClick={() => void handleMemberRequest(member, "remove")} className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-red-400 hover:bg-white/10">
                              <UserMinus size={15} />
                            </button>
                            <button type="button" title={isEnglish ? "Ban member" : "مسدودکردن عضو"} disabled={busyUser === personId} onClick={() => void handleMemberRequest(member, "ban")} className="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-red-400 hover:bg-white/10">
                              <Shield size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {!showBanned && membersHasMore && (
                <button type="button" onClick={() => void loadMoreMembers()} disabled={loadingMoreMembers} className={`mt-[12px] flex h-[40px] w-full items-center justify-center gap-[7px] rounded-xl text-[12px] font-semibold ${accentClass} ${surfaceClass} disabled:opacity-50`}>
                  {loadingMoreMembers ? <LoaderCircle size={16} className="animate-spin" /> : <Users size={16} />}
                  {isEnglish ? "Load more members" : "دریافت اعضای بیشتر"}
                </button>
              )}
              {showBanned && bannedHasMore && (
                <button type="button" onClick={() => void loadMoreBannedMembers()} disabled={loadingMoreBanned} className={`mt-[12px] flex h-[40px] w-full items-center justify-center gap-[7px] rounded-xl text-[12px] font-semibold ${accentClass} ${surfaceClass} disabled:opacity-50`}>
                  {loadingMoreBanned ? <LoaderCircle size={16} className="animate-spin" /> : <Users size={16} />}
                  {isEnglish ? "Load more banned members" : "دریافت مسدودشده‌های بیشتر"}
                </button>
              )}
            </>
          ) : tab === "settings" ? (
            <>
              <div className={`mb-[14px] flex items-center gap-[12px] rounded-[14px] p-[11px] ${surfaceClass}`}>
                <div className="h-[58px] w-[58px] shrink-0 overflow-hidden rounded-full bg-black/10">
                  {avatarPreview ? <img src={avatarPreview} alt="" className="h-full w-full object-cover" /> : <div className={`flex h-full w-full items-center justify-center ${accentClass}`}>{isChannel ? <Megaphone size={23} /> : <Users size={23} />}</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-semibold ${textClass}`}>{isEnglish ? "Conversation photo" : "تصویر گفتگو"}</p>
                  <p className={`mt-[3px] text-[10px] ${mutedClass}`}>{canManage ? (isEnglish ? "Choose a square image" : "یک تصویر مربعی انتخاب کن") : (isEnglish ? "Only administrators can change the photo" : "فقط مدیران می‌توانند تصویر را تغییر بدهند")}</p>
                  {canManage && (
                    <div className="mt-[7px] flex items-center gap-[10px]">
                      <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={busy} className={`text-[11px] font-semibold ${accentClass} disabled:opacity-50`}>{isEnglish ? "Change photo" : "تغییر تصویر"}</button>
                      {avatarPreview && <button type="button" onClick={() => void handleRemoveAvatar()} disabled={busy} className="text-[11px] font-semibold text-red-400 disabled:opacity-50">{isEnglish ? "Remove" : "حذف"}</button>}
                    </div>
                  )}
                </div>
                <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleAvatarChange} />
              </div>

              <form onSubmit={handleSaveDetails} className="flex flex-col gap-[13px]">
                <label className={`text-[12px] font-medium ${mutedClass}`}>
                  {isEnglish ? "Name" : "نام"}
                  <input disabled={!canManage} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className={`mt-[6px] h-[43px] w-full rounded-xl border border-white/10 px-[12px] text-[14px] outline-none disabled:opacity-65 ${surfaceClass} ${textClass}`} />
                </label>
                <label className={`text-[12px] font-medium ${mutedClass}`}>
                  {isEnglish ? "Description" : "توضیحات"}
                  <textarea disabled={!canManage} maxLength={500} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className={`mt-[6px] w-full resize-none rounded-xl border border-white/10 px-[12px] py-[10px] text-[13px] outline-none disabled:opacity-65 ${surfaceClass} ${textClass}`} />
                </label>

                {isChannel && (
                  <>
                    <div className={`rounded-xl p-[11px] ${surfaceClass}`}>
                      <p className={`mb-[8px] text-[12px] font-semibold ${textClass}`}>{isEnglish ? "Channel visibility" : "وضعیت کانال"}</p>
                      <div className="flex gap-[8px]">
                        <button disabled={!canManage} type="button" onClick={() => setIsPublic(true)} className={`flex-1 rounded-lg border px-[9px] py-[9px] text-[12px] font-semibold disabled:opacity-65 ${isPublic ? `${accentClass} border-current bg-white/[0.06]` : `${textClass} border-white/10 opacity-55`}`}>{isEnglish ? "Public" : "عمومی"}</button>
                        <button disabled={!canManage} type="button" onClick={() => setIsPublic(false)} className={`flex-1 rounded-lg border px-[9px] py-[9px] text-[12px] font-semibold disabled:opacity-65 ${!isPublic ? `${accentClass} border-current bg-white/[0.06]` : `${textClass} border-white/10 opacity-55`}`}>{isEnglish ? "Private" : "خصوصی"}</button>
                      </div>
                    </div>
                    {isPublic && (
                      <label className={`text-[12px] font-medium ${mutedClass}`}>
                        {isEnglish ? "Public username" : "نام کاربری عمومی"}
                        <input disabled={!canManage} dir="ltr" maxLength={32} value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} className={`mt-[6px] h-[43px] w-full rounded-xl border border-white/10 px-[12px] text-[14px] outline-none disabled:opacity-65 ${surfaceClass} ${textClass}`} />
                      </label>
                    )}
                    {isPublic && username && (
                      <div className={`rounded-xl p-[11px] ${surfaceClass}`}>
                        <div className={`flex items-center gap-[7px] text-[12px] font-semibold ${textClass}`}>
                          <Megaphone size={16} />
                          {isEnglish ? "Public channel link" : "لینک عمومی کانال"}
                        </div>
                        <button type="button" onClick={() => void copyPublicLink()} className={`mt-[8px] flex h-[38px] w-full items-center justify-center gap-[7px] rounded-lg text-[12px] font-semibold ${accentClass} bg-white/[0.06]`}>
                          <Copy size={15} />
                          {isEnglish ? "Copy public link" : "کپی لینک کانال"}
                        </button>
                        {publicLinkUrl && <p dir="ltr" className={`mt-[7px] break-all text-[10px] ${mutedClass}`}>{publicLinkUrl}</p>}
                      </div>
                    )}
                  </>
                )}

                {canManage && (
                  <button disabled={busy} type="submit" className={`mt-[3px] flex h-[42px] items-center justify-center gap-[8px] rounded-xl text-[13px] font-semibold text-white disabled:opacity-55 ${theme === "blue" ? "bg-blue-600" : "bg-red-600"}`}>
                    {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                    {isEnglish ? "Save changes" : "ذخیره تغییرات"}
                  </button>
                )}
              </form>

              <div className="mt-[20px] border-t border-white/10 pt-[15px]">
                <button type="button" onClick={() => void handleLeaveOrDelete()} disabled={busy} className="flex h-[42px] w-full items-center justify-center gap-[8px] rounded-xl bg-red-500/10 text-[13px] font-semibold text-red-400 disabled:opacity-50">
                  <Trash2 size={16} />
                  {isOwner ? (isEnglish ? "Delete conversation" : "حذف کامل گفتگو") : (isEnglish ? "Leave conversation" : "ترک گفتگو")}
                </button>
                {isOwner && (
                  <p className={`mt-[7px] text-[11px] ${mutedClass}`}>{isEnglish ? "Only the owner can permanently delete this group or channel." : "فقط مالک می‌تواند گروه یا کانال را برای همیشه حذف کند."}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={`rounded-[15px] p-[13px] ${surfaceClass}`}>
                <div className={`flex items-center gap-[8px] ${textClass}`}>
                  <Link2 size={18} />
                  <span className="text-[13px] font-semibold">{isEnglish ? "Invite link" : "لینک دعوت"}</span>
                </div>
                <p className={`mt-[6px] text-[12px] leading-[19px] ${mutedClass}`}>
                  {isEnglish ? "Create a reusable invite link for this conversation. You can revoke it later." : "یک لینک دعوت برای این گفتگو بساز؛ هر زمان خواستی می‌توانی آن را باطل کنی."}
                </p>
                <button type="button" onClick={() => void handleCreateInvite()} disabled={busy} className={`mt-[12px] flex h-[40px] w-full items-center justify-center gap-[7px] rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 ${theme === "blue" ? "bg-blue-600" : "bg-red-600"}`}>
                  {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                  {isEnglish ? "Create invite link" : "ساخت لینک دعوت"}
                </button>
                {inviteUrl && (
                  <div className="mt-[10px] flex gap-[7px]">
                    <input readOnly dir="ltr" value={inviteUrl} className={`min-w-0 flex-1 rounded-lg border border-white/10 bg-black/10 px-[9px] text-[11px] ${textClass}`} />
                    <button type="button" onClick={() => void copyInvite()} className={`flex h-[37px] w-[38px] shrink-0 items-center justify-center rounded-lg ${textClass} ${isDark ? "bg-white/10" : "bg-black/5"}`} aria-label={isEnglish ? "Copy invite link" : "کپی لینک دعوت"}><Copy size={16} /></button>
                  </div>
                )}
              </div>

              <div className="mt-[18px]">
                <h3 className={`mb-[9px] text-[13px] font-semibold ${textClass}`}>{isEnglish ? "Active invite links" : "لینک‌های دعوت فعال"}</h3>
                {invites.length === 0 ? (
                  <p className={`py-[16px] text-center text-[12px] ${mutedClass}`}>{isEnglish ? "No active invite links." : "لینک دعوت فعالی وجود ندارد."}</p>
                ) : (
                  <div className="flex flex-col gap-[8px]">
                    {invites.map((invite) => {
                      const inviteId = getId(invite._id ?? invite.id);
                      const expired = invite.expiresAt && new Date(invite.expiresAt).getTime() <= Date.now();
                      return (
                        <div key={inviteId} className={`flex items-center gap-[8px] rounded-xl px-[11px] py-[10px] ${surfaceClass}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[12px] font-semibold ${textClass}`}>{isEnglish ? `Uses: ${invite.uses || 0}${invite.maxUses ? ` / ${invite.maxUses}` : ""}` : `استفاده: ${invite.uses || 0}${invite.maxUses ? ` / ${invite.maxUses}` : ""}`}</p>
                            <p className={`mt-[2px] text-[10px] ${mutedClass}`}>{expired ? (isEnglish ? "Expired" : "منقضی‌شده") : invite.expiresAt ? new Date(invite.expiresAt).toLocaleString(isEnglish ? "en-US" : "fa-IR") : (isEnglish ? "No expiration" : "بدون تاریخ انقضا")}</p>
                          </div>
                          <button type="button" onClick={() => void handleRevokeInvite(inviteId)} className="rounded-lg p-[8px] text-red-400 hover:bg-red-500/10" title={isEnglish ? "Revoke invite" : "باطل‌کردن دعوت"}><Trash2 size={16} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-white/10 px-[15px] py-[11px]">
          <span className={`text-[11px] ${mutedClass}`}>{isEnglish ? `Your role: ${role}` : `نقش شما: ${role === "owner" ? "مالک" : role === "admin" ? "مدیر" : "عضو"}`}</span>
          <button type="button" onClick={() => void reload()} disabled={loading || busy} className={`text-[12px] font-semibold ${accentClass} disabled:opacity-50`}>{isEnglish ? "Refresh" : "به‌روزرسانی"}</button>
        </footer>
      </section>
    </div>
  );
}
