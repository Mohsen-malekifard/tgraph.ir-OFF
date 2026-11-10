"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function JoinInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === "string" ? params.token : "";
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("در حال بررسی لینک دعوت...");

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function join() {
      try {
        const response = await apiFetch(`/api/conversations/invite/${encodeURIComponent(token)}/join`, {
          method: "POST",
        });

        if (cancelled) return;

        if (!response?.success || !response?.conversation) {
          throw new Error(response?.message || "لینک دعوت معتبر نیست یا دیگر قابل استفاده نیست.");
        }

        setStatus("success");
        setMessage("با موفقیت به گفتگو اضافه شدی. در حال انتقال...");
        window.dispatchEvent(new Event("telegraph:conversations:refresh"));
        window.setTimeout(() => {
          if (!cancelled) router.replace("/");
        }, 900);
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(error?.message || "پیوستن به گفتگو ناموفق بود.");
      }
    }

    // Deferring by one task avoids duplicate invite consumption in React
    // Strict Mode's development-only setup/cleanup cycle.
    const timer = window.setTimeout(() => {
      if (!cancelled) void join();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [token, router]);

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#090b12] px-5 text-white">
      <section className="w-full max-w-[390px] rounded-[24px] border border-white/10 bg-[#171b29] p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-5 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white/[0.06]">
          {status === "loading" ? <LoaderCircle className="animate-spin text-white/70" size={28} /> : status === "success" ? <CheckCircle2 className="text-emerald-400" size={30} /> : <XCircle className="text-red-400" size={30} />}
        </div>
        <h1 className="text-[19px] font-semibold">{status === "success" ? "پیوستن موفق" : status === "error" ? "لینک دعوت" : "ورود به گفتگو"}</h1>
        <p className="mt-3 text-[13px] leading-7 text-white/60">{message}</p>
        {status === "error" && (
          <button type="button" onClick={() => router.replace("/")} className="mt-6 h-[43px] w-full rounded-xl bg-white/10 text-[13px] font-semibold hover:bg-white/15">بازگشت به تلگراف</button>
        )}
      </section>
    </main>
  );
}
