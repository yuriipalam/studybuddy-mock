import React, { createContext, useContext, useState, useCallback } from "react";

export type AccountRole = "student" | "supervisor";

export interface AuthAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AccountRole;
  avatar: string;
}

export const PREDEFINED_ACCOUNTS: AuthAccount[] = [
  {
    id: "student-01",
    firstName: "Luca",
    lastName: "Meier",
    email: "luca.meier@student.ethz.ch",
    role: "student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luca",
  },
  {
    id: "student-02",
    firstName: "Sarah",
    lastName: "Brunner",
    email: "sarah.brunner@student.ethz.ch",
    role: "student",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    id: "supervisor-01",
    firstName: "Martin",
    lastName: "Vechev",
    email: "martin.vechev@ethz.ch",
    role: "supervisor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Martin",
  },
];

interface AuthContextType {
  currentUser: AuthAccount | null;
  login: (accountId: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "studyond-auth-user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return PREDEFINED_ACCOUNTS.find((a) => a.id === parsed.id) || null;
      }
    } catch {}
    return null;
  });

  const login = useCallback((accountId: string) => {
    const account = PREDEFINED_ACCOUNTS.find((a) => a.id === accountId);
    if (account) {
      setCurrentUser(account);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ id: account.id }));
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated: !!currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
