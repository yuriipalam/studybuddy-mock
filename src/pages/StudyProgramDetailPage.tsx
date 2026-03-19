import { useParams, useNavigate } from "react-router-dom";
import { getStudyProgram, getUniversity, students as allStudents, projects as allProjects } from "@/data";
import type { Student, ThesisProject } from "@/data/types";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function StudyProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const program = getStudyProgram(id || "");
  const university = program ? getUniversity(program.universityId) : undefined;

  const programStudents = useMemo(
    () => allStudents.filter((s) => s.studyProgramId === id),
    [id]
  );

  const programProjects = useMemo(
    () => allProjects.filter((p) => programStudents.some((s) => s.id === p.studentId)),
    [id, programStudents]
  );

  if (!program) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Study program not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const degreeLabel = program.degree === "bsc" ? "Bachelor" : program.degree === "msc" ? "Master" : "PhD";

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/organizations/study-programs")} className="gap-1.5 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Study Programs
      </Button>

      {/* Header */}
      <div className="flex items-start gap-5">
        <Avatar className="h-16 w-16 rounded-xl border">
          <AvatarFallback className="rounded-xl text-lg font-bold bg-muted">
            {(university?.name ?? "").split(" ").map((w) => w[0]).join("").slice(0, 3)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5 flex-1">
          <h1 className="ds-title-lg">{program.name}</h1>
          <p className="text-sm text-muted-foreground">{university?.name}</p>
          <Badge variant="secondary">{degreeLabel}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students ({programStudents.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({programProjects.length})</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {program.about ? (
            <p className="text-sm leading-relaxed">{program.about}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No description available yet.</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4" />
            {programStudents.length} students on platform
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {programStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students listed yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {programStudents.map((student) => (
                <StudentCard key={student.id} student={student} universityName={university?.name} programName={program.name} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {programProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="grid gap-3">
              {programProjects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm">{project.title}</h3>
                    <Badge variant="outline" className="text-xs capitalize mt-1">{project.state.replace("_", " ")}</Badge>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          {program.about ? (
            <p className="text-sm leading-relaxed">{program.about}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No additional information available.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StudentCard({ student, universityName, programName }: { student: Student; universityName?: string; programName: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs font-semibold">
            {student.firstName[0]}{student.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5 min-w-0">
          <h3 className="font-medium text-sm">{student.firstName} {student.lastName}</h3>
          <p className="text-xs text-muted-foreground">{universityName}<br />{programName}</p>
          <div className="flex flex-wrap gap-1">
            {student.objectives.map((obj) => (
              <Badge key={obj} variant="outline" className="text-xs capitalize">{obj.replace("_", " ")}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
