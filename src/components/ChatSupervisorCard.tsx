import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, UserCheck, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface SupervisorCardData {
  id: string;
  name: string;
  university: string;
  researchInterests: string[];
  fields: string[];
  openToStudents: boolean;
}

function getInitials(name: string) {
  // Skip title prefix like "Prof. Dr."
  const parts = name.replace(/^(Prof\.\s*)?Dr\.\s*/i, "").trim().split(" ");
  return parts.map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getAvatarSeed(name: string) {
  const parts = name.replace(/^(Prof\.\s*)?Dr\.\s*/i, "").trim().split(" ");
  return parts[0] || name;
}

export function ChatSupervisorCard({ supervisor }: { supervisor: SupervisorCardData }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/people/supervisors/${supervisor.id}`)}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-card p-3.5 shadow-sm",
        "hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 mt-0.5">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${getAvatarSeed(supervisor.name)}`} />
          <AvatarFallback className="text-xs font-bold">{getInitials(supervisor.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                {supervisor.name}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">{supervisor.university}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
          </div>

          {/* Research interests */}
          <div className="mt-2 flex flex-wrap gap-1">
            {supervisor.researchInterests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="secondary" className="gap-1 text-[10px] font-medium py-0.5 px-1.5">
                <BookOpen className="h-2.5 w-2.5" />
                {interest}
              </Badge>
            ))}
          </div>

          {/* Fields + open to students */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {supervisor.fields.slice(0, 2).map((f) => (
              <span key={f} className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {f}
              </span>
            ))}
            {supervisor.openToStudents && (
              <Badge variant="outline" className="gap-1 text-[10px] font-medium py-0.5 px-1.5 text-emerald-600 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950">
                <UserCheck className="h-2.5 w-2.5" />
                Open to students
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
