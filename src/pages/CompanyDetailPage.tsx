import { useParams, useNavigate } from "react-router-dom";
import { getCompany, experts as allExperts, topics as allTopics, projects as allProjects, getField } from "@/data";
import type { Expert, Topic, ThesisProject } from "@/data/types";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, BookOpen, ArrowLeft, Briefcase } from "lucide-react";

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const company = getCompany(id || "");

  const companyExperts = useMemo(
    () => allExperts.filter((e) => e.companyId === id),
    [id]
  );

  const companyTopics = useMemo(
    () => allTopics.filter((t) => t.companyId === id),
    [id]
  );

  const companyProjects = useMemo(
    () => allProjects.filter((p) => p.companyId === id),
    [id]
  );

  if (!company) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Company not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/organizations/companies")} className="gap-1.5 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Industry Partners
      </Button>

      {/* Header */}
      <div className="flex items-start gap-5">
        <Avatar className="h-16 w-16 rounded-xl border">
          <AvatarFallback className="rounded-xl text-lg font-bold bg-muted">
            {company.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1.5 flex-1">
          <h1 className="ds-title-lg">{company.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /> Switzerland</span>
            <span className="flex items-center gap-1"><Users className="size-3.5" /> {company.size} employees</span>
            <span className="flex items-center gap-1"><BookOpen className="size-3.5" /> {companyTopics.length} topics</span>
            <span className="flex items-center gap-1"><Briefcase className="size-3.5" /> {companyExperts.length} experts</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {company.domains.map((d) => (
              <Badge key={d} variant="secondary" className="font-normal">{d}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="people">People ({companyExperts.length})</TabsTrigger>
          <TabsTrigger value="projects">Projects ({companyProjects.length})</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">{company.description}</p>

          {companyTopics.length > 0 && (
            <section className="space-y-3">
              <h2 className="ds-title-sm">Topics</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {companyTopics.slice(0, 6).map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
              {companyTopics.length > 6 && (
                <p className="text-sm text-muted-foreground">+ {companyTopics.length - 6} more topics</p>
              )}
            </section>
          )}
        </TabsContent>

        {/* People tab */}
        <TabsContent value="people" className="space-y-4">
          {companyExperts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No experts listed yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {companyExperts.map((expert) => (
                <ExpertCard key={expert.id} expert={expert} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Projects tab */}
        <TabsContent value="projects" className="space-y-4">
          {companyProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="grid gap-3">
              {companyProjects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-sm">{project.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{project.state.replace("_", " ")}</Badge>
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{project.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* About tab */}
        <TabsContent value="about" className="space-y-4">
          {company.about ? (
            <p className="text-sm leading-relaxed">{company.about}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No additional information available.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TopicCard({ topic }: { topic: Topic }) {
  const fieldNames = topic.fieldIds.map((fid) => getField(fid)?.name).filter(Boolean);
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-2">
        <h3 className="font-medium text-sm leading-snug">{topic.title}</h3>
        <div className="flex flex-wrap gap-1">
          {topic.degrees.map((d) => (
            <Badge key={d} variant="outline" className="text-xs uppercase">{d}</Badge>
          ))}
          {fieldNames.slice(0, 2).map((f) => (
            <Badge key={f} variant="secondary" className="text-xs font-normal">{f}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ExpertCard({ expert }: { expert: Expert }) {
  const fieldNames = expert.fieldIds.map((fid) => getField(fid)?.name).filter(Boolean);
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs font-semibold">
            {expert.firstName[0]}{expert.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1 min-w-0">
          <h3 className="font-medium text-sm">{expert.firstName} {expert.lastName}</h3>
          <p className="text-xs text-muted-foreground">{expert.title}</p>
          <div className="flex flex-wrap gap-1">
            {fieldNames.slice(0, 2).map((f) => (
              <Badge key={f} variant="secondary" className="text-xs font-normal">{f}</Badge>
            ))}
            {expert.offerInterviews && (
              <Badge variant="outline" className="text-xs">Interviews</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
