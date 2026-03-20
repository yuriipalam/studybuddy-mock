import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { topics, getStudent, getUniversity, getField } from "@/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Eye, Clock, User, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useXpEngine, XP_TRIGGERS } from "@/hooks/useXpEngine";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type TabId = "pending" | "accepted" | "rejected";

interface ApplicationRow {
  id: string;
  user_id: string;
  topic_id: string;
  motivation: string | null;
  availability: string | null;
  scheduling_url: string | null;
  cv_file_name: string | null;
  student_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function StudentRequestsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { awardXp } = useXpEngine();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [viewApp, setViewApp] = useState<ApplicationRow | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supervisorId = currentUser?.id ?? "";

  // Get topic IDs this supervisor manages
  const supervisorTopicIds = useMemo(
    () => topics.filter((t) => t.supervisorIds.includes(supervisorId)).map((t) => t.id),
    [supervisorId]
  );

  // Fetch applications from DB
  const fetchApplications = useCallback(async () => {
    if (supervisorTopicIds.length === 0) {
      setApplications([]);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("topic_applications")
      .select("*")
      .in("topic_id", supervisorTopicIds)
      .neq("status", "draft")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch applications:", error);
    } else {
      setApplications((data ?? []) as ApplicationRow[]);
    }
    setIsLoading(false);
  }, [supervisorTopicIds]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Real-time subscription
  useEffect(() => {
    if (supervisorTopicIds.length === 0) return;

    const channel = supabase
      .channel("supervisor-applications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topic_applications" },
        (payload) => {
          const row = (payload.new as ApplicationRow | undefined);
          if (row && supervisorTopicIds.includes(row.topic_id) && row.status !== "draft") {
            // Refresh the full list for simplicity
            fetchApplications();
          }
          if (payload.eventType === "DELETE") {
            fetchApplications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supervisorTopicIds, fetchApplications]);

  // Categorise applications
  const pending = useMemo(
    () => applications.filter((a) => a.status === "submitted"),
    [applications]
  );
  const accepted = useMemo(
    () => applications.filter((a) => a.status === "accepted"),
    [applications]
  );
  const rejected = useMemo(
    () => applications.filter((a) => a.status === "rejected"),
    [applications]
  );

  const handleAccept = async (app: ApplicationRow) => {
    const acceptedAt = new Date().toISOString();

    const { error } = await supabase
      .from("topic_applications")
      .update({ status: "accepted", updated_at: acceptedAt } as any)
      .eq("id", app.id);
    if (error) {
      toast.error("Failed to accept request");
      return;
    }

    const rawUserId = app.user_id.startsWith("db-") ? app.user_id.slice(3) : app.user_id;
    const relatedUserIds = Array.from(new Set([rawUserId, `db-${rawUserId}`]));
    const acceptedJourneyStages = [
      { id: "topic_selection", label: "Topic Selection", status: "completed" },
      { id: "supervisor_approval", label: "Supervisor Approval", status: "completed" },
      { id: "literature_review", label: "Literature Review", status: "in_progress" },
      { id: "research", label: "Research", status: "up_next" },
      { id: "writing", label: "Writing", status: "locked" },
      { id: "submission", label: "Submission", status: "locked" },
    ];

    await supabase
      .from("thesis_journeys")
      .update({
        current_stage: "literature_review",
        stages: acceptedJourneyStages as any,
        updated_at: acceptedAt,
      } as any)
      .in("user_id", relatedUserIds);

    // Award XP to the student
    if (app.user_id) {
      awardXp(XP_TRIGGERS.SUPERVISOR_INTERACTION, app.user_id);
    }

    // Notify the student
    await supabase.from("notifications").insert({
      user_id: app.user_id,
      title: "Your thesis application was accepted!",
      description: `Your application for "${topics.find((t) => t.id === app.topic_id)?.title ?? "a topic"}" has been accepted.`,
      type: "success",
      xp_amount: 0,
    });

    queryClient.invalidateQueries({ queryKey: ["thesis-journey"] });
    toast.success("Request accepted");
    fetchApplications();
  };

  const handleReject = async (app: ApplicationRow) => {
    const { error } = await supabase
      .from("topic_applications")
      .update({ status: "rejected", updated_at: new Date().toISOString() } as any)
      .eq("id", app.id);
    if (error) {
      toast.error("Failed to decline request");
      return;
    }
    // Notify the student
    await supabase.from("notifications").insert({
      user_id: app.user_id,
      title: "Your thesis application was declined",
      description: `Your application for "${topics.find((t) => t.id === app.topic_id)?.title ?? "a topic"}" was declined.`,
      type: "warning",
      xp_amount: 0,
    });
    toast.info("Request declined");
    fetchApplications();
  };

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    { id: "accepted", label: "Accepted", count: accepted.length },
    { id: "rejected", label: "Declined", count: rejected.length },
  ];

  const currentList = activeTab === "pending" ? pending : activeTab === "accepted" ? accepted : rejected;

  if (currentUser?.role !== "supervisor") {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>This page is only available for supervisors.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="ds-title-lg">Student Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage thesis supervision requests from students.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : currentList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium mb-1">No {activeTab} requests</h3>
            <p className="text-xs text-muted-foreground">
              {activeTab === "pending" ? "No pending requests at the moment." : `No ${activeTab} requests yet.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {currentList.map((app) => {
            const student = getStudent(app.user_id);
            const displayName = app.student_name || (student ? `${student.firstName} ${student.lastName}` : "Unknown Student");
            const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "??";
            const avatarUrl = app.avatar_url || undefined;
            const topic = topics.find((t) => t.id === app.topic_id);
            const university = getUniversity(topic?.universityId ?? "");

            return (
              <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground leading-snug">
                            {topic?.title ?? "Unknown Topic"}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                              onClick={() => student ? navigate(`/people/students/${student.id}`) : undefined}
                            >
                              <User className="h-3 w-3" />
                              {displayName}
                            </span>
                            {university && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {university.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 capitalize text-xs",
                            app.status === "accepted" && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                            app.status === "rejected" && "border-destructive/30 text-destructive bg-destructive/10",
                            app.status === "submitted" && "border-amber-500/30 text-amber-600 bg-amber-500/10"
                          )}
                        >
                          {app.status === "accepted" ? "Accepted" : app.status === "submitted" ? "Pending" : app.status}
                        </Badge>
                      </div>

                      {app.motivation && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          "{app.motivation}"
                        </p>
                      )}

                      {student && student.fieldIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {student.fieldIds.slice(0, 3).map((fId) => {
                            const field = getField(fId);
                            return field ? (
                              <Badge key={fId} variant="secondary" className="text-[10px]">
                                {field.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={() => setViewApp(app)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                        {activeTab === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleAccept(app)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(app)}
                            >
                              <X className="h-3.5 w-3.5" />
                              Decline
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!viewApp} onOpenChange={(o) => !o && setViewApp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{topics.find((t) => t.id === viewApp?.topic_id)?.title}</DialogTitle>
            <DialogDescription>
              {viewApp && (() => {
                const s = getStudent(viewApp.user_id);
                const name = viewApp.student_name || (s ? `${s.firstName} ${s.lastName}` : "Unknown Student");
                return `By ${name}`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewApp?.motivation && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Student's Motivation</p>
                <p className="text-sm leading-relaxed italic">"{viewApp.motivation}"</p>
              </div>
            )}
            {viewApp?.availability && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Availability</p>
                <p className="text-sm leading-relaxed">{viewApp.availability}</p>
              </div>
            )}
            {viewApp?.scheduling_url && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Scheduling URL</p>
                <a href={viewApp.scheduling_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                  {viewApp.scheduling_url}
                </a>
              </div>
            )}
            {viewApp?.cv_file_name && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">CV</p>
                <p className="text-sm">{viewApp.cv_file_name}</p>
              </div>
            )}
            {viewApp && (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Status:</p>
                <Badge variant="outline" className="capitalize">
                  {viewApp.status === "submitted" ? "Pending" : viewApp.status}
                </Badge>
              </div>
            )}
            {viewApp && viewApp.status === "submitted" && (
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => { handleAccept(viewApp); setViewApp(null); }}
                >
                  <Check className="h-4 w-4" />
                  Accept Request
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10"
                  onClick={() => { handleReject(viewApp); setViewApp(null); }}
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
