import { useState } from "react";
import { Flame, Trophy, Shield } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        {activeTab === "my-status" && (
          <>
            <Flame className="h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-bold">My Status</h1>
            <p className="text-muted-foreground">Your current ranking status will appear here.</p>
          </>
        )}
        {activeTab === "global" && (
          <>
            <Trophy className="h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Global Ranking</h1>
            <p className="text-muted-foreground">Global leaderboard will appear here.</p>
          </>
        )}
        {activeTab === "institute" && (
          <>
            <Shield className="h-12 w-12 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Institute Ranking</h1>
            <p className="text-muted-foreground">Institute leaderboard will appear here.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default RankingPage;
