import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTopics, getCompany, getUniversity, getExpert, getSupervisor, getFieldNames, fields } from "@/data";
import type { Topic } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bookmark, BookmarkCheck, Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useXpEngine, XP_TRIGGERS } from "@/hooks/useXpEngine";
import { toast } from "sonner";

export default function TopicsPage() {
  const navigate = useNavigate();
  const [topicList, setTopics] = useState<Topic[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const { awardXp } = useXpEngine();

  const handleProposeTopic = () => {
    awardXp(XP_TRIGGERS.SUBMIT_TOPIC);
    toast.success("Topic proposed successfully!");
  };

  useEffect(() => {
    fetchTopics().then(setTopics);
  }, []);

  const allFieldNames = useMemo(() => fields.map((f) => f.name), []);

  // Only show thesis topics (type === "topic"), not jobs
  const thesisTopics = useMemo(() => topicList.filter((t) => t.type === "topic"), [topicList]);

  const filtered = useMemo(() => {
    return thesisTopics.filter((t) => {
      const owner = t.companyId ? getCompany(t.companyId)?.name : getUniversity(t.universityId ?? "")?.name;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(owner ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all") {
        const isCompany = typeFilter === "Company" ? !!t.companyId : !!t.universityId;
        if (!isCompany) return false;
      }
      if (fieldFilter !== "all") {
        const fieldNames = getFieldNames(t.fieldIds);
        if (!fieldNames.includes(fieldFilter)) return false;
      }
      return true;
    });
  }, [thesisTopics, search, typeFilter, fieldFilter]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0];

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getOwnerName = (t: Topic) =>
    t.companyId ? getCompany(t.companyId)?.name ?? "" : getUniversity(t.universityId ?? "")?.name ?? "";

  const getContactName = (t: Topic) => {
    if (t.expertIds.length > 0) {
      const e = getExpert(t.expertIds[0]);
      return e ? `${e.firstName} ${e.lastName}` : "";
    }
    if (t.supervisorIds.length > 0) {
      const s = getSupervisor(t.supervisorIds[0]);
      return s ? `${s.title} ${s.firstName} ${s.lastName}` : "";
    }
    return "";
  };

  const getContactProfileUrl = (t: Topic): string | null => {
    if (t.expertIds.length > 0) return `/people/experts/${t.expertIds[0]}`;
    if (t.supervisorIds.length > 0) return `/people/supervisors/${t.supervisorIds[0]}`;
    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="ds-title-lg">Topics</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="size-3.5" />
              Get Suggestions
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleProposeTopic}>
              <Plus className="size-3.5" />
              Propose Topic
            </Button>
          </div>
        </div>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search topics..."
          filters={[
            { label: "Source", options: ["Company", "University"], value: typeFilter, onChange: setTypeFilter },
            { label: "Fields", options: allFieldNames, value: fieldFilter, onChange: setFieldFilter },
          ]}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        <ScrollArea className="w-96 border-r border-border">
          <div className="p-2 space-y-1">
            {filtered.map((topic) => {
              const owner = getOwnerName(topic);
              const isBookmarked = bookmarked.has(topic.id);
              return (
                <div
                  key={topic.id}
                  onClick={() => setSelectedId(topic.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                    selected?.id === topic.id && "bg-accent"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0 rounded-md">
                    <AvatarFallback className="rounded-md ds-badge">{owner.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="ds-caption text-muted-foreground">{owner}</p>
                    <p className="ds-label leading-tight line-clamp-2">{topic.title}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(topic.id); }}
                    className="shrink-0 text-muted-foreground hover:text-primary"
                  >
                    {isBookmarked ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {selected && (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-4">
              <div>
                <p className="ds-small text-muted-foreground">{getOwnerName(selected)}</p>
                <h2 className="ds-title-md mt-1">{selected.title}</h2>
              </div>
              {getContactName(selected) && (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getContactName(selected)[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="ds-label">{getContactName(selected)}</p>
                    <p className="ds-caption text-muted-foreground">Contact Person</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {getFieldNames(selected.fieldIds).map((f) => (
                  <Badge key={f} variant="secondary">{f}</Badge>
                ))}
                {selected.employment !== "no" && (
                  <Badge variant="outline">{selected.employmentType?.replace("_", " ") ?? "Employment possible"}</Badge>
                )}
                {selected.degrees.map((d) => (
                  <Badge key={d} variant="outline">{d.toUpperCase()}</Badge>
                ))}
              </div>
              <p className="ds-body text-muted-foreground leading-relaxed">{selected.description}</p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => toggleBookmark(selected.id)}
                  className="gap-1.5"
                >
                  {bookmarked.has(selected.id) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                  {bookmarked.has(selected.id) ? "Bookmarked" : "Bookmark"}
                </Button>
                <Button onClick={() => navigate(`/topics/${selected.id}/apply`)}>Apply</Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
