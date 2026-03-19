import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { X, Lightbulb, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const IDLE_THRESHOLD = 20; // seconds before showing advice
const COOLDOWN = 120; // seconds between advice nudges
const DISMISS_DURATION = 8000; // auto-hide after 8s

export default function FloatingAdvice() {
  const { currentUser } = useAuth();
  const { profile } = useUserProfile();
  const location = useLocation();

  const [advice, setAdvice] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cooldownRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleSecondsRef = useRef(0);

  // Only show for students
  if (currentUser?.role !== "student") return null;

  const fetchAdvice = useCallback(async () => {
    if (cooldownRef.current || loading) return;

    setLoading(true);
    cooldownRef.current = true;

    try {
      const userProfile = profile
        ? `Name: ${profile.firstName} ${profile.lastName}, Fields: ${profile.fields?.join(", ") || "not set"}, Skills: ${profile.skills?.join(", ") || "not set"}, About: ${profile.about || "not set"}`
        : undefined;

      const { data, error } = await supabase.functions.invoke("thesis-advice", {
        body: {
          currentPage: location.pathname,
          userProfile,
          idleSeconds: idleSecondsRef.current,
        },
      });

      if (error) throw error;

      if (data?.advice) {
        setAdvice(data.advice);
        setVisible(true);
        setDismissed(false);

        // Auto-dismiss
        dismissTimerRef.current = setTimeout(() => {
          setVisible(false);
        }, DISMISS_DURATION);
      }
    } catch (e) {
      console.error("Advice fetch failed:", e);
    } finally {
      setLoading(false);
      setTimeout(() => {
        cooldownRef.current = false;
      }, COOLDOWN * 1000);
    }
  }, [location.pathname, profile, loading]);

  // Reset idle timer on activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    idleSecondsRef.current = 0;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      idleSecondsRef.current = IDLE_THRESHOLD;
      if (!cooldownRef.current && !visible) {
        fetchAdvice();
      }
    }, IDLE_THRESHOLD * 1000);
  }, [fetchAdvice, visible]);

  // Attach activity listeners
  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Reset on page change
  useEffect(() => {
    setVisible(false);
    setAdvice(null);
    cooldownRef.current = false;
    resetIdleTimer();
  }, [location.pathname]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  const handleRefresh = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    cooldownRef.current = false;
    fetchAdvice();
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-500 ease-out",
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      )}
    >
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4 relative overflow-hidden">
        {/* Accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">Thesis Buddy</p>
            <p className="text-sm text-foreground leading-relaxed">{advice}</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={handleRefresh}
              className={cn(
                "p-1 rounded-md hover:bg-muted transition-colors",
                loading && "animate-spin"
              )}
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
