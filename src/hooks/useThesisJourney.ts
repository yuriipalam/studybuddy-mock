import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface JourneyStage {
  id: string;
  label: string;
  status: "completed" | "in_progress" | "up_next" | "locked";
}

export interface ThesisJourney {
  id: string;
  user_id: string;
  current_stage: string;
  stages: JourneyStage[];
  created_at: string;
  updated_at: string;
}

export function useThesisJourney() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  return useQuery({
    queryKey: ["thesis-journey", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("thesis_journeys")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();

      if (error) throw error;

      // Auto-create a default journey for new users
      if (!data) {
        const defaultStages = buildStagesFromOnboarding("starting");
        const currentStage = defaultStages.find((s) => s.status === "in_progress")?.id ?? "topic_selection";

        const { data: created, error: createError } = await supabase
          .from("thesis_journeys")
          .insert({
            user_id: userId!,
            current_stage: currentStage,
            stages: defaultStages as any,
          })
          .select()
          .single();

        if (createError) throw createError;

        return {
          ...created,
          stages: created.stages as unknown as JourneyStage[],
        } as ThesisJourney;
      }

      return {
        ...data,
        stages: data.stages as unknown as JourneyStage[],
      } as ThesisJourney;
    },
  });
}

export function useCreateJourney() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, onboardingStage }: { userId: string; onboardingStage: string }) => {
      const stages = buildStagesFromOnboarding(onboardingStage);
      const currentStage = stages.find((s) => s.status === "in_progress")?.id ?? "topic_selection";

      const { data, error } = await supabase
        .from("thesis_journeys")
        .upsert({
          user_id: userId,
          current_stage: currentStage,
          stages: stages as any,
        }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["thesis-journey", vars.userId] });
    },
  });
}

function buildStagesFromOnboarding(selection: string): JourneyStage[] {
  const allStages: JourneyStage[] = [
    { id: "topic_selection", label: "Topic Selection", status: "locked" },
    { id: "supervisor_approval", label: "Supervisor Approval", status: "locked" },
    { id: "literature_review", label: "Literature Review", status: "locked" },
    { id: "research", label: "Research", status: "locked" },
    { id: "writing", label: "Writing", status: "locked" },
    { id: "submission", label: "Submission", status: "locked" },
  ];

  let currentIndex = 0;
  switch (selection) {
    case "starting":
      currentIndex = 0;
      break;
    case "has_topic":
    case "needs_supervisor":
      currentIndex = 1;
      break;
    case "working":
      currentIndex = 3;
      break;
    default:
      currentIndex = 0;
  }

  return allStages.map((stage, i) => {
    if (i < currentIndex) return { ...stage, status: "completed" as const };
    if (i === currentIndex) return { ...stage, status: "in_progress" as const };
    if (i === currentIndex + 1) return { ...stage, status: "up_next" as const };
    return stage;
  });
}
