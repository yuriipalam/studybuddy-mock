import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type XpCategory = "profile" | "referrals" | "supervisor" | "research";

export interface XpTrigger {
  action: string;
  xp: number;
  category: XpCategory;
  title: string;
}

// Predefined XP triggers
export const XP_TRIGGERS = {
  PROFILE_COMPLETION: { action: "profile_completion", xp: 50, category: "profile" as XpCategory, title: "Profile Completed!" },
  STUDENT_REFERRAL: { action: "student_referral", xp: 100, category: "referrals" as XpCategory, title: "Student Referred!" },
  MENTOR_REFERRAL: { action: "mentor_referral", xp: 250, category: "referrals" as XpCategory, title: "Mentor Referred!" },
  SUBMIT_TOPIC: { action: "submit_topic", xp: 40, category: "research" as XpCategory, title: "Topic Submitted!" },
  SUPERVISOR_INTERACTION: { action: "supervisor_interaction", xp: 30, category: "supervisor" as XpCategory, title: "Supervisor Interaction!" },
  LINK_EXTERNAL_THESIS: { action: "link_external_thesis", xp: 1000, category: "research" as XpCategory, title: "External Thesis Linked!" },
  THESIS_SUBMISSION: { action: "thesis_submission", xp: 1000, category: "research" as XpCategory, title: "Thesis Submitted!" },
  UNANSWERED_MENTOR_MSG: { action: "unanswered_mentor_msg", xp: -20, category: "supervisor" as XpCategory, title: "Unanswered Mentor Message" },
} as const;

const categoryToColumn: Record<XpCategory, keyof StudentXpUpsert> = {
  profile: "xp_profile",
  referrals: "xp_referrals",
  supervisor: "xp_supervisor",
  research: "xp_research",
};

type StudentXpUpsert = {
  student_id: string;
  university_id: string;
  total_xp: number;
  xp_supervisor: number;
  xp_research: number;
  xp_referrals: number;
  xp_profile: number;
  rank_change?: number;
  updated_at: string;
};

const DEFAULT_UNIVERSITY_ID = "uni-01";

export function useXpEngine() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const awardXp = useCallback(async (trigger: XpTrigger, targetUserId?: string) => {
    const userId = targetUserId || currentUser?.id;
    if (!userId) return;
    const isPositive = trigger.xp > 0;

    try {
      await supabase.from("xp_activity_log").insert({
        user_id: userId,
        action: trigger.action,
        xp_amount: trigger.xp,
        category: trigger.category,
      });

      await supabase.from("notifications").insert({
        user_id: userId,
        title: `${isPositive ? "+" : ""}${trigger.xp} XP: ${trigger.title}`,
        description: trigger.action.replace(/_/g, " "),
        xp_amount: trigger.xp,
        type: isPositive ? "success" : "warning",
      });

      const colName = categoryToColumn[trigger.category];
      const { data: existing, error: existingError } = await supabase
        .from("student_xp")
        .select("*")
        .eq("student_id", userId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        const currentCategoryXp = existing[colName] ?? 0;
        const newCategoryXp = Math.max(0, currentCategoryXp + trigger.xp);
        const newTotal = Math.max(0, existing.total_xp + trigger.xp);

        const { error: updateError } = await supabase
          .from("student_xp")
          .update({
            [colName]: newCategoryXp,
            total_xp: newTotal,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      } else {
        const baseRow: StudentXpUpsert = {
          student_id: userId,
          university_id: DEFAULT_UNIVERSITY_ID,
          total_xp: Math.max(0, trigger.xp),
          xp_supervisor: 0,
          xp_research: 0,
          xp_referrals: 0,
          xp_profile: 0,
          rank_change: 0,
          updated_at: new Date().toISOString(),
        };

        baseRow[colName] = Math.max(0, trigger.xp);

        const { error: insertError } = await supabase.from("student_xp").insert(baseRow);
        if (insertError) throw insertError;
      }

      queryClient.invalidateQueries({ queryKey: ["student_xp"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["xp_activity"] });

      const isOwnXp = userId === currentUser?.id;
      if (isOwnXp) {
        if (isPositive) {
          toast.success(`+${trigger.xp} XP: ${trigger.title}`, {
            style: { background: "hsl(142, 71%, 45%)", color: "white", border: "none" },
          });
        } else {
          toast.error(`${trigger.xp} XP: ${trigger.title}`, {
            style: { background: "hsl(0, 84%, 60%)", color: "white", border: "none" },
          });
        }
      }
    } catch (err) {
      console.error("XP engine error:", err);
    }
  }, [currentUser, queryClient]);

  return { awardXp };
}
