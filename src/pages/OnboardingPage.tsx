import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateJourney } from "@/hooks/useThesisJourney";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Compass, Lightbulb, Users, PenTool, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import studyondLogoLight from "@/assets/studyond-light.svg";

type ThesisStage = "starting" | "has_topic" | "needs_supervisor" | "working";

interface StageOption {
  id: ThesisStage;
  icon: React.ElementType;
  title: string;
  description: string;
}

const STAGE_OPTIONS: StageOption[] = [
  {
    id: "starting",
    icon: Compass,
    title: "I'm just starting",
    description: "No topic yet — help me explore ideas",
  },
  {
    id: "has_topic",
    icon: Lightbulb,
    title: "I have a topic",
    description: "I need help refining and researching",
  },
  {
    id: "needs_supervisor",
    icon: Users,
    title: "I need a supervisor",
    description: "Help me find the right match",
  },
  {
    id: "working",
    icon: PenTool,
    title: "I'm already working",
    description: "I need writing and feedback support",
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<ThesisStage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const createJourney = useCreateJourney();

  // Guard: only accessible after registration
  useEffect(() => {
    const pendingUser = localStorage.getItem("studyond-pending-user");
    if (!pendingUser) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleContinue = async () => {
    if (!selected) return;
    setIsSaving(true);

    // Save to localStorage for use after login
    localStorage.setItem("onboarding_stage", selected);

    // Auto-login if we have a pending registered user
    const pendingUserStr = localStorage.getItem("studyond-pending-user");
    if (pendingUserStr) {
      try {
        const pendingUser = JSON.parse(pendingUserStr);
        localStorage.removeItem("studyond-pending-user");
        await login(pendingUser.id, [pendingUser]);
        toast.success("Great choice! Let's get started.");
        setIsSaving(false);
        navigate("/");
        return;
      } catch (e) {
        console.error("Auto-login failed:", e);
      }
    }

    toast.success("Great choice! Let's get started.");
    setIsSaving(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[hsl(0,0%,7%)] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,hsl(260,60%,30%,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[800px] flex flex-col items-center animate-fade-in">
        {/* Logo */}
        <img src={studyondLogoLight} alt="StudyOnd" className="h-7 mb-10 opacity-60" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[hsl(260,50%,25%,0.4)] border border-[hsl(260,50%,40%,0.3)] mb-6">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(260,70%,70%)]" />
          <span className="text-xs font-medium text-[hsl(260,70%,75%)]">AI-Powered Thesis Assistant</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight mb-4">
          Where are you in your{" "}
          <span className="bg-gradient-to-r from-[hsl(260,70%,65%)] to-[hsl(210,80%,60%)] bg-clip-text text-transparent">
            thesis journey
          </span>
          ?
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[hsl(0,0%,50%)] text-center max-w-md mb-10">
          I'll tailor my guidance based on your current stage. Let's get you to submission day.
        </p>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-10">
          {STAGE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;

            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={cn(
                  "relative flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all duration-200",
                  "bg-[hsl(0,0%,11%)] hover:bg-[hsl(0,0%,14%)]",
                  isSelected
                    ? "border-[hsl(260,60%,55%)] shadow-[0_0_24px_hsl(260,60%,50%,0.15)] scale-[1.02]"
                    : "border-[hsl(0,0%,18%)] hover:border-[hsl(0,0%,28%)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                    isSelected
                      ? "bg-[hsl(260,50%,25%,0.5)]"
                      : "bg-[hsl(0,0%,16%)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors duration-200",
                      isSelected ? "text-[hsl(260,70%,70%)]" : "text-[hsl(0,0%,45%)]"
                    )}
                  />
                </div>
                <div>
                  <p className={cn(
                    "text-sm font-semibold transition-colors duration-200",
                    isSelected ? "text-white" : "text-[hsl(0,0%,80%)]"
                  )}>
                    {option.title}
                  </p>
                  <p className="text-xs text-[hsl(0,0%,45%)] mt-0.5">{option.description}</p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 h-5 w-5 rounded-full bg-[hsl(260,60%,55%)] flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!selected || isSaving}
          className={cn(
            "h-12 px-8 rounded-xl text-sm font-semibold transition-all duration-200 gap-2",
            selected
              ? "bg-gradient-to-r from-[hsl(260,60%,55%)] to-[hsl(220,70%,55%)] hover:from-[hsl(260,60%,60%)] hover:to-[hsl(220,70%,60%)] text-white shadow-[0_4px_20px_hsl(260,60%,50%,0.3)]"
              : "bg-[hsl(0,0%,16%)] text-[hsl(0,0%,40%)] cursor-not-allowed"
          )}
        >
          {isSaving ? "Saving…" : "Continue"}
          {!isSaving && <ArrowRight className="h-4 w-4" />}
        </Button>

        {/* Skip link */}
        <button
          onClick={() => navigate("/login")}
          className="mt-4 text-xs text-[hsl(0,0%,35%)] hover:text-[hsl(0,0%,55%)] transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
