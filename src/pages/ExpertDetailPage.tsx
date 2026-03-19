import { useParams, useNavigate } from "react-router-dom";
import { getExpert, getCompany, getField, topics as allTopics } from "@/data";
import type { Topic } from "@/data/types";
import { useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MessageSquare, Building2, BookOpen, Users } from "lucide-react";
import { useMessaging } from "@/contexts/MessagingContext";

export default function ExpertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const expert = getExpert(id || "");
  const company = expert ? getCompany(expert.companyId) : undefined;

  const expertTopics = useMemo(
    () => allTopics.filter((t) => t.expertIds.includes(id || "")),
    [id]
  );

  const fieldNames = useMemo(
    () => (expert?.fieldIds ?? []).map((fid) => getField(fid)?.name).filter(Boolean) as string[],
    [expert]
  );

  if (!expert) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Expert not found.</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  const fullName = `${expert.firstName} ${expert.lastName}`;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/people/experts")} className="gap-1.5 -ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Experts
      </Button>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            <Avatar className="h-20 w-20 border">
              <AvatarFallback className="text-xl font-bold">
                {expert.firstName[0]}{expert.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h1 className="ds-title-lg">{fullName}</h1>
                  <p className="text-sm text-muted-foreground">{expert.title}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">Expert</Badge>
                  {company && (
                    <span className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate(`/organizations/companies/${company.id}`)}>
                      <Building2 className="size-3.5" /> {company.name}
                    </span>
                  )}
                </div>
              </div>
              <Button size="sm" className="gap-1.5">
                <MessageSquare className="size-3.5" /> Get in touch
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open to */}
      <section className="space-y-3">
        <h2 className="ds-title-sm">Open to</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {expert.offerInterviews && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="size-4" />
                  <h3 className="font-medium text-sm">Interviews</h3>
                </div>
                <p className="text-xs text-muted-foreground">{expert.firstName} is open to interview requests by students, experts and supervisors.</p>
                <Button size="sm" variant="default" className="text-xs">Ask for interview</Button>
              </CardContent>
            </Card>
          )}
          {expertTopics.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4" />
                  <h3 className="font-medium text-sm">Direct applications</h3>
                </div>
                <p className="text-xs text-muted-foreground">{expert.firstName} has published topics and is open to applications.</p>
                <span className="text-xs font-medium cursor-pointer hover:underline" onClick={() => navigate("/topics")}>Go to topics →</span>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* About */}
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="ds-title-sm">About</h2>
          {expert.about ? (
            <p className="text-sm leading-relaxed whitespace-pre-line">{expert.about}</p>
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
      {expertTopics.length > 0 && (
        <section className="space-y-3">
          <h2 className="ds-title-sm">Activity ({expertTopics.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {expertTopics.map((topic) => (
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
      {company && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <h2 className="ds-title-sm">Experience</h2>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/organizations/companies/${company.id}`)}>
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarFallback className="rounded-lg text-xs font-semibold">
                  {company.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{company.name}</p>
                <p className="text-xs text-muted-foreground">{expert.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
