import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateJourney } from "@/hooks/useThesisJourney";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Compass, Lightbulb, Users, PenTool, Sparkles,
  ArrowRight, ArrowLeft, Check, GraduationCap, BookOpenCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import studyondLogoLight from "@/assets/studyond-light.svg";
import { fields } from "@/data";

type ThesisStage = "starting" | "has_topic" | "needs_supervisor" | "working";
type UserRole = "student" | "supervisor";

interface StageOption {
  id: ThesisStage;
  icon: React.ElementType;
  title: string;
  description: string;
}

const STAGE_OPTIONS: StageOption[] = [
  { id: "starting", icon: Compass, title: "I'm just starting", description: "No topic yet — help me explore ideas" },
  { id: "has_topic", icon: Lightbulb, title: "I have a topic", description: "I need help refining and researching" },
  { id: "needs_supervisor", icon: Users, title: "I need a supervisor", description: "Help me find the right match" },
  { id: "working", icon: PenTool, title: "I'm already working", description: "I need writing and feedback support" },
];

const ROLE_OPTIONS: { id: UserRole; icon: React.ElementType; title: string; description: string }[] = [
  { id: "student", icon: GraduationCap, title: "I'm a student", description: "Looking for topics, supervisors, and guidance" },
  { id: "supervisor", icon: BookOpenCheck, title: "I'm a supervisor", description: "Mentoring students and reviewing proposals" },
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedStage, setSelectedStage] = useState<ThesisStage | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const createJourney = useCreateJourney();

  // Steps: 1=role, 2=thesis journey (students only), 3=fields
  const [step, setStep] = useState(1);

  const totalSteps = useMemo(() => (selectedRole === "supervisor" ? 2 : 3), [selectedRole]);

  // Guard: only accessible after registration
  useEffect(() => {
    const pendingUser = localStorage.getItem("studyond-pending-user");
    if (!pendingUser) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) => {
      if (prev.includes(fieldId)) return prev.filter((id) => id !== fieldId);
      if (prev.length >= 3) return prev;
      return [...prev, fieldId];
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedRole) return;
      if (selectedRole === "supervisor") {
        // Skip thesis journey step, go to fields
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      if (!selectedStage) return;
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      if (selectedRole === "supervisor") {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(1);
    }
  };

  const handleFinish = async () => {
    if (selectedFields.length === 0) return;
    setIsSaving(true);

    // Save stage for students
    if (selectedRole === "student" && selectedStage) {
      localStorage.setItem("onboarding_stage", selectedStage);
    }

    const pendingUserStr = localStorage.getItem("studyond-pending-user");
    if (pendingUserStr) {
      try {
        const pendingUser = JSON.parse(pendingUserStr);
        const dbId = pendingUser.id;

        // Update role and fields on user_accounts
        await supabase
          .from("user_accounts")
          .update({ role: selectedRole, field_ids: selectedFields } as any)
          .eq("id", dbId);

        // Update pending user with correct role
        pendingUser.role = selectedRole;
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

  // Determine current visual step number for dots
  const currentDotIndex = useMemo(() => {
    if (step === 1) return 0;
    if (step === 2) return 1; // thesis journey (student only)
    // step === 3 (fields)
    return selectedRole === "supervisor" ? 1 : 2;
  }, [step, selectedRole]);

  const StepDots = () => (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            currentDotIndex === i ? "w-8 bg-[hsl(260,60%,55%)]" : "w-2 bg-[hsl(0,0%,30%)]"
          )}
        />
      ))}
    </div>
  );

  const canContinue = step === 1 ? !!selectedRole : step === 2 ? !!selectedStage : selectedFields.length > 0;

  return (
    <div className="min-h-screen bg-[hsl(0,0%,7%)] text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,hsl(260,60%,30%,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[800px] flex flex-col items-center animate-fade-in">
        <img src={studyondLogoLight} alt="StudyOnd" className="h-7 mb-10 opacity-60" />

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[hsl(260,50%,25%,0.4)] border border-[hsl(260,50%,40%,0.3)] mb-6">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(260,70%,70%)]" />
          <span className="text-xs font-medium text-[hsl(260,70%,75%)]">AI-Powered Thesis Assistant</span>
        </div>

        <StepDots />

        {/* ---- STEP 1: Role Selection ---- */}
        {step === 1 && (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight mb-4">
              How will you use{" "}
              <span className="bg-gradient-to-r from-[hsl(260,70%,65%)] to-[hsl(210,80%,60%)] bg-clip-text text-transparent">
                StudyOnd
              </span>
              ?
            </h1>
            <p className="text-sm sm:text-base text-[hsl(0,0%,50%)] text-center max-w-md mb-10">
              We'll personalize your experience based on your role.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-[500px] mb-10">
              {ROLE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedRole(option.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all duration-200",
                      "bg-[hsl(0,0%,11%)] hover:bg-[hsl(0,0%,14%)]",
                      isSelected
                        ? "border-[hsl(260,60%,55%)] shadow-[0_0_24px_hsl(260,60%,50%,0.15)] scale-[1.02]"
                        : "border-[hsl(0,0%,18%)] hover:border-[hsl(0,0%,28%)]"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                      isSelected ? "bg-[hsl(260,50%,25%,0.5)]" : "bg-[hsl(0,0%,16%)]"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        isSelected ? "text-[hsl(260,70%,70%)]" : "text-[hsl(0,0%,45%)]"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-semibold transition-colors duration-200",
                        isSelected ? "text-white" : "text-[hsl(0,0%,80%)]"
                      )}>{option.title}</p>
                      <p className="text-xs text-[hsl(0,0%,45%)] mt-0.5">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 h-5 w-5 rounded-full bg-[hsl(260,60%,55%)] flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleNext}
              disabled={!selectedRole}
              className={cn(
                "h-12 px-8 rounded-xl text-sm font-semibold transition-all duration-200 gap-2",
                selectedRole
                  ? "bg-gradient-to-r from-[hsl(260,60%,55%)] to-[hsl(220,70%,55%)] hover:from-[hsl(260,60%,60%)] hover:to-[hsl(220,70%,60%)] text-white shadow-[0_4px_20px_hsl(260,60%,50%,0.3)]"
                  : "bg-[hsl(0,0%,16%)] text-[hsl(0,0%,40%)] cursor-not-allowed"
              )}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>

            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-xs text-[hsl(0,0%,35%)] hover:text-[hsl(0,0%,55%)] transition-colors"
            >
              Skip for now
            </button>
          </>
        )}

        {/* ---- STEP 2: Thesis Journey (Students only) ---- */}
        {step === 2 && (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight mb-4">
              Where are you in your{" "}
              <span className="bg-gradient-to-r from-[hsl(260,70%,65%)] to-[hsl(210,80%,60%)] bg-clip-text text-transparent">
                thesis journey
              </span>
              ?
            </h1>
            <p className="text-sm sm:text-base text-[hsl(0,0%,50%)] text-center max-w-md mb-10">
              I'll tailor my guidance based on your current stage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-10">
              {STAGE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedStage === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setSelectedStage(option.id)}
                    className={cn(
                      "relative flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all duration-200",
                      "bg-[hsl(0,0%,11%)] hover:bg-[hsl(0,0%,14%)]",
                      isSelected
                        ? "border-[hsl(260,60%,55%)] shadow-[0_0_24px_hsl(260,60%,50%,0.15)] scale-[1.02]"
                        : "border-[hsl(0,0%,18%)] hover:border-[hsl(0,0%,28%)]"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                      isSelected ? "bg-[hsl(260,50%,25%,0.5)]" : "bg-[hsl(0,0%,16%)]"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        isSelected ? "text-[hsl(260,70%,70%)]" : "text-[hsl(0,0%,45%)]"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "text-sm font-semibold transition-colors duration-200",
                        isSelected ? "text-white" : "text-[hsl(0,0%,80%)]"
                      )}>{option.title}</p>
                      <p className="text-xs text-[hsl(0,0%,45%)] mt-0.5">{option.description}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 h-5 w-5 rounded-full bg-[hsl(260,60%,55%)] flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-12 px-6 rounded-xl text-sm text-[hsl(0,0%,50%)] hover:text-white hover:bg-[hsl(0,0%,15%)]"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!selectedStage}
                className={cn(
                  "h-12 px-8 rounded-xl text-sm font-semibold transition-all duration-200 gap-2",
                  selectedStage
                    ? "bg-gradient-to-r from-[hsl(260,60%,55%)] to-[hsl(220,70%,55%)] hover:from-[hsl(260,60%,60%)] hover:to-[hsl(220,70%,60%)] text-white shadow-[0_4px_20px_hsl(260,60%,50%,0.3)]"
                    : "bg-[hsl(0,0%,16%)] text-[hsl(0,0%,40%)] cursor-not-allowed"
                )}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-xs text-[hsl(0,0%,35%)] hover:text-[hsl(0,0%,55%)] transition-colors"
            >
              Skip for now
            </button>
          </>
        )}

        {/* ---- STEP 3: Field Selection ---- */}
        {step === 3 && (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold text-center leading-tight mb-4">
              What{" "}
              <span className="bg-gradient-to-r from-[hsl(260,70%,65%)] to-[hsl(210,80%,60%)] bg-clip-text text-transparent">
                fields
              </span>{" "}
              interest you?
            </h1>
            <p className="text-sm sm:text-base text-[hsl(0,0%,50%)] text-center max-w-md mb-2">
              Choose up to 3 fields to personalize your experience.
            </p>
            <p className="text-xs text-[hsl(0,0%,40%)] mb-8">
              {selectedFields.length}/3 selected
            </p>

            <div className="flex flex-wrap justify-center gap-2.5 w-full mb-10 max-w-[700px]">
              {fields.map((field) => {
                const isSelected = selectedFields.includes(field.id);
                const isDisabled = !isSelected && selectedFields.length >= 3;
                return (
                  <button
                    key={field.id}
                    onClick={() => !isDisabled && toggleField(field.id)}
                    disabled={isDisabled}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all duration-200",
                      isSelected
                        ? "bg-[hsl(260,50%,25%,0.5)] border-[hsl(260,60%,55%)] text-white shadow-[0_0_16px_hsl(260,60%,50%,0.1)]"
                        : "bg-[hsl(0,0%,11%)] border-[hsl(0,0%,18%)] text-[hsl(0,0%,70%)]",
                      !isSelected && !isDisabled && "hover:bg-[hsl(0,0%,14%)] hover:border-[hsl(0,0%,28%)]",
                      isDisabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-[hsl(260,70%,70%)]" />}
                    {field.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-12 px-6 rounded-xl text-sm text-[hsl(0,0%,50%)] hover:text-white hover:bg-[hsl(0,0%,15%)]"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back
              </Button>
              <Button
                onClick={handleFinish}
                disabled={selectedFields.length === 0 || isSaving}
                className={cn(
                  "h-12 px-8 rounded-xl text-sm font-semibold transition-all duration-200 gap-2",
                  selectedFields.length > 0
                    ? "bg-gradient-to-r from-[hsl(260,60%,55%)] to-[hsl(220,70%,55%)] hover:from-[hsl(260,60%,60%)] hover:to-[hsl(220,70%,60%)] text-white shadow-[0_4px_20px_hsl(260,60%,50%,0.3)]"
                    : "bg-[hsl(0,0%,16%)] text-[hsl(0,0%,40%)] cursor-not-allowed"
                )}
              >
                {isSaving ? "Saving…" : "Get started"}
                {!isSaving && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>

            <button
              onClick={() => navigate("/login")}
              className="mt-4 text-xs text-[hsl(0,0%,35%)] hover:text-[hsl(0,0%,55%)] transition-colors"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
