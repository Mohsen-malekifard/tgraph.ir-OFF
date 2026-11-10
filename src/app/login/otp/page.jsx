"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function OtpPage() {
  const router = useRouter();

  const [phone, setPhone] =
    useState("");

  const [code, setCode] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const savedPhone =
      sessionStorage.getItem(
        "authPhone"
      );

    if (!savedPhone) {
      router.replace("/login");
      return;
    }

    setPhone(savedPhone);
  }, [router]);

  async function handleVerify(e) {
    e.preventDefault();

    setError("");

    if (!code.trim()) {
      setError("کد را وارد کنید");
      return;
    }

    try {
      setLoading(true);

      const data =
        await apiFetch(
          "/api/auth/verify-otp",
          {
            method: "POST",
            body: JSON.stringify({
              phone,
              code,
            }),
          }
        );

      if (data.needsProfile) {
        sessionStorage.setItem(
  "registerPhone",
  phone
);

sessionStorage.setItem(
  "registerCode",
  code
);

router.push("/register");

        return;
      }

      if (data.accessToken) {
        sessionStorage.setItem(
          "accessToken",
          data.accessToken
        );
      }

      sessionStorage.removeItem(
        "authPhone"
      );

      router.push(
        "/messenger"
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleVerify}
        className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <div>
          <h1 className="text-3xl font-bold">
            تأیید شماره
          </h1>

          <p className="mt-2 text-white/50">
            کد ارسال‌شده را وارد کنید
          </p>
        </div>

        <input
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value.replace(
                /\D/g,
                ""
              )
            )
          }
          placeholder="123456"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none"
        />

        {error && (
          <p className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading
            ? "در حال بررسی..."
            : "تأیید"}
        </button>
      </form>
    </main>
  );
}