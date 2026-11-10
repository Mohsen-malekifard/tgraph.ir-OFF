"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useData } from "@/context/DataContext";

/* ------------------------------------------------------------------ */
/* Avatar colors                                                       */
/* ------------------------------------------------------------------ */

// Used by the chat screens (bg-conic-180). Keep untouched.
export const AVATAR_COLORS = [
  "from-blue-600 via-blue-50 to-blue-600",
  "from-red-600 via-red-50 to-red-600",
  "from-purple-600 via-purple-50 to-purple-600",
  "from-green-600 via-green-50 to-green-600",
  "from-orange-600 via-orange-50 to-orange-600",
  "from-pink-600 via-pink-50 to-pink-600",
  "from-cyan-600 via-cyan-50 to-cyan-600",
];

// Same order as AVATAR_COLORS. Used for the contact list avatars.
export const AVATAR_GRADIENTS = [
  "from-[#72d5fd] to-[#2a9ef1]",
  "from-[#ff885e] to-[#ff516a]",
  "from-[#b694ff] to-[#7a5af8]",
  "from-[#a0de7e] to-[#54cb68]",
  "from-[#ffcd6a] to-[#ffa85c]",
  "from-[#e0a2f3] to-[#d669ed]",
  "from-[#53edd6] to-[#28c9b7]",
];

/* ------------------------------------------------------------------ */
/* Theme palette                                                       */
/* ------------------------------------------------------------------ */

export function getPalette(theme, isDark) {
  const isBlue = theme === "blue";

  return {
    header: isDark ? (isBlue ? "bg-[#212641]" : "bg-[#310a0a]") : "",
    raised: isDark ? (isBlue ? "bg-[#282c3f]" : "bg-[#252525]") : "",
    sheet: isDark
      ? isBlue
        ? "bg-[#282c3f]"
        : "bg-[#252525]"
      : isBlue
        ? "bg-[#dceaff]"
        : "bg-[#ffe0e0]",
    pageHex: isDark
      ? isBlue
        ? "#212641"
        : "#310a0a"
      : isBlue
        ? "#dceaff"
        : "#ffe0e0",
    accentText: isBlue ? "text-[#7f8df2]" : "text-[#ff8f8f]",
    accentBorder: isBlue ? "border-[#7f8df2]" : "border-[#ff8f8f]",
    accentFill: isBlue ? "bg-[#4f7df0]" : "bg-[#d93636]",
    accentGradient: isBlue
      ? "from-[#8ea6ff] to-[#6173e6]"
      : "from-[#ff8f8f] to-[#d94b4b]",
  };
}

/* ------------------------------------------------------------------ */
/* Digits and phone numbers                                            */
/* ------------------------------------------------------------------ */

export function normalizeDigits(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizePhone(phone) {
  if (typeof phone !== "string" || !phone.trim()) {
    return "";
  }

  const original = normalizeDigits(phone).trim();

  let cleaned = original.replace(/[^\d+]/g, "");

  if (!cleaned) {
    return "";
  }

  if (cleaned.startsWith("00")) {
    cleaned = `+${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");

    return digits ? `+${digits}` : "";
  }

  const digits = cleaned.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  // Iranian number with country code.
  if (digits.startsWith("98") && digits.length === 12) {
    return `+${digits}`;
  }

  // Iranian mobile number starting with zero.
  if (digits.startsWith("0") && digits.length === 11) {
    return `+98${digits.slice(1)}`;
  }

  // Iranian mobile number without leading zero.
  if (digits.length === 10 && digits.startsWith("9")) {
    return `+98${digits}`;
  }

  // Preserve other international phone numbers.
  return original;
}

export function getPhoneKey(phone) {
  return normalizePhone(phone).replace(/\D/g, "");
}

function getHash(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

export function getAvatarColor(value) {
  return AVATAR_COLORS[getHash(value) % AVATAR_COLORS.length];
}

export function getAvatarGradient(value) {
  return AVATAR_GRADIENTS[getHash(value) % AVATAR_GRADIENTS.length];
}

export function getContactInitials(title) {
  const words = String(title || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const letters = words
    .map((word) => (word.match(/[\p{L}\p{N}]/u) || [""])[0])
    .filter(Boolean);

  if (letters.length === 0) {
    return "#";
  }

  const first = letters[0];
  const last = letters.length > 1 ? letters[letters.length - 1] : "";

  return `${first}${last}`.toLocaleUpperCase();
}

export function getContactStorageKey(phone) {
  const accountKey = getPhoneKey(phone);

  if (!accountKey) {
    return "telegraph_manual_contacts_v1_default";
  }

  return `telegraph_manual_contacts_v1_${getHash(accountKey)}`;
}

/* ------------------------------------------------------------------ */
/* Last seen                                                           */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const date = new Date(value < 1e12 ? value * 1000 : value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/*
| `lastSeen` can be a date (ISO string / timestamp / Date) or one of:
| "online" | "recently" | "within_week" | "within_month" | "long_ago".
| Returns "" when the value is unknown.
*/
export function formatLastSeen(lastSeen, language = "english") {
  const isEnglish = language === "english";

  if (lastSeen === undefined || lastSeen === null || lastSeen === "") {
    return "";
  }

  if (lastSeen === "online") {
    return isEnglish ? "online" : "آنلاین";
  }

  if (lastSeen === "recently") {
    return isEnglish ? "last seen recently" : "آخرین بازدید به‌تازگی";
  }

  if (lastSeen === "within_week") {
    return isEnglish
      ? "last seen within a week"
      : "آخرین بازدید در یک هفتهٔ اخیر";
  }

  if (lastSeen === "within_month") {
    return isEnglish
      ? "last seen within a month"
      : "آخرین بازدید در یک ماه اخیر";
  }

  if (lastSeen === "long_ago") {
    return isEnglish
      ? "last seen a long time ago"
      : "آخرین بازدید خیلی وقت پیش";
  }

  const date = toDate(lastSeen);

  if (!date) {
    return "";
  }

  const now = new Date();

  const startOfDay = (value) =>
    new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate()
    ).getTime();

  const dayDiff = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86400000
  );

  const time = isEnglish
    ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
    : new Intl.DateTimeFormat("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);

  if (dayDiff <= 0) {
    return isEnglish
      ? `last seen at ${time}`
      : `آخرین بازدید ساعت ${time}`;
  }

  if (dayDiff === 1) {
    return isEnglish
      ? `last seen yesterday at ${time}`
      : `آخرین بازدید دیروز ساعت ${time}`;
  }

  const sameYear = date.getFullYear() === now.getFullYear();

  let day;

  if (isEnglish) {
    day = sameYear
      ? `${MONTHS[date.getMonth()]} ${pad(date.getDate())}`
      : `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${String(
          date.getFullYear()
        ).slice(-2)}`;
  } else {
    day = sameYear
      ? new Intl.DateTimeFormat("fa-IR", {
          month: "short",
          day: "2-digit",
        }).format(date)
      : new Intl.DateTimeFormat("fa-IR", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        }).format(date);
  }

  return isEnglish
    ? `last seen ${day} at ${time}`
    : `آخرین بازدید ${day} ساعت ${time}`;
}

export function getLastSeenValue(lastSeen) {
  const day = 86400000;

  if (lastSeen === "online") return Number.MAX_SAFE_INTEGER;
  if (lastSeen === "recently") return Date.now() - day;
  if (lastSeen === "within_week") return Date.now() - 5 * day;
  if (lastSeen === "within_month") return Date.now() - 20 * day;
  if (lastSeen === "long_ago") return 0;

  const date = toDate(lastSeen);

  return date ? date.getTime() : -1;
}

/*
| mode "lastSeen": newest first; contacts without last-seen data keep
| their original order after the others.
| mode "name": alphabetical.
*/
export function sortContacts(contacts, mode, language) {
  if (mode === "name") {
    const locale = language === "english" ? "en" : "fa";

    return [...contacts].sort((first, second) =>
      String(first.title || "").localeCompare(
        String(second.title || ""),
        locale
      )
    );
  }

  return contacts
    .map((item, index) => ({
      item,
      index,
      value: getLastSeenValue(item.lastSeen),
    }))
    .sort(
      (first, second) =>
        second.value - first.value || first.index - second.index
    )
    .map((entry) => entry.item);
}

/* ------------------------------------------------------------------ */
/* Error messages                                                      */
/* ------------------------------------------------------------------ */

export function getContactErrorMessage(code, language) {
  const isEnglish = language === "english";

  if (code === "NATIVE_PLATFORM_REQUIRED") {
    return isEnglish
      ? "Reading all device contacts requires the native Android app."
      : "برای نمایش تمام مخاطبین، تلگراف باید در نسخهٔ بومی اندروید اجرا شود.";
  }

  if (code === "NATIVE_BRIDGE_UNAVAILABLE") {
    return isEnglish
      ? "The Android contacts bridge is unavailable. Please update the app."
      : "رابط دسترسی به مخاطبین در نسخه فعلی اندروید فعال نیست. برنامه را به نسخه جدید ارتقا بده.";
  }

  if (code === "NATIVE_BRIDGE_TIMEOUT") {
    return isEnglish
      ? "The Android contacts request timed out. Please try again."
      : "درخواست دریافت مخاطبین بیش از حد طول کشید. دوباره تلاش کن.";
  }

  if (code === "CONTACT_PERMISSION_DENIED") {
    return isEnglish
      ? "Contact permission was denied. Allow contact access in the app settings."
      : "مجوز مخاطبین داده نشد. دسترسی مخاطبین را در تنظیمات برنامه فعال کن.";
  }

  return isEnglish
    ? "Could not load device contacts. Please check the contact permission and try again."
    : "دریافت مخاطبین ناموفق بود. مجوز مخاطبین را بررسی کن.";
}

/* ------------------------------------------------------------------ */
/* Native Android WebView bridge                                       */
/* ------------------------------------------------------------------ */

let nativeRequestCounter = 0;

function getNativeContactsBridge() {
  if (typeof window === "undefined") {
    return null;
  }

  const bridge = window.TelegraphNativeContacts;

  if (
    !bridge ||
    typeof bridge.postMessage !== "function" ||
    typeof bridge.addEventListener !== "function" ||
    typeof bridge.removeEventListener !== "function"
  ) {
    return null;
  }

  return bridge;
}

function requestNativeContacts(action, payload = {}) {
  const bridge = getNativeContactsBridge();

  if (!bridge) {
    return Promise.reject(
      new Error(
        typeof window === "undefined"
          ? "NATIVE_PLATFORM_REQUIRED"
          : "NATIVE_BRIDGE_UNAVAILABLE"
      )
    );
  }

  const requestId = `${Date.now()}_${++nativeRequestCounter}`;

  return new Promise((resolve, reject) => {
    let timeoutId = null;

    const cleanup = () => {
      bridge.removeEventListener("message", handleMessage);

      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };

    const handleMessage = (event) => {
      let response;

      try {
        response = JSON.parse(event.data);
      } catch {
        return;
      }

      if (response?.requestId !== requestId) {
        return;
      }

      cleanup();

      if (response.ok) {
        resolve(response);
      } else {
        reject(
          new Error(response.code || "CONTACTS_LOAD_FAILED")
        );
      }
    };

    bridge.addEventListener("message", handleMessage);

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("NATIVE_BRIDGE_TIMEOUT"));
    }, 30000);

    try {
      bridge.postMessage(
        JSON.stringify({
          requestId,
          action,
          ...payload,
        })
      );
    } catch (error) {
      cleanup();
      reject(new Error("NATIVE_BRIDGE_UNAVAILABLE"));
    }
  });
}

/* ------------------------------------------------------------------ */
/* Device contacts                                                     */
/* ------------------------------------------------------------------ */

let deviceContactsCache = null;

async function readDeviceContacts() {
  const result = await requestNativeContacts("getContacts");

  const allDeviceContacts = Array.isArray(result.contacts)
    ? result.contacts
    : [];

  const importedContacts = [];

  const seenPhoneNumbers = new Set();

  for (const contact of allDeviceContacts) {
    const contactName =
      contact.displayName ||
      contact.fullName ||
      [contact.givenName, contact.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();

    const phoneNumbers = Array.isArray(contact.phoneNumbers)
      ? contact.phoneNumbers
      : [];

    for (const phoneEntry of phoneNumbers) {
      const originalMobile =
        phoneEntry?.value || phoneEntry?.number || "";

      const mobile = normalizePhone(originalMobile);

      const phoneKey = getPhoneKey(mobile);

      if (!mobile || !phoneKey) {
        continue;
      }

      if (seenPhoneNumbers.has(phoneKey)) {
        continue;
      }

      seenPhoneNumbers.add(phoneKey);

      importedContacts.push({
        title: contactName || mobile,
        category: "Pv",
        mobile,
        colorClasses: getAvatarColor(phoneKey),
        contactId: contact.id,
        isManual: false,
      });
    }
  }

  return importedContacts;
}

/*
| Best-effort: saves a contact to the phone's address book.
| Never throws; returns true on success.
*/
export async function saveContactToDevice({
  firstName,
  lastName,
  mobile,
}) {
  try {
    await requestNativeContacts("createContact", {
      firstName,
      lastName,
      mobile,
    });

    return true;
  } catch (error) {
    console.error(
      "Failed to save contact to the device:",
      error
    );

    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Contacts hook (device + manually created contacts)                  */
/* ------------------------------------------------------------------ */

export function useContacts() {
  const { mobile: currentUserMobile } = useData();

  const storageKey = getContactStorageKey(currentUserMobile);

  const [deviceContacts, setDeviceContacts] = useState(
    deviceContactsCache || []
  );

  const [manualContacts, setManualContacts] = useState([]);

  const [loadedKey, setLoadedKey] = useState("");

  const [loading, setLoading] = useState(deviceContactsCache === null);

  const [errorCode, setErrorCode] = useState("");

  const [reloadKey, setReloadKey] = useState(0);

  /* Load manually created contacts */

  useEffect(() => {
    try {
      const storedContacts = localStorage.getItem(storageKey);

      const parsedContacts = storedContacts ? JSON.parse(storedContacts) : [];

      setManualContacts(
        Array.isArray(parsedContacts)
          ? parsedContacts.filter(
              (item) =>
                item &&
                typeof item.title === "string" &&
                typeof item.mobile === "string"
            )
          : []
      );
    } catch (error) {
      console.error("Failed to load saved contacts:", error);

      setManualContacts([]);
    }

    setLoadedKey(storageKey);
  }, [storageKey]);

  /* Save manually created contacts */

  useEffect(() => {
    if (loadedKey !== storageKey) {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(manualContacts));
    } catch (error) {
      console.error("Failed to save contacts:", error);
    }
  }, [manualContacts, loadedKey, storageKey]);

  /* Load device contacts. A successful result is cached in memory. */

  useEffect(() => {
    if (deviceContactsCache !== null) {
      setDeviceContacts(deviceContactsCache);
      setLoading(false);
      setErrorCode("");
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorCode("");

      try {
        const imported = await readDeviceContacts();

        deviceContactsCache = imported;

        if (!cancelled) {
          setDeviceContacts(imported);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load device contacts:", error);

        setErrorCode(
          error?.message === "NATIVE_PLATFORM_REQUIRED" ||
            error?.message === "NATIVE_BRIDGE_UNAVAILABLE" ||
            error?.message === "NATIVE_BRIDGE_TIMEOUT" ||
            error?.message === "CONTACT_PERMISSION_DENIED"
            ? error.message
            : "CONTACTS_LOAD_FAILED"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const contacts = useMemo(() => {
    const combined = [];

    const seen = new Set();

    for (const item of [...manualContacts, ...deviceContacts]) {
      const mobile = normalizePhone(item.mobile);

      const phoneKey = getPhoneKey(mobile);

      if (!mobile || !phoneKey || seen.has(phoneKey)) {
        continue;
      }

      seen.add(phoneKey);

      combined.push({
        ...item,
        mobile,
        colorClasses: item.colorClasses || getAvatarColor(phoneKey),
      });
    }

    return combined;
  }, [manualContacts, deviceContacts]);

  const addContact = useCallback((contact) => {
    setManualContacts((previous) => [contact, ...previous]);
  }, []);

  const refreshContacts = useCallback(() => {
    deviceContactsCache = null;
    setDeviceContacts([]);
    setErrorCode("");
    setReloadKey((previous) => previous + 1);
  }, []);

  return {
    contacts,
    loading,
    errorCode,
    addContact,
    refreshContacts,
  };
}
