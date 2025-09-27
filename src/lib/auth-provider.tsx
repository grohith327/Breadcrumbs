"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

interface AuthContextType {
  user: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  } | null;
  isLoading: boolean;
  signIn: typeof authClient.signInWithMagicLink;
  signOut: typeof authClient.signOut;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: authClient.signInWithMagicLink,
  signOut: authClient.signOut,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await authClient.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const contextValue = {
    user,
    isLoading,
    signIn: authClient.signInWithMagicLink,
    signOut: authClient.signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}