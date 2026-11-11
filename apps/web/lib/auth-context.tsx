"use client";

import type { AuthUserDto } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "./api-client";
import { createClient } from "./supabase/client";

export interface RegisterResult {
  requiresEmailConfirmation: boolean;
}

interface AuthContextValue {
  user: AuthUserDto | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<RegisterResult | void>;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUserDto(user: User): AuthUserDto {
  return {
    id: user.id,
    email: user.email ?? "",
    emailVerified: Boolean(user.email_confirmed_at),
    createdAt: user.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function initUser() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!cancelled && currentUser) {
          setUser(toAuthUserDto(currentUser));
        }
      } catch {
        // No valid session
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(toAuthUserDto(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new ApiError(error.status ?? 401, error.message);
      }
      if (data.user) {
        setUser(toAuthUserDto(data.user));
      }
    },
    [supabase]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<RegisterResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/onboarding`,
        },
      });
      if (error) {
        throw new ApiError(error.status ?? 400, error.message);
      }

      // Supabase returns an empty identities array when email confirmation is on
      // and an account already exists for the given email.
      if (
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0
      ) {
        throw new ApiError(
          409,
          "An account with this email already exists. Try logging in."
        );
      }

      if (data.session && data.user) {
        setUser(toAuthUserDto(data.user));
        return { requiresEmailConfirmation: false };
      }

      return { requiresEmailConfirmation: true };
    },
    [supabase]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser) {
      setUser(toAuthUserDto(currentUser));
    } else {
      setUser(null);
    }
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
