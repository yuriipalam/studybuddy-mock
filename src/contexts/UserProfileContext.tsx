import React, { createContext, useContext, useState, useCallback } from "react";
import { fields } from "@/data";

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  fieldIds: string[];
  about: string;
  degree: string;
  studyProgram: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  skills: string;
  topicSignal: boolean;
  supervisionSignal: boolean;
  careerStartSignal: boolean;
  internship: string;
  profileVisible: boolean;
  notifyNewTopic: boolean;
  notifyNewJob: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  firstName: "Luca",
  lastName: "Meier",
  email: "luca.meier@student.ethz.ch",
  university: "ETH Zurich",
  fieldIds: ["field-02"],
  about: "",
  degree: "msc",
  studyProgram: "Computer Science",
  startMonth: "Sep",
  startYear: "2023",
  endMonth: "",
  endYear: "",
  skills: "Python, machine learning, distributed systems, Kubernetes",
  topicSignal: true,
  supervisionSignal: true,
  careerStartSignal: true,
  internship: "yes",
  profileVisible: true,
  notifyNewTopic: true,
  notifyNewJob: true,
};

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  /** Returns a text summary suitable for sending to the AI agent */
  getProfileSummaryForAI: () => string;
}

const UserProfileContext = createContext<UserProfileContextType | null>(null);

const STORAGE_KEY = "studyond-user-profile";

function loadProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(loadProfile);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const getProfileSummaryForAI = useCallback(() => {
    const fieldNames = profile.fieldIds
      .map((id) => fields.find((f) => f.id === id)?.name)
      .filter(Boolean);

    const degreeLabel = profile.degree === "bsc" ? "Bachelor" : profile.degree === "msc" ? "Master" : "PhD";
    const internshipLabel =
      profile.internship === "yes" ? "Definitely wants an internship" :
      profile.internship === "open" ? "Open to an internship" : "Does not want an internship";

    const signals: string[] = [];
    if (profile.topicSignal) signals.push("Looking for a thesis topic");
    if (profile.supervisionSignal) signals.push("Looking for academic supervision");
    if (profile.careerStartSignal) signals.push("Looking for a career start / job");

    const parts = [
      `Name: ${profile.firstName} ${profile.lastName}`,
      `Email: ${profile.email}`,
      `University: ${profile.university}`,
      `Degree: ${degreeLabel}`,
      `Study Program: ${profile.studyProgram}`,
      `Start: ${profile.startMonth} ${profile.startYear}`,
    ];

    if (profile.endMonth && profile.endYear) {
      parts.push(`Expected End: ${profile.endMonth} ${profile.endYear}`);
    }

    parts.push(`Fields of Interest: ${fieldNames.length > 0 ? fieldNames.join(", ") : "Not specified"}`);
    parts.push(`Skills: ${profile.skills || "Not specified"}`);
    parts.push(`About: ${profile.about || "Not provided (profile is incomplete)"}`);
    parts.push(`Signals: ${signals.length > 0 ? signals.join(", ") : "None active"}`);
    parts.push(`Internship Preference: ${internshipLabel}`);
    parts.push(`Profile Visibility: ${profile.profileVisible ? "Visible" : "Hidden"}`);

    return parts.join("\n");
  }, [profile]);

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, getProfileSummaryForAI }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within UserProfileProvider");
  return ctx;
}
