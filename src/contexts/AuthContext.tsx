import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  login: (accountId: string, accounts?: AuthAccount[]) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "studyond-auth-user";

function buildStagesFromOnboarding(selection: string) {
  const allStages = [
    { id: "topic_selection", label: "Topic Selection", status: "locked" },
    { id: "supervisor_approval", label: "Supervisor Approval", status: "locked" },
    { id: "literature_review", label: "Literature Review", status: "locked" },
    { id: "research", label: "Research", status: "locked" },
    { id: "writing", label: "Writing", status: "locked" },
    { id: "submission", label: "Submission", status: "locked" },
  ];
  let ci = 0;
  if (selection === "has_topic" || selection === "needs_supervisor") ci = 1;
  else if (selection === "working") ci = 3;
  return allStages.map((s, i) => ({
    ...s,
    status: i < ci ? "completed" : i === ci ? "in_progress" : i === ci + 1 ? "up_next" : "locked",
  }));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Store DB accounts so we can restore on refresh
  const [dbAccounts, setDbAccounts] = useState<AuthAccount[]>(() => {
    try {
      const stored = localStorage.getItem("studyond-db-accounts");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const allAccounts = [...PREDEFINED_ACCOUNTS, ...(() => {
          try { return JSON.parse(localStorage.getItem("studyond-db-accounts") || "[]"); } catch { return []; }
        })()];
        return allAccounts.find((a: AuthAccount) => a.id === parsed.id) || null;
      }
    } catch {}
    return null;
  });

  const login = useCallback(async (accountId: string) => {
    const account = PREDEFINED_ACCOUNTS.find((a) => a.id === accountId);
    if (account) {
      setCurrentUser(account);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ id: account.id }));

      // Check if there's a pending onboarding stage to save
      const onboardingStage = localStorage.getItem("onboarding_stage");
      if (onboardingStage && account.role === "student") {
        try {
          const stages = buildStagesFromOnboarding(onboardingStage);
          const currentStage = stages.find((s: any) => s.status === "in_progress")?.id ?? "topic_selection";
          await supabase.from("thesis_journeys").upsert({
            user_id: account.id,
            current_stage: currentStage,
            stages: stages as any,
          }, { onConflict: "user_id" });
          localStorage.removeItem("onboarding_stage");
        } catch (e) {
          console.error("Failed to save journey:", e);
        }
      }
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
