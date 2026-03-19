import { useParams, useNavigate } from "react-router-dom";
import { getUniversity, supervisors as allSupervisors, studyPrograms as allPrograms, getStudyProgram } from "@/data";
import type { Supervisor, StudyProgram } from "@/data/types";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, MapPin } from "lucide-react";

export default function UniversityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const university = getUniversity(id || "");

  const uniSupervisors = useMemo(
    () => allSupervisors.filter((s) => s.universityId === id),
    [id]
  );

  const uniPrograms = useMemo(
    () => allPrograms.filter((p) => p.universityId === id),
    [id]
  );

  if (!university) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">University not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/organizations/universities")} className="gap-1.5 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Universities
      </Button>

      {/* Header */}
      <div className="flex items-start gap-5">
        <Avatar className="h-16 w-16 rounded-xl border">
          <AvatarFallback className="rounded-xl text-lg font-bold bg-muted">
            {university.name.split(" ").map((w) => w[0]).join("").slice(0, 3)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5 flex-1">
          <h1 className="ds-title-lg">{university.name}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {university.country}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="supervisors">Supervisors ({uniSupervisors.length})</TabsTrigger>
          <TabsTrigger value="programs">Study Programs ({uniPrograms.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {university.about ? (
            <p className="text-sm leading-relaxed">{university.about}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No description available.</p>
          )}

          {/* Supervisors preview */}
          {uniSupervisors.length > 0 && (
            <section className="space-y-3">
              <h2 className="ds-title-sm">Supervisors ({uniSupervisors.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {uniSupervisors.slice(0, 4).map((sup) => (
                  <SupervisorCard key={sup.id} supervisor={sup} universityName={university.name} />
                ))}
              </div>
              {uniSupervisors.length > 4 && (
                <p className="text-sm text-muted-foreground">+ {uniSupervisors.length - 4} more supervisors</p>
              )}
            </section>
          )}

          {/* Programs preview */}
          {uniPrograms.length > 0 && (
            <section className="space-y-3">
              <h2 className="ds-title-sm">Study Programs ({uniPrograms.length})</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {uniPrograms.slice(0, 4).map((prog) => (
                  <ProgramCard key={prog.id} program={prog} onClick={() => navigate(`/organizations/study-programs/${prog.id}`)} />
                ))}
              </div>
              {uniPrograms.length > 4 && (
                <p className="text-sm text-muted-foreground">+ {uniPrograms.length - 4} more programs</p>
              )}
            </section>
          )}
        </TabsContent>

        <TabsContent value="supervisors" className="space-y-4">
          {uniSupervisors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No supervisors listed yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {uniSupervisors.map((sup) => (
                <SupervisorCard key={sup.id} supervisor={sup} universityName={university.name} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          {uniPrograms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No study programs listed yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {uniPrograms.map((prog) => (
                <ProgramCard key={prog.id} program={prog} onClick={() => navigate(`/organizations/study-programs/${prog.id}`)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SupervisorCard({ supervisor, universityName }: { supervisor: Supervisor; universityName: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs font-semibold">
            {supervisor.firstName[0]}{supervisor.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5 min-w-0">
          <h3 className="font-medium text-sm">{supervisor.firstName} {supervisor.lastName}</h3>
          <p className="text-xs text-muted-foreground truncate">{universityName}<br />{supervisor.title}</p>
          <div className="flex flex-wrap gap-1">
            {supervisor.objectives.slice(0, 2).map((obj) => (
              <Badge key={obj} variant="outline" className="text-xs capitalize">{obj.replace("_", " ")}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgramCard({ program, onClick }: { program: StudyProgram; onClick: () => void }) {
  const degreeLabel = program.degree === "bsc" ? "Bachelor" : program.degree === "msc" ? "Master" : "PhD";
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 space-y-1.5">
        <h3 className="font-medium text-sm">{program.name}</h3>
        <Badge variant="secondary" className="text-xs">{degreeLabel}</Badge>
      </CardContent>
    </Card>
  );
}
