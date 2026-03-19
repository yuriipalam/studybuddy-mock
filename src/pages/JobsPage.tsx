import { useState, useEffect, useMemo } from "react";
import { fetchTopics, getCompany, getUniversity, getFieldNames, fields } from "@/data";
import type { Topic } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobsPage() {
  const [topicList, setTopics] = useState<Topic[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTopics().then(setTopics);
  }, []);

  const allFieldNames = useMemo(() => fields.map((f) => f.name), []);

  // Show job-type topics
  const jobs = useMemo(() => topicList.filter((t) => t.type === "job"), [topicList]);

  const filtered = useMemo(() => {
    return jobs.filter((t) => {
      const owner = t.companyId ? getCompany(t.companyId)?.name : getUniversity(t.universityId ?? "")?.name;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(owner ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && t.employmentType !== typeFilter) return false;
      if (fieldFilter !== "all") {
        const fieldNames = getFieldNames(t.fieldIds);
        if (!fieldNames.includes(fieldFilter)) return false;
      }
      return true;
    });
  }, [jobs, search, typeFilter, fieldFilter]);

  const selected = filtered.find((j) => j.id === selectedId) || filtered[0];

  const employmentTypes = useMemo(() => [...new Set(jobs.map((j) => j.employmentType).filter(Boolean))] as string[], [jobs]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="p-4 border-b border-border space-y-3">
        <h1 className="ds-title-lg">Jobs</h1>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search jobs..."
          filters={[
            { label: "Type", options: employmentTypes, value: typeFilter, onChange: setTypeFilter },
            { label: "Fields", options: allFieldNames, value: fieldFilter, onChange: setFieldFilter },
          ]}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        <ScrollArea className="w-96 border-r border-border">
          <div className="p-2 space-y-1">
            {filtered.map((job) => {
              const owner = getOwnerName(job);
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedId(job.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                    selected?.id === job.id && "bg-accent"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0 rounded-md">
                    <AvatarFallback className="rounded-md ds-badge">{owner.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="ds-caption text-muted-foreground">{owner}</p>
                    <p className="ds-label leading-tight line-clamp-2">{job.title}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                    className="shrink-0 text-muted-foreground hover:text-primary"
                  >
                    {bookmarked.has(job.id) ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
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
              <div className="flex flex-wrap gap-2">
                {selected.employmentType && (
                  <Badge>{selected.employmentType.replace("_", " ")}</Badge>
                )}
                {selected.workplaceType && (
                  <Badge variant="outline">{selected.workplaceType.replace("_", " ")}</Badge>
                )}
                {getFieldNames(selected.fieldIds).map((f) => (
                  <Badge key={f} variant="secondary">{f}</Badge>
                ))}
              </div>
              <p className="ds-body text-muted-foreground leading-relaxed">{selected.description}</p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => toggleBookmark(selected.id)} className="gap-1.5">
                  {bookmarked.has(selected.id) ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                  {bookmarked.has(selected.id) ? "Bookmarked" : "Bookmark"}
                </Button>
                <Button>Apply</Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
