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


async function reconcileJourney(journey: ThesisJourney, userId: string): Promise<ThesisJourney> {
  if (journey.current_stage !== "topic_selection") return journey;

  // Check if user has any submitted/accepted applications
  const { data: apps } = await supabase
    .from("topic_applications")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["submitted", "accepted"]);

  if (!apps || apps.length === 0) return journey;

  const hasAccepted = apps.some((a) => a.status === "accepted");

  const newStages = journey.stages.map((s) => {
    if (s.id === "topic_selection") return { ...s, status: "completed" as const };
    if (s.id === "supervisor_approval") {
      return { ...s, status: hasAccepted ? ("completed" as const) : ("in_progress" as const) };
    }
    if (s.id === "literature_review") {
      return { ...s, status: hasAccepted ? ("in_progress" as const) : ("up_next" as const) };
    }
    if (s.id === "research" && hasAccepted) {
      return { ...s, status: "up_next" as const };
    }
    return s;
  });

  const newCurrentStage = hasAccepted ? "literature_review" : "supervisor_approval";

  // Persist the reconciled state
  await supabase
    .from("thesis_journeys")
    .update({ current_stage: newCurrentStage, stages: newStages as any, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { ...journey, current_stage: newCurrentStage, stages: newStages };
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

        const journey = {
          ...created,
          stages: created.stages as unknown as JourneyStage[],
        } as ThesisJourney;

        return await reconcileJourney(journey, userId!);
      }

      const journey = {
        ...data,
        stages: data.stages as unknown as JourneyStage[],
      } as ThesisJourney;

      return await reconcileJourney(journey, userId!);
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
