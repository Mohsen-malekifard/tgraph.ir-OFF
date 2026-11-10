"use client";

import {
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  apiFetch,
  setAccessToken,
} from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [registrationToken, setRegistrationToken] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checkingRegistration, setCheckingRegistration] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const savedToken =
      sessionStorage.getItem(
        "registrationToken"
      );

    const savedPhone =
      sessionStorage.getItem(
        "registerPhone"
      );

    /*
     * ثبت‌نام فقط پس از تأیید موفق OTP
     * و دریافت Registration Token مجاز است.
     */
    if (!savedToken) {
      router.replace("/login");

      setCheckingRegistration(false);

      return;
    }

    setRegistrationToken(savedToken);

    setPhone(savedPhone || "");

    setCheckingRegistration(false);
  }, [router]);

  function handleUsernameChange(event) {
    const value = event.target.value
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase()
      .slice(0, 32);

    setUsername(value);

    setError("");
  }

  async function handleRegister(event) {
    event.preventDefault();

    setError("");

    if (checkingRegistration) {
      return;
    }

    if (!registrationToken) {
      setError(
        "اعتبار ثبت‌نام موجود نیست. شماره تلفن خود را دوباره تأیید کنید."
      );

      router.replace("/login");

      return;
    }

    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanUsername =
      username.trim().toLowerCase();

    if (
      !cleanFirstName ||
      cleanFirstName.length > 50
    ) {
      setError(
        "نام باید بین ۱ تا ۵۰ کاراکتر باشد."
      );

      return;
    }

    if (cleanLastName.length > 50) {
      setError(
        "نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد."
      );

      return;
    }

    if (
      !/^[a-z0-9_]{3,32}$/.test(
        cleanUsername
      )
    ) {
      setError(
        "نام کاربری باید بین ۳ تا ۳۲ کاراکتر و شامل حروف انگلیسی، عدد یا _ باشد."
      );

      return;
    }

    try {
      setLoading(true);

      const data = await apiFetch(
        "/api/auth/register",
        {
          method: "POST",

          body: JSON.stringify({
            registrationToken,

            username: cleanUsername,

            firstName: cleanFirstName,

            lastName: cleanLastName,
          }),
        }
      );

      if (!data?.accessToken) {
        throw new Error(
          "ثبت‌نام انجام شد، اما توکن ورود از سرور دریافت نشد."
        );
      }

      /*
       * ذخیره Access Token و هماهنگی
       * با اتصال احتمالی Socket.IO.
       */
      setAccessToken(data.accessToken);

      /*
       * پاک‌کردن اطلاعات موقت احراز هویت.
       */
      sessionStorage.removeItem(
        "registrationToken"
      );

      sessionStorage.removeItem(
        "registerPhone"
      );

      sessionStorage.removeItem(
        "registerCode"
      );

      sessionStorage.removeItem(
        "authPhone"
      );

      /*
       * اطلاع‌رسانی به AuthProvider برای
       * دریافت وضعیت جدید کاربر.
       */
      window.dispatchEvent(
        new Event("auth:changed")
      );

      router.replace("/");
    } catch (error) {
      setError(
        error.message ||
          "ثبت‌نام با خطا مواجه شد."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-black px-4 text-white"
    >
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            ساخت حساب
          </h1>

          <p className="mt-2 text-white/50">
            اطلاعات پروفایل خود را وارد کنید
          </p>

          {phone && (
            <p
              dir="ltr"
              className="mt-3 text-left text-sm text-white/60"
            >
              {phone}
            </p>
          )}
        </div>

        <input
          required
          type="text"
          autoComplete="given-name"
          maxLength={50}
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value);

            setError("");
          }}
          placeholder="نام"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-colors focus:border-white/30"
        />

        <input
          type="text"
          autoComplete="family-name"
          maxLength={50}
          value={lastName}
          onChange={(event) => {
            setLastName(event.target.value);

            setError("");
          }}
          placeholder="نام خانوادگی"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition-colors focus:border-white/30"
        />

        <input
          required
          type="text"
          dir="ltr"
          autoComplete="username"
          minLength={3}
          maxLength={32}
          value={username}
          onChange={handleUsernameChange}
          placeholder="Username"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left outline-none transition-colors focus:border-white/30"
        />

        <p className="text-xs text-white/40">
          فقط حروف انگلیسی، اعداد و _ مجاز هستند.
        </p>

        {error && (
          <p
            role="alert"
            className="text-sm leading-6 text-red-400"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={
            loading ||
            checkingRegistration
          }
          className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkingRegistration
            ? "در حال بررسی..."
            : loading
              ? "در حال ساخت حساب..."
              : "ساخت حساب"}
        </button>
      </form>
    </main>
  );
}
