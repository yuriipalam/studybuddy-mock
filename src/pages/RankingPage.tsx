import { useState } from "react";
import { Flame, Trophy, Shield, ArrowUp, ArrowDown, Gift, ChevronRight, CheckCircle, Zap, FileText, UserPlus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type RankingTab = "my-status" | "global" | "institute";

const tabs: { id: RankingTab; label: string; icon: React.ElementType }[] = [
  { id: "my-status", label: "My Status", icon: Flame },
  { id: "global", label: "Global Ranking", icon: Trophy },
  { id: "institute", label: "Institute Ranking", icon: Shield },
];

const RankingPage = () => {
  const [activeTab, setActiveTab] = useState<RankingTab>("my-status");

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "my-status" && (
        <div className="flex flex-col gap-6">
          {/* Hero points card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(260,60%,22%)] via-[hsl(240,50%,20%)] to-[hsl(220,55%,18%)] p-8 shadow-xl">
            <div className="flex items-center justify-between">
              {/* Left side */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Total Points
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-white">1,250</span>
                  <span className="text-lg font-medium text-white/60">XP</span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <ArrowUp className="h-3 w-3" />
                    +195 this week
                  </span>
                  <span className="text-sm text-white/40">Rank #39 globally</span>
                </div>
              </div>
              {/* Right side trophy */}
              <Trophy className="h-28 w-28 text-white/10" strokeWidth={1} />
            </div>
          </div>

          {/* Next step card */}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[hsl(260,60%,22%)]/10">
              <Gift className="h-5 w-5 text-[hsl(260,55%,50%)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Next Step: Earn +200 XP</p>
              <p className="text-xs text-muted-foreground">Invite your mentor or professor to unlock bonus points.</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-foreground">
              +200 XP
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      )}

      {activeTab === "global" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
          <Trophy className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Global Ranking</h1>
          <p className="text-muted-foreground">Global leaderboard will appear here.</p>
        </div>
      )}

      {activeTab === "institute" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Institute Ranking</h1>
          <p className="text-muted-foreground">Institute leaderboard will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default RankingPage;
