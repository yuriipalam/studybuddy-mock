import { useState, useEffect, useMemo } from "react";
import { fetchTopics, Topic } from "@/data/mockTopics";
import { FilterBar } from "@/components/FilterBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, BookmarkCheck, Sparkles, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showBookmarked, setShowBookmarked] = useState(false);

  useEffect(() => {
    fetchTopics().then(setTopics);
  }, []);

  const allFields = useMemo(() => [...new Set(topics.flatMap((t) => t.fields))], [topics]);

  const filtered = useMemo(() => {
    return topics.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.company.toLowerCase().includes(search.toLowerCase())) return false;
      if (sourceFilter !== "all" && t.source !== sourceFilter) return false;
      if (fieldFilter !== "all" && !t.fields.includes(fieldFilter)) return false;
      if (showBookmarked && !t.bookmarked) return false;
      return true;
    });
  }, [topics, search, sourceFilter, fieldFilter, showBookmarked]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0];

  const toggleBookmark = (id: string) => {
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, bookmarked: !t.bookmarked } : t)));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Topics</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Get Suggestions
            </Button>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Propose Topic
            </Button>
          </div>
        </div>
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search topics..."
          filters={[
            { label: "Source", options: ["Company", "University"], value: sourceFilter, onChange: setSourceFilter },
            { label: "Fields", options: allFields, value: fieldFilter, onChange: setFieldFilter },
          ]}
        >
          <Button
            variant={showBookmarked ? "default" : "outline"}
            size="sm"
            onClick={() => setShowBookmarked(!showBookmarked)}
            className="gap-1.5"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Bookmarked
          </Button>
        </FilterBar>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* List */}
        <ScrollArea className="w-96 border-r border-border">
          <div className="p-2 space-y-1">
            {filtered.map((topic) => (
              <div
                key={topic.id}
                onClick={() => setSelectedId(topic.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors",
                  selected?.id === topic.id && "bg-accent"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 rounded-md">
                  <AvatarImage src={topic.companyLogo} />
                  <AvatarFallback className="rounded-md text-xs">{topic.company[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{topic.company}</p>
                  <p className="text-sm font-medium leading-tight line-clamp-2">{topic.title}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleBookmark(topic.id); }}
                  className="shrink-0 text-muted-foreground hover:text-primary"
                >
                  {topic.bookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Detail */}
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
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selected.contactAvatar} />
                    <AvatarFallback>{selected.contactPerson[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{selected.contactPerson}</p>
                    <p className="text-xs text-muted-foreground">Contact Person</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.fields.map((f) => (
                    <Badge key={f} variant="secondary">{f}</Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleBookmark(selected.id)}
                    className="gap-1.5"
                  >
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
