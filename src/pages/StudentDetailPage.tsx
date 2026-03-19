import { useParams, useNavigate } from "react-router-dom";
import { getStudent, getUniversity, getStudyProgram, getField, projects as allProjects } from "@/data";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, School, BookOpen, Briefcase, GraduationCap, Shield } from "lucide-react";
import { useMessaging } from "@/contexts/MessagingContext";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startConversation } = useMessaging();
  const student = getStudent(id || "");
  const university = student ? getUniversity(student.universityId) : undefined;
  const program = student ? getStudyProgram(student.studyProgramId) : undefined;

  const fieldNames = useMemo(
    () => (student?.fieldIds ?? []).map((fid) => getField(fid)?.name).filter(Boolean) as string[],
    [student]
  );

  const studentProjects = useMemo(
    () => allProjects.filter((p) => p.studentId === id),
    [id]
  );

  if (!student) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Student not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;
  const degreeLabel = student.degree === "bsc" ? "Bachelor" : student.degree === "msc" ? "Master" : "PhD";

  // Everyone is open to supervision and career_start by default
  const allObjectives = Array.from(new Set([...student.objectives, "supervision", "career_start"]));

  const objectiveInfo: Record<string, { title: string; icon: React.ReactNode; desc: string }> = {
    topic: { title: "Thesis Topic", icon: <BookOpen className="size-4" />, desc: `${student.firstName} is looking for a thesis topic.` },
    supervision: { title: "Supervision", icon: <Shield className="size-4" />, desc: `${student.firstName} is looking for supervision.` },
    career_start: { title: "Career start", icon: <Briefcase className="size-4" />, desc: `${student.firstName} is looking for employment opportunities.` },
    industry_access: { title: "Industry access", icon: <Briefcase className="size-4" />, desc: `${student.firstName} is looking for industry connections.` },
    project_guidance: { title: "Project guidance", icon: <GraduationCap className="size-4" />, desc: `${student.firstName} is looking for project guidance.` },
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/people/students")} className="gap-1.5 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Students
      </Button>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <Avatar className="h-20 w-20 border">
              <AvatarFallback className="text-xl font-bold">
                {student.firstName[0]}{student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h1 className="ds-title-lg">{fullName}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{program?.name ?? "Unknown Program"}</span>
                    <Badge variant="secondary" className="text-xs">{degreeLabel}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">Student</Badge>
                  {university && (
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate(`/organizations/universities/${university.id}`)}>
                      <School className="size-3.5" /> {university.name}
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => {
                startConversation({ id: student.id, name: fullName, role: "student" });
                navigate("/messages");
              }}>
                <MessageSquare className="size-3.5" /> Get in touch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Looking for */}
      <section className="space-y-3">
        <h2 className="ds-title-sm">Looking for</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {allObjectives.map((obj) => {
            const info = objectiveInfo[obj] || { title: obj.replace("_", " "), icon: null, desc: "" };
            return (
              <Card key={obj}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {info.icon}
                    <h3 className="font-medium text-sm capitalize">{info.title}</h3>
                    {obj === "topic" && <Badge variant="secondary" className="text-xs">{degreeLabel}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{info.desc}</p>
                  <Button size="sm" variant="default" className="text-xs">Contact</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Interest & Skills / About */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="ds-title-sm">Interest & Skills</h2>
          {student.about ? (
            <p className="text-sm leading-relaxed whitespace-pre-line">{student.about}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No bio available.</p>
          )}
          {fieldNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {fieldNames.map((f) => (
                <Badge key={f} variant="outline">{f}</Badge>
              ))}
            </div>
          )}
          {student.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {student.skills.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      {university && program && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="ds-title-sm">Education</h2>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/organizations/universities/${university.id}`)}>
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs font-semibold">
                  {university.name.split(" ").map((w) => w[0]).join("").slice(0, 3)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{university.name}</p>
                  <span className="text-xs text-muted-foreground">✓ Verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{program.name}</span>
                  <Badge variant="secondary" className="text-xs">{degreeLabel}</Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Currently selected</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {studentProjects.length > 0 && (
        <section className="space-y-3">
          <h2 className="ds-title-sm">Projects ({studentProjects.length})</h2>
          <div className="grid gap-3">
            {studentProjects.map((project) => (
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
        </section>
      )}
    </div>
  );
}
