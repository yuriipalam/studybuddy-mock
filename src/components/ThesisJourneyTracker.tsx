import { Check, Lock, Circle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { JourneyStage } from "@/hooks/useThesisJourney";

const STAGE_ACTIONS: Record<string, { title: string; description: string; path: string }> = {
  topic_selection: {
    title: "Next: Find your thesis topic",
    description: "Explore AI-powered suggestions based on your profile and interests",
    path: "/topics",
  },
  supervisor_approval: {
    title: "Next: Get supervisor approval",
    description: "3 potential matches found based on your research area",
    path: "/people/supervisors",
  },
  literature_review: {
    title: "Next: Start your literature review",
    description: "Organize and analyze relevant research papers",
    path: "/projects",
  },
  research: {
    title: "Next: Begin your research",
    description: "Track milestones and stay on schedule with your methodology",
    path: "/projects",
  },
  writing: {
    title: "Next: Start writing your thesis",
    description: "Get AI-powered writing assistance and feedback",
    path: "/projects",
  },
  submission: {
    title: "Next: Prepare for submission",
    description: "Final checks, formatting, and submission preparation",
    path: "/projects",
  },
};

function getStatusConfig(status: JourneyStage["status"]) {
  switch (status) {
    case "completed":
      return {
        icon: Check,
        dotClass: "bg-emerald-500 text-white",
        lineClass: "bg-emerald-500",
        labelClass: "text-emerald-600 dark:text-emerald-400",
        statusText: "Completed",
      };
    case "in_progress":
      return {
        icon: Circle,
        dotClass: "bg-[hsl(260,60%,55%)] text-white ring-4 ring-[hsl(260,60%,55%,0.2)]",
        lineClass: "bg-border",
        labelClass: "text-foreground font-semibold",
        statusText: "In progress",
      };
    case "up_next":
      return {
        icon: Circle,
        dotClass: "bg-muted border-2 border-border text-muted-foreground",
        lineClass: "bg-border",
        labelClass: "text-muted-foreground",
        statusText: "Up next",
      };
    case "locked":
      return {
        icon: Lock,
        dotClass: "bg-muted text-muted-foreground/50",
        lineClass: "bg-border",
        labelClass: "text-muted-foreground/50",
        statusText: "Locked",
      };
  }
}

export function ThesisJourneyTracker({ stages, currentStage }: { stages: JourneyStage[]; currentStage: string }) {
  const navigate = useNavigate();
  const currentStageData = stages.find((s) => s.id === currentStage);
  const action = STAGE_ACTIONS[currentStage];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Thesis Journey</h2>
        {currentStageData && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[hsl(260,50%,25%,0.15)] text-[hsl(260,60%,55%)] border border-[hsl(260,50%,40%,0.2)]">
            <Circle className="h-2 w-2 fill-current" />
            Current: {currentStageData.label}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start">
          {stages.map((stage, i) => {
            const config = getStatusConfig(stage.status);
            const Icon = config.icon;
            const isLast = i === stages.length - 1;

            return (
              <div key={stage.id} className={cn("flex items-start", isLast ? "flex-shrink-0" : "flex-1")}>
                {/* Step dot + label */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300",
                      config.dotClass
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={stage.status === "completed" ? 3 : 2} />
                  </div>
                  <p className={cn("text-[12.5px] mt-2 text-center max-w-[90px] leading-tight", config.labelClass)}>
                    {stage.label}
                  </p>
                  <p className={cn(
                    "text-[7.5px] mt-0.5",
                    stage.status === "in_progress" ? "text-[hsl(260,60%,55%)]" :
                    stage.status === "completed" ? "text-emerald-500" :
                    "text-muted-foreground/40"
                  )}>
                    {config.statusText}
                  </p>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-1 flex items-center pt-4 px-1.5">
                    <div
                      className={cn(
                        "h-0.5 w-full rounded-full transition-all duration-500",
                        config.lineClass
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action card */}
      {action && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4 group hover:border-[hsl(260,50%,40%,0.3)] transition-colors">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(260,50%,25%,0.12)]">
            <Sparkles className="h-5 w-5 text-[hsl(260,60%,55%)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{action.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(action.path)}
            className="shrink-0 gap-1.5 bg-[hsl(260,60%,55%)] hover:bg-[hsl(260,60%,60%)] text-white"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
