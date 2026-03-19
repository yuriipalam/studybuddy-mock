import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { fields, students, supervisors, getUniversity, getStudyProgram } from "@/data";
import { useAuth } from "@/contexts/AuthContext";

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

function buildProfileForAccount(accountId: string): UserProfile {
  // Try to find matching student
  const student = students.find((s) => s.id === accountId);
  if (student) {
    const uni = getUniversity(student.universityId);
    const program = getStudyProgram(student.studyProgramId);
    return {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      university: uni?.name ?? "",
      fieldIds: student.fieldIds,
      about: student.about ?? "",
      degree: student.degree,
      studyProgram: program?.name ?? "",
      startMonth: "Sep",
      startYear: "2023",
      endMonth: "",
      endYear: "",
      skills: student.skills.join(", "),
      topicSignal: student.objectives.includes("topic"),
      supervisionSignal: student.objectives.includes("supervision"),
      careerStartSignal: student.objectives.includes("career_start"),
      internship: student.objectives.includes("industry_access") ? "yes" : "open",
      profileVisible: true,
      notifyNewTopic: true,
      notifyNewJob: true,
    };
  }

  // Try to find matching supervisor
  const supervisor = supervisors.find((s) => s.id === accountId);
  if (supervisor) {
    const uni = getUniversity(supervisor.universityId);
    return {
      firstName: supervisor.firstName,
      lastName: supervisor.lastName,
      email: supervisor.email,
      university: uni?.name ?? "",
      fieldIds: supervisor.fieldIds,
      about: supervisor.about ?? "",
      degree: "phd",
      studyProgram: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      skills: supervisor.researchInterests.join(", "),
      topicSignal: false,
      supervisionSignal: supervisor.objectives.includes("student_matching"),
      careerStartSignal: false,
      internship: "no",
      profileVisible: true,
      notifyNewTopic: true,
      notifyNewJob: false,
    };
  }

  // Fallback
  return {
    firstName: "", lastName: "", email: "", university: "",
    fieldIds: [], about: "", degree: "msc", studyProgram: "",
    startMonth: "", startYear: "", endMonth: "", endYear: "",
    skills: "", topicSignal: false, supervisionSignal: false,
    careerStartSignal: false, internship: "open", profileVisible: true,
    notifyNewTopic: true, notifyNewJob: true,
  };
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  getProfileSummaryForAI: () => string;
}

const UserProfileContext = createContext<UserProfileContextType | null>(null);

const STORAGE_KEY_PREFIX = "studyond-user-profile-";

function loadProfile(accountId: string): UserProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + accountId);
    if (stored) {
      return { ...buildProfileForAccount(accountId), ...JSON.parse(stored) };
    }
  } catch {}
  return buildProfileForAccount(accountId);
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const accountId = currentUser?.id ?? "";

  const [profile, setProfile] = useState<UserProfile>(() => loadProfile(accountId));

  // Sync profile when account changes
  useEffect(() => {
    setProfile(loadProfile(accountId));
  }, [accountId]);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      if (accountId) {
        localStorage.setItem(STORAGE_KEY_PREFIX + accountId, JSON.stringify(next));
      }
      return next;
    });
  }, [accountId]);

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
    ];

    if (profile.startMonth && profile.startYear) {
      parts.push(`Start: ${profile.startMonth} ${profile.startYear}`);
    }
    if (profile.endMonth && profile.endYear) {
      parts.push(`Expected End: ${profile.endMonth} ${profile.endYear}`);
    }

    parts.push(`Fields of Interest: ${fieldNames.length > 0 ? fieldNames.join(", ") : "Not specified"}`);
    parts.push(`Skills: ${profile.skills || "Not specified"}`);
    parts.push(`About: ${profile.about || "Not provided"}`);
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
