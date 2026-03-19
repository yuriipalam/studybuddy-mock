import { useParams, useNavigate } from "react-router-dom";
import { getSupervisor, getUniversity, getField, topics as allTopics } from "@/data";
import type { Topic } from "@/data/types";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, MessageSquare, School } from "lucide-react";
import { useMessaging } from "@/contexts/MessagingContext";

export default function SupervisorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startConversation } = useMessaging();
  const supervisor = getSupervisor(id || "");
  const university = supervisor ? getUniversity(supervisor.universityId) : undefined;

  const supervisorTopics = useMemo(
    () => allTopics.filter((t) => t.supervisorIds.includes(id || "")),
    [id]
  );

  const fieldNames = useMemo(
    () => (supervisor?.fieldIds ?? []).map((fid) => getField(fid)?.name).filter(Boolean) as string[],
    [supervisor]
  );

  if (!supervisor) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Supervisor not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const fullName = `${supervisor.firstName} ${supervisor.lastName}`;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/people/supervisors")} className="gap-1.5 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Supervisors
      </Button>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <Avatar className="h-20 w-20 border">
              <AvatarFallback className="text-xl font-bold">
                {supervisor.firstName[0]}{supervisor.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h1 className="ds-title-lg">{fullName}</h1>
                  <p className="text-sm text-muted-foreground">{supervisor.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">Supervisor</Badge>
                  {university && (
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate(`/organizations/universities/${university.id}`)}>
                      <School className="size-3.5" /> {university.name}
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => {
                startConversation({ id: supervisor.id, name: fullName, role: "supervisor", title: supervisor.title });
                navigate("/messages");
              }}>
                <MessageSquare className="size-3.5" /> Get in touch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open to section */}
      <section className="space-y-3">
        <h2 className="ds-title-sm">Open to</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {supervisor.objectives.map((obj) => {
            const labels: Record<string, { title: string; desc: string }> = {
              student_matching: { title: "Student matching", desc: `${supervisor.firstName} is looking to connect with students for thesis supervision.` },
              research_collaboration: { title: "Research collaboration", desc: `${supervisor.firstName} is open to collaborative research with industry and academia.` },
              network_expansion: { title: "Network expansion", desc: `${supervisor.firstName} is interested in expanding professional connections.` },
              funding_access: { title: "Funding access", desc: `${supervisor.firstName} is exploring funding opportunities for research projects.` },
              project_management: { title: "Project management", desc: `${supervisor.firstName} offers guidance on thesis project management.` },
            };
            const info = labels[obj] || { title: obj.replace("_", " "), desc: "" };
            return (
              <Card key={obj}>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-medium text-sm capitalize">{info.title}</h3>
                  <p className="text-xs text-muted-foreground">{info.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* About */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="ds-title-sm">About</h2>
          {supervisor.about ? (
            <p className="text-sm leading-relaxed whitespace-pre-line">{supervisor.about}</p>
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
        </CardContent>
      </Card>

      {/* Activity / Topics */}
      {supervisorTopics.length > 0 && (
        <section className="space-y-3">
          <h2 className="ds-title-sm">Activity ({supervisorTopics.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {supervisorTopics.map((topic) => (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-6 rounded bg-muted" />
                    <Badge variant="secondary" className="text-xs">Open</Badge>
                  </div>
                  <h3 className="font-medium text-sm leading-snug">{topic.title}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {university && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="ds-title-sm">Experience</h2>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/organizations/universities/${university.id}`)}>
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs font-semibold">
                  {university.name.split(" ").map((w) => w[0]).join("").slice(0, 3)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{university.name}</p>
                <p className="text-xs text-muted-foreground">{supervisor.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Research interests */}
      {supervisor.researchInterests.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="ds-title-sm">Research Interests</h2>
            <div className="flex flex-wrap gap-1.5">
              {supervisor.researchInterests.map((ri) => (
                <Badge key={ri} variant="secondary">{ri}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
