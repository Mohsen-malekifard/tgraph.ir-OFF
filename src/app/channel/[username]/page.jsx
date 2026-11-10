"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Megaphone, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function PublicChannelPage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params?.username === "string" ? params.username : "";

  const [conversation, setConversation] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`/api/conversations/public/${encodeURIComponent(username)}`);
      if (!response?.success || !response?.conversation) {
        throw new Error(response?.message || "کانال عمومی پیدا نشد.");
      }
      setConversation(response.conversation);
      setIsMember(Boolean(response.isMember));
      setIsBanned(Boolean(response.isBanned));
    } catch (loadError) {
      setError(loadError?.message || "دریافت اطلاعات کانال ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { void load(); }, [load]);

  async function handleJoin() {
    if (!username || joining) return;
    setJoining(true);
    setError("");
    try {
      const response = await apiFetch(`/api/conversations/public/${encodeURIComponent(username)}/join`, { method: "POST" });
      if (!response?.success) throw new Error(response?.message || "پیوستن به کانال ناموفق بود.");
      setIsMember(true);
      window.dispatchEvent(new Event("telegraph:conversations:refresh"));
      router.replace("/");
    } catch (joinError) {
      setError(joinError?.message || "پیوستن به کانال ناموفق بود.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#090b12] px-5 py-8 text-white">
      <section className="w-full max-w-[430px] overflow-hidden rounded-[25px] border border-white/10 bg-[#171b29] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <span className="text-[15px] font-semibold">پیش‌نمایش کانال</span>
          <button type="button" onClick={() => router.replace("/")} className="rounded-full p-2 text-white/60 hover:bg-white/10"><ArrowLeft size={19} /></button>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center"><LoaderCircle size={26} className="animate-spin text-white/60" /></div>
        ) : error ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[13px] leading-7 text-red-400">{error}</p>
            <button type="button" onClick={() => void load()} className="mt-5 rounded-xl bg-white/10 px-5 py-2.5 text-[13px]">تلاش مجدد</button>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex h-[86px] w-[86px] items-center justify-center overflow-hidden rounded-full bg-emerald-500/15 text-emerald-300">
              {conversation?.avatar ? <img src={conversation.avatar} alt="" className="h-full w-full object-cover" /> : <Megaphone size={34} />}
            </div>
            <h1 className="mt-5 text-[20px] font-semibold">{conversation?.title}</h1>
            <p className="mt-1 text-[13px] text-emerald-300">@{conversation?.username || username}</p>
            {conversation?.description && <p className="mt-4 text-[13px] leading-7 text-white/60">{conversation.description}</p>}
            <p className="mt-5 flex items-center justify-center gap-2 text-[12px] text-white/45"><Users size={15} /> کانال عمومی تلگراف</p>
            {isBanned ? (
              <p className="mt-7 rounded-xl bg-red-500/10 px-3 py-3 text-[12px] text-red-400">دسترسی حساب شما به این کانال مسدود شده است.</p>
            ) : (
              <button type="button" onClick={isMember ? () => router.replace("/") : handleJoin} disabled={joining} className="mt-7 flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-emerald-600 text-[14px] font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60">
                {joining ? <LoaderCircle size={17} className="animate-spin" /> : null}
                {isMember ? "بازکردن کانال" : "پیوستن به کانال"}
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
