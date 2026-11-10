"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { OFFLINE_USER } from "@/lib/offlineData";

const AuthContext = createContext(null);

/*
 * Temporary offline demo authentication.
 * The application always uses the local demo profile and never validates,
 * refreshes, stores or sends authentication credentials.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(OFFLINE_USER);

  const updateUser = useCallback((nextUser) => {
    if (nextUser && typeof nextUser === "object") {
      setUser({ ...OFFLINE_USER, ...nextUser, id: OFFLINE_USER.id, _id: OFFLINE_USER.id });
    } else {
      setUser(OFFLINE_USER);
    }
  }, []);

  const acceptAuthResponse = useCallback((authResponse) => {
    if (authResponse?.user && typeof authResponse.user === "object") {
      updateUser(authResponse.user);
    }
    return OFFLINE_USER;
  }, [updateUser]);

  const reloadUser = useCallback(async () => {
    setUser(OFFLINE_USER);
    return OFFLINE_USER;
  }, []);

  const logout = useCallback(async () => {
    // Login/logout are intentionally disabled in the temporary demo build.
    setUser(OFFLINE_USER);
    return false;
  }, []);

  const value = {
    user,
    loading: false,
    isAuthenticated: true,
    logout,
    reloadUser,
    acceptAuthResponse,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
