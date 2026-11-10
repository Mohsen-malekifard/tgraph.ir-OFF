"use client";

import {
  createContext,
  useContext,
  useState,
} from "react";

import {
  useAuth,
} from "@/context/AuthContext";

const DataContext = createContext(null);

/*
|--------------------------------------------------------------------------
| Format Mobile Number
|--------------------------------------------------------------------------
*/

function formatMobile(phone) {
  if (
    typeof phone !== "string" ||
    !phone.trim()
  ) {
    return "";
  }

  const normalized = phone.trim();

  /*
   * Example:
   * +989945795036
   *
   * Result:
   * +98 994 579 5036
   */

  if (/^\+989\d{9}$/.test(normalized)) {
    const nationalNumber =
      normalized.slice(3);

    return (
      `+98 ${nationalNumber.slice(0, 3)} ` +
      `${nationalNumber.slice(3, 6)} ` +
      nationalNumber.slice(6)
    );
  }

  return normalized;
}

/*
|--------------------------------------------------------------------------
| Data Provider
|--------------------------------------------------------------------------
*/

export function DataProvider({ children }) {
  const auth = useAuth();

  /*
   * AuthContext must finish checking the session
   * before the application reads profile data.
   */

  const loading = auth?.loading ?? true;

  const user = auth?.user || null;

  /*
   * Profile values are derived from the
   * authenticated user's server profile.
   */

  const name =
    user?.firstName || "";

  const lastName =
    user?.lastName || "";

  const bio =
    user?.bio || "";

  const mobile =
    formatMobile(user?.phone || "");

  const userName =
    user?.username
      ? `@${user.username.replace(/^@/, "")}`
      : "";

  /*
   * Preserve the existing language state.
   */

  const [language, setLanguage] =
    useState("p");

  return (
    <DataContext.Provider
      value={{
        name,
        lastName,
        bio,
        mobile,
        userName,
        language,
        setLanguage,

        // Session/profile loading state
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

/*
|--------------------------------------------------------------------------
| Data Hook
|--------------------------------------------------------------------------
*/

export function useData() {
  const context = useContext(DataContext);

  if (context === null) {
    throw new Error(
      "useData must be used within DataProvider."
    );
  }

  return context;
}
