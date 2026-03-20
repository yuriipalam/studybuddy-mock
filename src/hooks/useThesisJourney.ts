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
  if (["research", "writing", "submission"].includes(journey.current_stage)) {
    return journey;
  }

  const rawUserId = userId.startsWith("db-") ? userId.slice(3) : userId;
  const relatedUserIds = Array.from(new Set([rawUserId, `db-${rawUserId}`]));

  const { data: apps } = await supabase
    .from("topic_applications")
    .select("status")
    .in("user_id", relatedUserIds)
    .in("status", ["submitted", "accepted"]);

  if (!apps || apps.length === 0) return journey;

  const hasAccepted = apps.some((a) => a.status === "accepted");
  const nextStage = hasAccepted ? "literature_review" : "supervisor_approval";

  const labels = {
    topic_selection: journey.stages.find((s) => s.id === "topic_selection")?.label ?? "Topic Selection",
    supervisor_approval: journey.stages.find((s) => s.id === "supervisor_approval")?.label ?? "Supervisor Approval",
    literature_review: journey.stages.find((s) => s.id === "literature_review")?.label ?? "Literature Review",
    research: journey.stages.find((s) => s.id === "research")?.label ?? "Research",
    writing: journey.stages.find((s) => s.id === "writing")?.label ?? "Writing",
    submission: journey.stages.find((s) => s.id === "submission")?.label ?? "Submission",
  };

  const newStages: JourneyStage[] = [
    { id: "topic_selection", label: labels.topic_selection, status: "completed" },
    { id: "supervisor_approval", label: labels.supervisor_approval, status: hasAccepted ? "completed" : "in_progress" },
    { id: "literature_review", label: labels.literature_review, status: hasAccepted ? "in_progress" : "up_next" },
    { id: "research", label: labels.research, status: hasAccepted ? "up_next" : "locked" },
    { id: "writing", label: labels.writing, status: "locked" },
    { id: "submission", label: labels.submission, status: "locked" },
  ];

  await supabase
    .from("thesis_journeys")
    .update({ current_stage: nextStage, stages: newStages as any, updated_at: new Date().toISOString() })
    .in("user_id", relatedUserIds);

  return { ...journey, current_stage: nextStage, stages: newStages };
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
