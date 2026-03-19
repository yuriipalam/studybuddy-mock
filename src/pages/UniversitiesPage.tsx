import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUniversities, studyPrograms, supervisors as allSupervisors } from "@/data";
import type { University } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, User } from "lucide-react";

export default function UniversitiesPage() {
  const navigate = useNavigate();
  const [unis, setUnis] = useState<University[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUniversities().then(setUnis);
  }, []);

  const filtered = useMemo(
    () => unis.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase())),
    [unis, search]
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Universities</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search universities..."
        filters={[]}
      />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((uni) => {
          const programCount = studyPrograms.filter((sp) => sp.universityId === uni.id).length;
          const supervisorCount = allSupervisors.filter((s) => s.universityId === uni.id).length;
          return (
            <Card key={uni.id} className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/organizations/universities/${uni.id}`)}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarFallback className="rounded-lg text-xs font-semibold">
                      {uni.name.split(" ").map((w) => w[0]).join("").slice(0, 3)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="ds-title-cards leading-tight transition-colors group-hover:text-primary truncate">{uni.name}</h3>
                    <p className="ds-caption text-muted-foreground">{uni.country}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 ds-caption text-muted-foreground">
                  <span className="flex items-center gap-1.5"><User className="size-3.5" /> {supervisorCount} supervisors</span>
                  <span className="flex items-center gap-1.5"><GraduationCap className="size-3.5" /> {programCount} study programs</span>
                </div>
                {uni.domains.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {uni.domains.map((d) => (
                      <Badge key={d} variant="secondary" className="ds-badge font-normal text-xs">{d}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
