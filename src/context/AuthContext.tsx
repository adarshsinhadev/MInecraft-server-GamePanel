"use client";

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiClientError, getCurrentUser, login as apiLogin, logout as apiLogout } from "@/lib/api";

type AuthStatus = "checking" | "loading" | "authenticated" | "unauthenticated" | "error";

interface LoginCredentials {
  userId: string;
  password: string;
  secretKey: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
}

interface CurrentUserResponse {
  success: boolean;
  authenticated: boolean;
}

interface AuthContextValue {
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const refreshAuth = useCallback(async () => {
    setStatus("checking");
    setError(null);

    try {
      const result = await getCurrentUser<CurrentUserResponse>();
      if (result?.authenticated === true) {
        setStatus("authenticated");
      } else if (result?.authenticated === false) {
        setStatus("unauthenticated");
      } else {
        throw new Error("The authentication service returned an unexpected session response.");
      }
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        setStatus("unauthenticated");
        return;
      }
      setError(getMessage(cause, "Could not verify your session."));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setStatus("loading");
    setError(null);

    try {
      const result = await apiLogin<LoginCredentials, LoginResponse>(credentials);
      if (result?.success !== true) {
        throw new Error(result?.message || "Login was unsuccessful.");
      }

      // Verify the session cookie was accepted before unlocking dashboard routes.
      const session = await getCurrentUser<CurrentUserResponse>();
      if (session?.authenticated !== true) {
        setStatus("unauthenticated");
        throw new Error("Login completed, but the server did not confirm an authenticated session.");
      }
      setStatus("authenticated");
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        setStatus("unauthenticated");
      } else if (cause instanceof ApiClientError && cause.status === 0) {
        setStatus("error");
      } else {
        setStatus("unauthenticated");
      }
      const message = getMessage(cause, "Unable to sign in.");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await apiLogout();
      setStatus("unauthenticated");
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 401) {
        // The session has already expired, so the user is effectively signed out.
        setStatus("unauthenticated");
        return;
      }
      const message = getMessage(cause, "Unable to sign out. Please try again.");
      setError(message);
      throw new Error(message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isAuthenticated: status === "authenticated",
      isLoading: status === "checking" || status === "loading",
      error,
      login,
      logout,
      refreshAuth,
      clearError,
    }),
    [status, error, login, logout, refreshAuth, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
