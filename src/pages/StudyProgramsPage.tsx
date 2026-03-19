import { useState, useEffect, useMemo } from "react";
import { fetchStudyPrograms, StudyProgram } from "@/data/mockStudyPrograms";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.university.toLowerCase().includes(search.toLowerCase())) return false;
      if (degreeFilter !== "all" && p.degree !== degreeFilter) return false;
      return true;
    });
  }, [programs, search, degreeFilter]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Study Programs</h1>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search programs..."
        filters={[
          { label: "Degree", options: ["BSc", "MSc"], value: degreeFilter, onChange: setDegreeFilter },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((program) => (
          <Card key={program.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-lg">
                  <AvatarImage src={program.universityLogo} />
                  <AvatarFallback className="rounded-lg">{program.university[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-sm">{program.name}</h3>
                  <p className="text-xs text-muted-foreground">{program.university}</p>
                </div>
              </div>
              <Badge variant="secondary">{program.degree}</Badge>
              <p className="text-xs text-muted-foreground line-clamp-2">{program.description}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {program.activeStudents} active students
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
