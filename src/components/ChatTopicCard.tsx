import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Building2, GraduationCap, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupervisorCardData } from "@/components/ChatSupervisorCard";
import { Building2, GraduationCap, MapPin, Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TopicCardData {
  id: string;
  title: string;
  company: string | null;
  fields: string[];
  degrees: string[];
  employment: string;
  employmentType: string | null;
  workplaceType: string | null;
}

function getDegreeLabel(d: string) {
  switch (d) {
    case "bsc": return "BSc";
    case "msc": return "MSc";
    case "phd": return "PhD";
    default: return d;
  }
}

function getEmploymentLabel(type: string | null) {
  switch (type) {
    case "internship": return "Internship";
    case "working_student": return "Working Student";
    case "graduate_program": return "Graduate Program";
    case "direct_entry": return "Direct Entry";
    default: return null;
  }
}

function getWorkplaceLabel(type: string | null) {
  switch (type) {
    case "on_site": return "On-site";
    case "hybrid": return "Hybrid";
    case "remote": return "Remote";
    default: return null;
  }
}

export function ChatTopicCard({ topic }: { topic: TopicCardData }) {
  const navigate = useNavigate();
  const employmentLabel = getEmploymentLabel(topic.employmentType);
  const workplaceLabel = getWorkplaceLabel(topic.workplaceType);

  return (
    <button
      onClick={() => navigate("/topics")}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-card p-3.5 shadow-sm",
        "hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {topic.title}
        </h4>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {topic.company && (
          <Badge variant="secondary" className="gap-1 text-[10px] font-medium py-0.5 px-1.5">
            <Building2 className="h-2.5 w-2.5" />
            {topic.company}
          </Badge>
        )}
        {topic.degrees.map((d) => (
          <Badge key={d} variant="outline" className="gap-1 text-[10px] font-medium py-0.5 px-1.5">
            <GraduationCap className="h-2.5 w-2.5" />
            {getDegreeLabel(d)}
          </Badge>
        ))}
        {employmentLabel && (
          <Badge variant="outline" className="gap-1 text-[10px] font-medium py-0.5 px-1.5">
            <Briefcase className="h-2.5 w-2.5" />
            {employmentLabel}
          </Badge>
        )}
        {workplaceLabel && (
          <Badge variant="outline" className="gap-1 text-[10px] font-medium py-0.5 px-1.5">
            <MapPin className="h-2.5 w-2.5" />
            {workplaceLabel}
          </Badge>
        )}
      </div>

      {topic.fields.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {topic.fields.map((f) => (
            <span key={f} className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {f}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export type ChatSegment =
  | { type: "text"; content: string }
  | { type: "topics"; topics: TopicCardData[] }
  | { type: "supervisors"; supervisors: SupervisorCardData[] };

/**
 * Parse a message content string and extract :::topics and :::supervisors blocks.
 */
export function parseChatBlocks(content: string): ChatSegment[] {
  const regex = /:::(topics|supervisors)\s*\n([\s\S]*?)\n:::/g;
  const segments: ChatSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: "text", content: text });
    }

    const blockType = match[1] as "topics" | "supervisors";
    try {
      const parsed = JSON.parse(match[2].trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (blockType === "topics") {
          segments.push({ type: "topics", topics: parsed as TopicCardData[] });
        } else {
          segments.push({ type: "supervisors", supervisors: parsed as SupervisorCardData[] });
        }
      }
    } catch {
      segments.push({ type: "text", content: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) segments.push({ type: "text", content: text });
  }

  if (segments.length === 0 && content.trim()) {
    segments.push({ type: "text", content: content.trim() });
  }

  return segments;
}
