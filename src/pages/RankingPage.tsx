import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Flame, Trophy, Shield, ArrowUp, ArrowDown, Gift, ChevronRight, Zap, Crown, Medal, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useStudentXp, StudentXpRow } from "@/hooks/useStudentXp";
import { students as jsonStudents, getUniversity } from "@/data";

type RankingTab = "my-status" | "global" | "institute";

const tabs: { id: RankingTab; label: string; icon: React.ElementType }[] = [
  { id: "my-status", label: "My Status", icon: Flame },
  { id: "global", label: "Global Ranking", icon: Trophy },
  { id: "institute", label: "Institute Ranking", icon: Shield },
];

function getStudentName(studentId: string): string {
  const s = jsonStudents.find((st) => st.id === studentId);
  return s ? `${s.firstName} ${s.lastName}` : studentId;
}

function getStudentAvatar(studentId: string): string {
  const s = jsonStudents.find((st) => st.id === studentId);
  const name = s ? s.firstName : studentId.replace("student-", "");
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

interface RankedStudent {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  institute: string;
  change: number;
  studentId: string;
  xpBreakdown: { supervisor: number; research: number; referrals: number; profile: number };
}

function buildRankedList(rows: StudentXpRow[]): RankedStudent[] {
  return rows.map((row, i) => ({
    rank: i + 1,
    name: getStudentName(row.student_id),
    avatar: getStudentAvatar(row.student_id),
    xp: row.total_xp,
    institute: getUniversity(row.university_id)?.name ?? row.university_id,
    change: row.rank_change,
    studentId: row.student_id,
    xpBreakdown: {
      supervisor: row.xp_supervisor,
      research: row.xp_research,
      referrals: row.xp_referrals,
      profile: row.xp_profile,
    },
  }));
}

const podiumConfig = [
  {
    rank: 2,
    height: "h-28",
    border: "border-[hsl(0,0%,72%)]",
    glow: "shadow-[0_0_20px_hsl(0,0%,72%,0.15)]",
    iconColor: "text-[hsl(0,0%,72%)]",
    pedestalBg: "from-[hsl(0,0%,72%)]/20 to-[hsl(0,0%,72%)]/5",
    pedestalBorder: "border-[hsl(0,0%,72%)]/30",
    xpColor: "text-[hsl(0,0%,72%)]",
  },
  {
    rank: 1,
    height: "h-36",
    border: "border-[hsl(45,90%,55%)]",
    glow: "shadow-[0_0_30px_hsl(45,90%,55%,0.2)]",
    iconColor: "text-[hsl(45,90%,55%)]",
    pedestalBg: "from-[hsl(45,90%,55%)]/20 to-[hsl(45,90%,55%)]/5",
    pedestalBorder: "border-[hsl(45,90%,55%)]/30",
    xpColor: "text-[hsl(45,90%,55%)]",
  },
  {
    rank: 3,
    height: "h-24",
    border: "border-[hsl(25,70%,55%)]",
    glow: "shadow-[0_0_20px_hsl(25,70%,55%,0.15)]",
    iconColor: "text-[hsl(25,70%,55%)]",
    pedestalBg: "from-[hsl(25,70%,55%)]/20 to-[hsl(25,70%,55%)]/5",
    pedestalBorder: "border-[hsl(25,70%,55%)]/30",
    xpColor: "text-[hsl(25,70%,55%)]",
  },
];

function Podium({ top3 }: { top3: RankedStudent[] }) {
  const navigate = useNavigate();
  // Reorder: 2nd, 1st, 3rd
  const ordered = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

  return (
    <div className="relative overflow-hidden p-6 pb-4">
      <div className="relative flex items-end justify-center gap-3 pt-4">
        {ordered.map((user, i) => {
          const config = podiumConfig[i];
          const isFirst = i === 1;
          return (
            <div key={user.studentId} onClick={() => navigate(`/people/students/${user.studentId}`)} className={cn("flex flex-col items-center gap-2 cursor-pointer", isFirst ? "-mt-4" : "mt-4")}>
              <div className="relative">
                {isFirst && <Crown className={cn("h-6 w-6 absolute -top-5 left-1/2 -translate-x-1/2", config.iconColor)} />}
                {!isFirst && <Medal className={cn("h-5 w-5 absolute -top-4 left-1/2 -translate-x-1/2", config.iconColor)} />}
                <Avatar className={cn(
                  isFirst ? "h-[72px] w-[72px]" : i === 0 ? "h-14 w-14" : "h-12 w-12",
                  "border-2 ring-2 ring-offset-2 ring-offset-transparent",
                  config.border, config.glow
                )}>
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xs font-bold text-white bg-white/10">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground truncate max-w-[90px]">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate max-w-[90px]">{user.institute}</p>
                <p className={cn("text-sm font-bold mt-0.5", config.xpColor)}>{user.xp.toLocaleString()} XP</p>
              </div>
              <div className={cn(
                "w-24 rounded-t-xl bg-gradient-to-t border border-b-0 backdrop-blur-sm flex items-start justify-center pt-3",
                config.height, config.pedestalBg, config.pedestalBorder
              )}>
                <span className="text-2xl font-black text-muted-foreground/20">#{config.rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardTable({ users, currentStudentId }: { users: RankedStudent[]; currentStudentId: string }) {
  const navigate = useNavigate();
  const isYou = (u: RankedStudent) => u.studentId === currentStudentId;
  const youInList = users.some(isYou);
  const youUser = !youInList ? users.find(isYou) : null;

  const renderRow = (user: RankedStudent) => {
    const you = isYou(user);
    return (
      <div
        key={user.studentId}
        onClick={() => navigate(`/people/students/${user.studentId}`)}
        className={cn(
          "grid grid-cols-[48px_1fr_100px_60px] items-center px-4 py-3 border-b border-border/50 last:border-b-0 transition-colors cursor-pointer",
          you ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/20"
        )}
      >
        <span className={cn("text-sm font-medium", you ? "font-bold text-primary" : "text-muted-foreground")}>#{user.rank}</span>
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className={cn("h-8 w-8 shrink-0", you && "ring-2 ring-primary ring-offset-1 ring-offset-background")}>
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-[10px] font-semibold">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 min-w-0">
            <p className={cn("text-sm font-semibold truncate", you ? "text-primary" : "text-foreground")}>
              {user.name}
              {you && <span className="text-xs font-normal text-primary/60"> (You)</span>}
            </p>
            <span className={cn(
              "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border",
              you ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border/50"
            )}>
              {user.institute}
            </span>
          </div>
        </div>
        <span className={cn("text-sm font-bold text-right", you ? "text-primary" : "text-foreground")}>
          {user.xp.toLocaleString()} <span className={cn("text-xs font-medium", you ? "text-primary/60" : "text-muted-foreground")}>XP</span>
        </span>
        <span className={cn(
          "text-xs font-semibold text-right flex items-center justify-end gap-0.5",
          user.change > 0 ? "text-emerald-500" : user.change < 0 ? "text-destructive" : "text-muted-foreground"
        )}>
          {user.change > 0 && <ArrowUp className="h-3 w-3" />}
          {user.change < 0 && <ArrowDown className="h-3 w-3" />}
          {user.change === 0 ? "—" : Math.abs(user.change)}
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="grid grid-cols-[48px_1fr_100px_60px] px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
        <span>Rank</span>
        <span>Student</span>
        <span className="text-right">XP</span>
        <span className="text-right">Change</span>
      </div>

      {users.map(renderRow)}

      {/* Show "you" at bottom only if not already in the list */}
      {youUser && (
        <>
          <div className="flex items-center justify-center py-2 border-b border-border">
            <div className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
            </div>
          </div>
          {renderRow(youUser)}
        </>
      )}
    </div>
  );
}

const RankingPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<RankingTab>("my-status");
  const { data: xpRows, isLoading } = useStudentXp();

  const currentStudentId = currentUser?.id ?? "";
  const currentUniId = "uni-01";

  const globalRanked = useMemo(() => buildRankedList(xpRows ?? []), [xpRows]);

  const instituteRanked = useMemo(() => {
    const filtered = (xpRows ?? []).filter((r) => r.university_id === currentUniId);
    return buildRankedList(filtered);
  }, [xpRows, currentUniId]);

  const me = useMemo(() => globalRanked.find((r) => r.studentId === currentStudentId), [globalRanked, currentStudentId]);

  const globalTop3 = globalRanked.slice(0, 3);
  const globalLeaderboard = globalRanked.slice(3, 10);
  // Append "you" if not already in top 10
  const meInGlobalTop10 = globalRanked.slice(0, 10).some((r) => r.studentId === currentStudentId);
  const globalLeaderboardWithYou = meInGlobalTop10
    ? globalLeaderboard
    : me
      ? [...globalLeaderboard, me]
      : globalLeaderboard;

  const instituteTop3 = instituteRanked.slice(0, 3);
  const instituteLeaderboard = instituteRanked.slice(3, 10);
  const meInInstTop10 = instituteRanked.slice(0, 10).some((r) => r.studentId === currentStudentId);
  const instituteLeaderboardWithYou = meInInstTop10
    ? instituteLeaderboard
    : me
      ? [...instituteLeaderboard, { ...me, rank: (instituteRanked.findIndex((r) => r.studentId === currentStudentId) + 1) || me.rank }]
      : instituteLeaderboard;

  const uniName = getUniversity(currentUniId)?.name ?? "Your University";
  const totalInstStudents = instituteRanked.length;
  // Find institute's global rank by average XP
  const uniXpTotals = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    (xpRows ?? []).forEach((r) => {
      if (!map[r.university_id]) map[r.university_id] = { sum: 0, count: 0 };
      map[r.university_id].sum += r.total_xp;
      map[r.university_id].count += 1;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ id, avg: v.sum / v.count }))
      .sort((a, b) => b.avg - a.avg);
  }, [xpRows]);
  const uniGlobalRank = uniXpTotals.findIndex((u) => u.id === currentUniId) + 1;

  if (currentUser?.role !== "student") {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2">
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

      {/* My Status */}
      {activeTab === "my-status" && me && (
        <div className="flex flex-col gap-6">
          {/* Hero points card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(260,60%,22%)] via-[hsl(240,50%,20%)] to-[hsl(220,55%,18%)] p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  Total Points
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-white">{me.xp.toLocaleString()}</span>
                  <span className="text-lg font-medium text-white/60">XP</span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <ArrowUp className="h-3 w-3" />
                    +195 this week
                  </span>
                  <span className="text-sm text-white/40">Rank #{me.rank} globally</span>
                </div>
              </div>
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

          {/* Recent Activity */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
            <div className="rounded-xl border border-border bg-card shadow-sm divide-y divide-border">
              {[
                { icon: CheckCircle, title: "Completed profile setup", time: "Today", xp: 50, positive: true },
                { icon: Zap, title: "Replied to Supervisor", time: "Today", xp: 15, positive: true },
                { icon: FileText, title: "Applied to Research Topic", time: "Yesterday", xp: 30, positive: true },
                { icon: UserPlus, title: "Referred a fellow student", time: "Mar 17", xp: 100, positive: true },
                { icon: MessageCircle, title: "Unanswered message from mentor", time: "Mar 16", xp: 20, positive: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold flex items-center gap-0.5 shrink-0",
                    item.positive ? "text-emerald-500" : "text-destructive"
                  )}>
                    {item.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {item.positive ? "+" : "-"}{item.xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* XP Breakdown - from DB */}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">XP Breakdown</h2>
            <div className="rounded-xl border border-border bg-card shadow-sm p-4 flex flex-col gap-4">
              {[
                { label: "Supervisor Interactions", xp: me.xpBreakdown.supervisor, max: 600, color: "bg-[hsl(260,55%,50%)]" },
                { label: "Research Progress", xp: me.xpBreakdown.research, max: 600, color: "bg-[hsl(215,70%,50%)]" },
                { label: "Referrals & Community", xp: me.xpBreakdown.referrals, max: 600, color: "bg-emerald-500" },
                { label: "Profile & Setup", xp: me.xpBreakdown.profile, max: 600, color: "bg-orange-500" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.xp} XP</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", item.color)}
                      style={{ width: `${(item.xp / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Ranking */}
      {activeTab === "global" && (
        <div className="flex flex-col gap-6">
          {globalTop3.length >= 3 && <Podium top3={globalTop3} />}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">Leaderboard</h2>
            <LeaderboardTable users={globalLeaderboardWithYou} currentStudentId={currentStudentId} />
          </div>
        </div>
      )}

      {/* Institute Ranking */}
      {activeTab === "institute" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{uniName}</p>
              <p className="text-xs text-muted-foreground">{totalInstStudents} active students · Ranked #{uniGlobalRank} globally</p>
            </div>
          </div>

          {instituteTop3.length >= 3 && <Podium top3={instituteTop3} />}
          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">Institute Leaderboard</h2>
            <LeaderboardTable users={instituteLeaderboardWithYou} currentStudentId={currentStudentId} />
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingPage;
