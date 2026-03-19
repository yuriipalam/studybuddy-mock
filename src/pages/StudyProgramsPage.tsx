import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStudyPrograms, getUniversity, students as allStudents } from "@/data";
import type { StudyProgram } from "@/data/types";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function StudyProgramsPage() {
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("all");

  useEffect(() => {
    fetchStudyPrograms().then(setPrograms);
  }, []);

  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const uni = getUniversity(p.universityId);
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(uni?.name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (degreeFilter !== "all" && p.degree !== degreeFilter) return false;
      return true;
    });
  }, [programs, search, degreeFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="ds-title-lg">Study Programs</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search programs..."
        filters={[
          { label: "Degree", options: ["bsc", "msc", "phd"], value: degreeFilter, onChange: setDegreeFilter },
        ]}
      />
      <div className="grid-4-col">
        {filtered.map((program) => {
          const uni = getUniversity(program.universityId);
          const studentCount = allStudents.filter((s) => s.studyProgramId === program.id).length;
          return (
            <Card key={program.id} className="group overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarFallback className="rounded-lg text-sm font-semibold">
                      {(uni?.name ?? "").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="ds-title-cards leading-tight transition-colors group-hover:text-primary">{program.name}</h3>
                    <p className="ds-caption text-muted-foreground">{uni?.name ?? ""}</p>
                  </div>
                </div>
                <Badge variant="secondary">{program.degree.toUpperCase()}</Badge>
                {program.about && (
                  <p className="ds-small text-muted-foreground line-clamp-2">{program.about}</p>
                )}
                <div className="flex items-center gap-1 ds-caption text-muted-foreground">
                  <Users className="size-3.5" />
                  {studentCount} students on platform
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
