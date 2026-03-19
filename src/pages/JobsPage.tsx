import { useState, useEffect, useMemo } from "react";
import { fetchJobs, Job } from "@/data/mockJobs";
import { FilterBar } from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs().then(setJobs);
  }, []);

  const allFields = useMemo(() => [...new Set(jobs.flatMap((j) => j.fields))], [jobs]);
  const allTypes = useMemo(() => [...new Set(jobs.map((j) => j.type))], [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false;
      if (sourceFilter !== "all" && j.source !== sourceFilter) return false;
      if (typeFilter !== "all" && j.type !== typeFilter) return false;
      if (fieldFilter !== "all" && !j.fields.includes(fieldFilter)) return false;
      return true;
    });
  }, [jobs, search, sourceFilter, typeFilter, fieldFilter]);

  const selected = filtered.find((j) => j.id === selectedId) || filtered[0];

  const toggleBookmark = (id: string) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, bookmarked: !j.bookmarked } : j)));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="p-4 border-b border-border space-y-3">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search jobs..."
          filters={[
            { label: "Source", options: ["Company", "University"], value: sourceFilter, onChange: setSourceFilter },
            { label: "Type", options: allTypes, value: typeFilter, onChange: setTypeFilter },
            { label: "Fields", options: allFields, value: fieldFilter, onChange: setFieldFilter },
          ]}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        <ScrollArea className="w-96 border-r border-border">
          <div className="p-2 space-y-1">
            {filtered.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedId(job.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                  selected?.id === job.id && "bg-accent"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 rounded-md">
                  <AvatarImage src={job.companyLogo} />
                  <AvatarFallback className="rounded-md text-xs">{job.company[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{job.title}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(job.id); }}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                >
                  {job.bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {selected && (
          <ScrollArea className="flex-1">
            <div>
              <div className="relative h-48 bg-muted">
                <img src={selected.coverImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4">
                  <Avatar className="h-14 w-14 rounded-lg border-2 border-card shadow-lg">
                    <AvatarImage src={selected.companyLogo} />
                    <AvatarFallback className="rounded-lg">{selected.company[0]}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{selected.company}</p>
                  <h2 className="text-xl font-bold mt-1">{selected.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{selected.type}</Badge>
                  {selected.fields.map((f) => (
                    <Badge key={f} variant="secondary">{f}</Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => toggleBookmark(selected.id)} className="gap-1.5">
                    {selected.bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    {selected.bookmarked ? "Bookmarked" : "Bookmark"}
                  </Button>
                  <Button>Apply</Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
