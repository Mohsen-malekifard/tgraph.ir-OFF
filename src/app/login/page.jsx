"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

import {
  apiFetch,
  setAccessToken,
} from "@/lib/api";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toEnglishDigits(value) {
  return String(value)
    .replace(/[۰-۹]/g, (digit) =>
      String(PERSIAN_DIGITS.indexOf(digit))
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(ARABIC_DIGITS.indexOf(digit))
    );
}

/*
|--------------------------------------------------------------------------
| Phone Formatting
|--------------------------------------------------------------------------
*/

function formatPhoneDigits(value) {
  let digits = toEnglishDigits(value)
    .replace(/\D/g, "");

  /*
   * پشتیبانی از شماره‌های ورودی با کد کشور.
   *
   * +989123456789
   * 989123456789
   * 00989123456789
   * 09123456789
   * 9123456789
   */

  if (digits.startsWith("0098")) {
    digits = digits.slice(4);
  } else if (
    digits.startsWith("98") &&
    digits.length >= 12
  ) {
    digits = digits.slice(2);
  }

  if (
    digits.startsWith("0") &&
    digits.length === 11
  ) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length > 6) {
    return (
      digits.slice(0, 3) +
      " " +
      digits.slice(3, 6) +
      " " +
      digits.slice(6)
    );
  }

  if (digits.length > 3) {
    return (
      digits.slice(0, 3) +
      " " +
      digits.slice(3)
    );
  }

  return digits;
}

/*
|--------------------------------------------------------------------------
| Registration Helpers
|--------------------------------------------------------------------------
*/

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidUsername(value) {
  return /^[a-z0-9_]{3,32}$/.test(value);
}

/*
|--------------------------------------------------------------------------
| Login Page
|--------------------------------------------------------------------------
*/

export default function Login() {
  const router = useRouter();

  /*
   * مراحل صفحه:
   *
   * 1. معرفی تلگراف
   * 2. شماره تلفن
   * 3. تأیید OTP
   * 4. تکمیل اطلاعات حساب کاربری
   */

  const [isPage1, setIsPage1] =
    useState(true);

  const [isPage2, setIsPage2] =
    useState(false);

  const [isPage3, setIsPage3] =
    useState(false);

  const [isPage4, setIsPage4] =
    useState(false);

  /*
   * وضعیت مراحل
   */

  const [success1, setSuccess1] =
    useState(false);

  const [success2, setSuccess2] =
    useState(false);

  const [success3, setSuccess3] =
    useState(false);

  /*
   * اطلاعات ورود
   */

  const [phone, setPhone] =
    useState("");

  const [code, setCode] =
    useState("");

  /*
   * اطلاعات ثبت‌نام
   */

  const [firstName, setFirstName] =
    useState("");

  const [lastName, setLastName] =
    useState("");

  const [username, setUsername] =
    useState("");

  /*
   * وضعیت درخواست‌ها
   */

  const [loading1, setLoading1] =
    useState(false);

  const [loading2, setLoading2] =
    useState(false);

  const [loading3, setLoading3] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * شماره تلفن استاندارد
   */

  const rawPhone = phone.replace(
    /\D/g,
    ""
  );

  const isPhoneValid =
    rawPhone.length === 10 &&
    rawPhone.startsWith("9");

  const normalizedPhone =
    isPhoneValid
      ? `+98${rawPhone}`
      : "";

  const isLoading =
    loading1 ||
    loading2 ||
    loading3;

  /*
  |--------------------------------------------------------------------------
  | Restore Authentication Flow
  |--------------------------------------------------------------------------
  |
  | اگر کاربر صفحه را در مرحله OTP یا تکمیل پروفایل
  | مجدداً باز کند، مرحله مربوطه بازیابی می‌شود.
  |
  */

  useEffect(() => {
    try {
      const registrationToken =
        sessionStorage.getItem(
          "registrationToken"
        );

      const registerPhone =
        sessionStorage.getItem(
          "registerPhone"
        );

      /*
       * کاربر قبلاً OTP را تأیید کرده و باید
       * اطلاعات حساب کاربری را تکمیل کند.
       */

      if (
        registrationToken &&
        registerPhone &&
        /^\+989\d{9}$/.test(registerPhone)
      ) {
        setPhone(
          formatPhoneDigits(
            registerPhone.slice(3)
          )
        );

        setIsPage1(false);
        setIsPage2(false);
        setIsPage3(false);
        setIsPage4(true);

        setSuccess1(true);
        setSuccess2(true);

        return;
      }

      /*
       * کاربر در مرحله ورود کد تأیید است.
       */

      const savedPhone =
        sessionStorage.getItem(
          "authPhone"
        );

      if (
        savedPhone &&
        /^\+989\d{9}$/.test(savedPhone)
      ) {
        setPhone(
          formatPhoneDigits(
            savedPhone.slice(3)
          )
        );

        setIsPage1(false);
        setIsPage2(false);
        setIsPage3(true);
        setIsPage4(false);

        setSuccess1(true);
      }
    } catch {
      /*
       * اگر Storage در دسترس نباشد،
       * صفحه ورود همچنان قابل استفاده است.
       */
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Phone Input
  |--------------------------------------------------------------------------
  */

  function handlePhoneChange(event) {
    setPhone(
      formatPhoneDigits(
        event.target.value
      )
    );

    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | OTP Input
  |--------------------------------------------------------------------------
  */

  function handleCodeChange(event) {
    const value = toEnglishDigits(
      event.target.value
    )
      .replace(/\D/g, "")
      .slice(0, 6);

    setCode(value);

    setError("");
  }

  /*
  |--------------------------------------------------------------------------
  | Send OTP
  |--------------------------------------------------------------------------
  */

  async function handleSendOtp() {
    if (
      !isPhoneValid ||
      isLoading
    ) {
      return;
    }

    setError("");

    try {
      setLoading1(true);

      const data = await apiFetch(
        "/api/auth/send-otp",
        {
          method: "POST",

          body: JSON.stringify({
            phone: normalizedPhone,
          }),
        }
      );

      if (!data?.success) {
        throw new Error(
          "ارسال کد تأیید با خطا مواجه شد."
        );
      }

      /*
       * شماره تلفن برای بازیابی مرحله OTP
       * ذخیره می‌شود.
       */

      sessionStorage.setItem(
        "authPhone",
        normalizedPhone
      );

      /*
       * توکن ثبت‌نام قبلی نباید پس از درخواست
       * کد جدید همچنان استفاده شود.
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

      setCode("");

      setSuccess1(true);
      setSuccess2(false);
      setSuccess3(false);

      setIsPage1(false);
      setIsPage2(false);
      setIsPage3(true);
      setIsPage4(false);
    } catch (error) {
      setError(
        error.message ||
          "ارسال کد تأیید انجام نشد."
      );
    } finally {
      setLoading1(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Verify OTP
  |--------------------------------------------------------------------------
  |
  | کاربر موجود:
  | Access Token دریافت می‌شود و ورود انجام می‌شود.
  |
  | کاربر جدید:
  | Registration Token دریافت می‌شود و فرم
  | تکمیل اطلاعات در همین صفحه نمایش داده می‌شود.
  |
  */

  async function handleVerifyOtp() {
    if (
      code.length !== 6 ||
      isLoading
    ) {
      return;
    }

    if (!normalizedPhone) {
      setError(
        "شماره تلفن معتبر نیست. شماره را دوباره بررسی کنید."
      );

      return;
    }

    setError("");

    try {
      setLoading2(true);

      const data = await apiFetch(
        "/api/auth/verify-otp",
        {
          method: "POST",

          body: JSON.stringify({
            phone: normalizedPhone,
            code,
          }),
        }
      );

      /*
       * کاربر جدید است.
       *
       * به‌جای انتقال به /register،
       * فرم تکمیل پروفایل در همین صفحه باز می‌شود.
       */

      if (data?.needsProfile) {
        if (
          typeof data.registrationToken !==
            "string" ||
          !data.registrationToken
        ) {
          throw new Error(
            "توکن ثبت‌نام از سرور دریافت نشد."
          );
        }

        sessionStorage.setItem(
          "registrationToken",
          data.registrationToken
        );

        sessionStorage.setItem(
          "registerPhone",
          normalizedPhone
        );

        sessionStorage.removeItem(
          "authPhone"
        );

        sessionStorage.removeItem(
          "registerCode"
        );

        setSuccess1(true);
        setSuccess2(true);
        setSuccess3(false);

        setIsPage1(false);
        setIsPage2(false);
        setIsPage3(false);
        setIsPage4(true);

        return;
      }

      /*
       * کاربر از قبل حساب کاربری دارد.
       */

      if (
        !data?.accessToken ||
        !data?.user
      ) {
        throw new Error(
          "اطلاعات ورود از سرور کامل دریافت نشد."
        );
      }

      /*
       * ذخیره Access Token در sessionStorage
       * و به‌روزرسانی توکن Socket.IO.
       */

      setAccessToken(
        data.accessToken
      );

      /*
       * پاک‌سازی اطلاعات موقت احراز هویت
       */

      sessionStorage.removeItem(
        "authPhone"
      );

      sessionStorage.removeItem(
        "registrationToken"
      );

      sessionStorage.removeItem(
        "registerPhone"
      );

      sessionStorage.removeItem(
        "registerCode"
      );

      setSuccess2(true);

      /*
       * اطلاع‌رسانی به AuthContext و سایر
       * بخش‌های فرانت‌اند.
       */

      window.dispatchEvent(
        new Event("auth:changed")
      );

      /*
       * انتقال کاربر واردشده به پیام‌رسان
       */

      router.replace("/");
    } catch (error) {
      setError(
        error.message ||
          "تأیید کد با خطا مواجه شد."
      );
    } finally {
      setLoading2(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Register New User
  |--------------------------------------------------------------------------
  |
  | این تابع در مرحله چهارم اجرا می‌شود.
  |
  | اطلاعات مورد انتظار بک‌اند:
  |
  | registrationToken
  | username
  | firstName
  | lastName
  |
  */

  async function handleRegister(event) {
    event?.preventDefault();

    if (isLoading) {
      return;
    }

    setError("");

    const cleanUsername =
      normalizeUsername(username);

    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    /*
     * اعتبارسنجی نام
     */

    if (!cleanFirstName) {
      setError(
        "لطفاً نام خود را وارد کنید."
      );

      return;
    }

    if (cleanFirstName.length > 50) {
      setError(
        "نام نمی‌تواند بیشتر از ۵۰ کاراکتر باشد."
      );

      return;
    }

    /*
     * اعتبارسنجی نام خانوادگی
     */

    if (cleanLastName.length > 50) {
      setError(
        "نام خانوادگی نمی‌تواند بیشتر از ۵۰ کاراکتر باشد."
      );

      return;
    }

    /*
     * اعتبارسنجی نام کاربری
     */

    if (!cleanUsername) {
      setError(
        "لطفاً یک نام کاربری انتخاب کنید."
      );

      return;
    }

    if (!isValidUsername(cleanUsername)) {
      setError(
        "نام کاربری باید ۳ تا ۳۲ کاراکتر و شامل حروف انگلیسی کوچک، اعداد یا زیرخط باشد."
      );

      return;
    }

    /*
     * بررسی وجود Registration Token
     */

    let registrationToken = null;

    try {
      registrationToken =
        sessionStorage.getItem(
          "registrationToken"
        );
    } catch {
      setError(
        "دسترسی به اطلاعات ثبت‌نام امکان‌پذیر نیست. دوباره تلاش کنید."
      );

      return;
    }

    if (!registrationToken) {
      setError(
        "اعتبار ثبت‌نام پیدا نشد. لطفاً شماره تلفن خود را دوباره تأیید کنید."
      );

      return;
    }

    try {
      setLoading3(true);

      /*
       * ارسال اطلاعات به API ثبت‌نام.
       *
       * توجه:
       * /api/auth/register یک endpoint بک‌اند است؛
       * نیازی به صفحه وب /register نداریم.
       */

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

      /*
       * بررسی پاسخ سرور
       */

      if (
        !data?.success ||
        typeof data.accessToken !== "string" ||
        !data.accessToken ||
        !data.user
      ) {
        throw new Error(
          "حساب کاربری ایجاد شدنی نبود یا اطلاعات ورود کامل دریافت نشد."
        );
      }

      /*
       * ثبت Access Token
       */

      setAccessToken(
        data.accessToken
      );

      /*
       * پاک‌سازی اطلاعات موقت ثبت‌نام
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
       * ثبت موفق
       */

      setSuccess3(true);

      /*
       * اطلاع‌رسانی به AuthContext
       */

      window.dispatchEvent(
        new Event("auth:changed")
      );

      /*
       * ورود مستقیم به پیام‌رسان
       */

      router.replace("/");
    } catch (error) {
      setError(
        error.message ||
          "ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید."
      );
    } finally {
      setLoading3(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Back Navigation
  |--------------------------------------------------------------------------
  */

  function handleGoBack() {
    /*
     * بازگشت از OTP به شماره تلفن
     */

    setIsPage1(false);
    setIsPage2(true);
    setIsPage3(false);
    setIsPage4(false);

    setSuccess1(false);
    setSuccess2(false);
    setSuccess3(false);

    setError("");
    setCode("");

    sessionStorage.removeItem(
      "authPhone"
    );

    sessionStorage.removeItem(
      "registrationToken"
    );

    sessionStorage.removeItem(
      "registerPhone"
    );

    sessionStorage.removeItem(
      "registerCode"
    );
  }

  function handleBackToOtp() {
    /*
     * بازگشت از تکمیل پروفایل به مرحله OTP
     */

    if (isLoading) {
      return;
    }

    setError("");

    setIsPage1(false);
    setIsPage2(false);
    setIsPage3(true);
    setIsPage4(false);

    setSuccess1(true);
    setSuccess2(false);
    setSuccess3(false);

    /*
     * با بازگشت به OTP، توکن ثبت‌نام قبلی
     * را کنار می‌گذاریم تا پس از تأیید مجدد،
     * توکن تازه‌ای دریافت شود.
     */

    sessionStorage.removeItem(
      "registrationToken"
    );

    sessionStorage.removeItem(
      "registerPhone"
    );

    sessionStorage.setItem(
      "authPhone",
      normalizedPhone
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="fixed z-10 h-screen w-full overflow-y-hidden bg-fixed bg-cover bg-center bg-[url(/background.jpg)]">
      {/* پس‌زمینه */}
      <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-[1.5px]" />

      {/* پنل احراز هویت */}
      <div className="fixed bottom-0 left-0 top-0 z-[90] w-full overflow-hidden rounded-2xl bg-[#1D202E] md:bottom-[30px] md:left-1/2 md:top-[30px] md:w-[37%] md:-translate-x-1/2">
        {/* لایه بارگذاری */}
        {isLoading && (
          <div
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60"
            role="status"
            aria-label="در حال پردازش"
          >
            <div className="h-[100px] w-[100px] animate-spin rounded-full border-[5px] border-white/10 border-r-white" />
          </div>
        )}

        {/* ===================================================== */}
        {/* صفحه اول: معرفی تلگراف */}
        {/* ===================================================== */}

        <div
          className={`absolute inset-0 flex flex-col items-center justify-between pt-[75px] pb-[75px] transition-all duration-500 ${
            !isPage1
              ? "pointer-events-none scale-125 opacity-0"
              : "scale-100 opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-[15px]">
            <div className="h-[140px] w-[140px] rounded-full bg-[url(/logo2.png)] bg-cover bg-center" />

            <div
              dir="rtl"
              className="flex flex-col items-center gap-[2.5px] text-center text-white"
            >
              <span className="text-[25px] leading-[38px] font-bold">
                تلگراف
              </span>

              <span className="whitespace-nowrap text-[15px] leading-[26px] font-semibold">
                بهترین برنامه پیام‌رسان دنیا. رایگان و امن.
              </span>
            </div>
          </div>

          <button
            type="button"
            aria-label="شروع ورود به تلگراف"
            onClick={() => {
              setIsPage1(false);
              setIsPage2(true);
              setError("");
            }}
            className="Btn cursor-pointer border-0 p-0"
          />
        </div>

        {/* ===================================================== */}
        {/* صفحه دوم: شماره تلفن */}
        {/* ===================================================== */}

        <div
          className={`absolute inset-0 flex items-center justify-center px-[40px] transition-all duration-500 ${
            isPage2
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-75 opacity-0"
          }`}
        >
          <div className="flex w-full flex-col items-center gap-[40px]">
            <div
              dir="rtl"
              className="flex flex-col items-center text-center leading-[25px]"
            >
              <span className="text-[17px] font-bold text-white">
                شماره تلفن شما
              </span>

              <span className="text-[12.5px] font-medium text-gray-400">
                لطفاً شماره تلفن خود را وارد کنید.
              </span>
            </div>

            <div className="relative box-border flex h-[50px] w-full items-center rounded-xl border-[2px] border-[#55aef7] bg-[#1D202E] px-[15px]">
              <label className="absolute -top-[10px] right-[10px] whitespace-nowrap bg-[#1D202E] px-[5px] text-[15px] leading-[1.2] font-medium text-[#55aef7]">
                شماره تلفن
              </label>

              <div className="flex h-full w-full items-center">
                <span
                  dir="ltr"
                  className="shrink-0 text-[15px] leading-none font-normal text-white"
                >
                  +98
                </span>

                <span className="ml-[20px] mr-[20px] h-[25px] w-[2px] shrink-0 rounded-full bg-[#4b4b4b]" />

                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={handlePhoneChange}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      isPhoneValid
                    ) {
                      event.preventDefault();

                      void handleSendOtp();
                    }
                  }}
                  placeholder="000 000 0000"
                  maxLength={12}
                  disabled={isLoading}
                  aria-label="شماره تلفن"
                  className="min-w-0 w-full border-none bg-transparent p-0 text-[16px] font-normal text-white outline-none placeholder:text-[#666]"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="absolute right-[30px] bottom-[112px] left-[30px] text-center text-[12px] leading-5 text-red-400"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={!isPhoneValid || isLoading}
              onClick={handleSendOtp}
              aria-label="ارسال کد تأیید"
              className={`absolute right-[40px] bottom-[40px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-blue-500 text-white transition-all duration-300 disabled:cursor-not-allowed ${
                isPhoneValid
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-75 opacity-0"
              }`}
            >
              <ArrowRight size={22} />
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* صفحه سوم: تأیید کد OTP */}
        {/* ===================================================== */}

        <div
          className={`absolute inset-0 flex items-center justify-center px-[40px] transition-all duration-500 ${
            isPage3
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-75 opacity-0"
          }`}
        >
          <div className="flex w-full flex-col items-center gap-[40px]">
            <div
              dir="rtl"
              className="flex flex-col items-center text-center leading-[25px]"
            >
              <span className="text-[17px] font-bold text-white">
                کد تأیید ارسال شده
              </span>

              <span className="text-[12.5px] font-medium text-gray-400">
                کد ارسال‌شده به شماره{" "}

                <span
                  dir="ltr"
                  className="font-semibold text-gray-300 underline decoration-indigo-500 decoration-3 underline-offset-[2.5px]"
                >
                  +98 {phone}
                </span>{" "}

                را وارد کنید.
              </span>
            </div>

            <div className="relative box-border flex h-[50px] w-full items-center rounded-xl border-[2px] border-[#55aef7] bg-[#1D202E] px-[15px]">
              <label className="absolute -top-[10px] right-[10px] whitespace-nowrap bg-[#1D202E] px-[5px] text-[15px] leading-[1.2] font-medium text-[#55aef7]">
                کد تأیید
              </label>

              <div className="flex h-full w-full items-center">
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  dir="ltr"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      code.length === 6
                    ) {
                      event.preventDefault();

                      void handleVerifyOtp();
                    }
                  }}
                  placeholder="000000"
                  maxLength={6}
                  disabled={isLoading}
                  aria-label="کد تأیید"
                  className="min-w-0 w-full border-none bg-transparent p-0 text-[16px] font-normal text-white outline-none placeholder:text-[#666]"
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="absolute right-[30px] bottom-[112px] left-[30px] text-center text-[12px] leading-5 text-red-400"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={code.length !== 6 || isLoading}
              onClick={handleVerifyOtp}
              className={`absolute right-[40px] bottom-[40px] flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-300 ${
                code.length === 6 && !isLoading
                  ? "bg-blue-500 text-white"
                  : "pointer-events-none bg-gray-500 text-gray-400"
              }`}
            >
              <span className="text-[17px] font-semibold">
                تأیید
              </span>
            </button>

            <button
              type="button"
              onClick={handleGoBack}
              disabled={isLoading}
              aria-label="بازگشت به شماره تلفن"
              className="absolute bottom-[40px] left-[40px] flex h-[60px] w-[60px] items-center justify-center rounded-full bg-blue-500 text-white transition-all duration-300"
            >
              <ArrowLeft />
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* صفحه چهارم: تکمیل اطلاعات حساب کاربری */}
        {/* ===================================================== */}

        <div
          className={`absolute inset-0 flex items-center justify-center overflow-y-auto px-[30px] pt-[90px] pb-[100px] transition-all duration-500 ${
            isPage4
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-75 opacity-0"
          }`}
        >
          <div
            dir="rtl"
            className="my-auto flex w-full max-w-[420px] flex-col items-center gap-[25px]"
          >
            {/* عنوان */}

            <div className="flex flex-col items-center gap-[8px] text-center">
              <span className="text-[19px] font-bold text-white">
                تکمیل حساب کاربری
              </span>

              <span className="text-[12.5px] leading-[24px] font-medium text-gray-400">
                شماره تلفن شما تأیید شد. اطلاعات خود را وارد کنید.
              </span>

              <span
                dir="ltr"
                className="text-[13px] font-semibold text-gray-300"
              >
                +98 {phone}
              </span>
            </div>

            {/* فرم ثبت‌نام */}

            <form
              onSubmit={handleRegister}
              className="flex w-full flex-col gap-[20px]"
            >
              {/* نام */}

              <div className="relative box-border flex h-[50px] w-full items-center rounded-xl border-[1.5px] border-[#55aef7] bg-[#1D202E] px-[15px] transition-colors focus-within:border-blue-400">
                <label className="absolute -top-[10px] right-[10px] whitespace-nowrap bg-[#1D202E] px-[5px] text-[13px] leading-[1.2] font-medium text-[#55aef7]">
                  نام
                </label>

                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(
                      event.target.value
                    );

                    setError("");
                  }}
                  maxLength={50}
                  required
                  disabled={isLoading}
                  placeholder="نام خود را وارد کنید"
                  aria-label="نام"
                  className="w-full min-w-0 border-none bg-transparent p-0 text-[14px] text-white outline-none placeholder:text-[#666]"
                />
              </div>

              {/* نام خانوادگی */}

              <div className="relative box-border flex h-[50px] w-full items-center rounded-xl border-[1.5px] border-[#55aef7] bg-[#1D202E] px-[15px] transition-colors focus-within:border-blue-400">
                <label className="absolute -top-[10px] right-[10px] whitespace-nowrap bg-[#1D202E] px-[5px] text-[13px] leading-[1.2] font-medium text-[#55aef7]">
                  نام خانوادگی
                </label>

                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(
                      event.target.value
                    );

                    setError("");
                  }}
                  maxLength={50}
                  disabled={isLoading}
                  placeholder="نام خانوادگی خود را وارد کنید"
                  aria-label="نام خانوادگی"
                  className="w-full min-w-0 border-none bg-transparent p-0 text-[14px] text-white outline-none placeholder:text-[#666]"
                />
              </div>

              {/* نام کاربری */}

              <div className="relative box-border flex h-[50px] w-full items-center rounded-xl border-[1.5px] border-[#55aef7] bg-[#1D202E] px-[15px] transition-colors focus-within:border-blue-400">
                <label className="absolute -top-[10px] right-[10px] whitespace-nowrap bg-[#1D202E] px-[5px] text-[13px] leading-[1.2] font-medium text-[#55aef7]">
                  نام کاربری
                </label>

                <span
                  dir="ltr"
                  className="shrink-0 text-[15px] text-gray-400"
                >
                  @
                </span>

                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  dir="ltr"
                  value={username}
                  onChange={(event) => {
                    const value =
                      event.target.value
                        .toLowerCase()
                        .replace(
                          /[^a-z0-9_]/g,
                          ""
                        )
                        .slice(0, 32);

                    setUsername(value);

                    setError("");
                  }}
                  minLength={3}
                  maxLength={32}
                  required
                  disabled={isLoading}
                  placeholder="mohsen_dev"
                  aria-label="نام کاربری"
                  className="w-full min-w-0 border-none bg-transparent p-0 text-[14px] text-white outline-none placeholder:text-[#666]"
                />
              </div>

              {/* راهنمای نام کاربری */}

              <p className="-mt-[12px] text-right text-[11px] leading-[20px] text-gray-500">
                نام کاربری باید حداقل ۳ کاراکتر باشد و فقط از حروف انگلیسی کوچک، اعداد و زیرخط (_) تشکیل شود.
              </p>

              {/* پیام خطا */}

              {error && (
                <p
                  role="alert"
                  className="-mt-[8px] text-center text-[12px] leading-[22px] text-red-400"
                >
                  {error}
                </p>
              )}

              {/* ثبت‌نام */}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  !firstName.trim() ||
                  !isValidUsername(
                    normalizeUsername(username)
                  )
                }
                className="flex h-[52px] w-full items-center justify-center gap-[10px] rounded-xl bg-blue-500 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-300"
              >
                {loading3 ? (
                  <>
                    <span className="h-[17px] w-[17px] animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    <span>
                      در حال ساخت حساب...
                    </span>
                  </>
                ) : (
                  <>
                    <Check size={18} />

                    <span>
                      ساخت حساب کاربری
                    </span>
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[11px] leading-[21px] text-gray-500">
              با ساخت حساب، می‌توانید وارد تلگراف شوید و گفتگوهای خود را آغاز کنید.
            </p>
          </div>

          {/* بازگشت به مرحله OTP */}

          <button
            type="button"
            onClick={handleBackToOtp}
            disabled={isLoading}
            aria-label="بازگشت به تأیید کد"
            className="absolute bottom-[22px] left-[25px] flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* ===================================================== */}
        {/* نشانگر مراحل */}
        {/* ===================================================== */}

        <div className="absolute top-[20px] left-0 z-[95] flex w-full items-center justify-center px-[35px]">
          <div className="flex w-full max-w-[290px] items-center">
            {/* مرحله ۱ */}

            <div
              className={`z-10 flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border-[2.5px] font-semibold transition-all duration-300 ${
                success1
                  ? "border-solid border-indigo-500 bg-indigo-500 text-white"
                  : isPage2
                    ? "border-solid border-indigo-500 text-indigo-500"
                    : "border-dotted border-gray-500 text-gray-500"
              }`}
            >
              {success1 ? <Check size={19} /> : "1"}
            </div>

            {/* اتصال مرحله ۱ به ۲ */}

            <div
              className={`h-[2px] flex-1 transition-colors duration-300 ${
                success1 || isPage3 || isPage4
                  ? "bg-indigo-500"
                  : "bg-gray-500"
              }`}
            />

            {/* مرحله ۲ */}

            <div
              className={`z-10 flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border-[2.5px] font-semibold transition-all duration-300 ${
                success2
                  ? "border-solid border-indigo-500 bg-indigo-500 text-white"
                  : isPage3
                    ? "border-solid border-indigo-500 text-indigo-500"
                    : "border-dotted border-gray-500 text-gray-500"
              }`}
            >
              {success2 ? <Check size={19} /> : "2"}
            </div>

            {/* اتصال مرحله ۲ به ۳ */}

            <div
              className={`h-[2px] flex-1 transition-colors duration-300 ${
                success2 || isPage4
                  ? "bg-indigo-500"
                  : "bg-gray-500"
              }`}
            />

            {/* مرحله ۳ */}

            <div
              className={`z-10 flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full border-[2.5px] font-semibold transition-all duration-300 ${
                success3
                  ? "border-solid border-indigo-500 bg-indigo-500 text-white"
                  : isPage4
                    ? "border-solid border-indigo-500 text-indigo-500"
                    : "border-dotted border-gray-500 text-gray-500"
              }`}
            >
              {success3 ? <Check size={19} /> : "3"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
