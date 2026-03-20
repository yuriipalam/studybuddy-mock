import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Clock, CheckCircle2, XCircle, BookOpen, ArrowRight, MessageSquare, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { topics, getSupervisor, getField, getStudent } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ApplicationRow {
  id: string;
  topic_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  motivation: string | null;
}

type TabId = "active" | "pending" | "rejected";

const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode; statuses: string[] }[] = [
  { id: "active", label: "Current Projects", icon: <CheckCircle2 className="h-4 w-4" />, statuses: ["accepted"] },
  { id: "pending", label: "Pending", icon: <Clock className="h-4 w-4" />, statuses: ["submitted"] },
  { id: "rejected", label: "Rejected", icon: <XCircle className="h-4 w-4" />, statuses: ["rejected"] },
];

/* ------------------------------------------------------------------ */
/*  Supervisor: My Topics view                                         */
/* ------------------------------------------------------------------ */
function SupervisorTopicsView() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Find topics where this supervisor is listed
  const myTopics = topics.filter((t) =>
    t.supervisorIds.includes(currentUser?.id ?? "")
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Topics</h1>

      {myTopics.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="No Topics Yet"
          description="You are not listed as a supervisor on any topics yet."
          actionLabel="Browse Topics"
          onAction={() => navigate("/topics")}
        />
      ) : (
        <div className="space-y-3">
          {myTopics.map((topic) => {
            const fieldNames = topic.fieldIds
              .map((id) => getField(id)?.name)
              .filter(Boolean);

            return (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold text-sm truncate">{topic.title}</h3>
                        <Badge variant="outline" className="shrink-0 capitalize text-xs">
                          {topic.type}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {topic.description}
                      </p>

                      <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                        {fieldNames.length > 0 &&
                          fieldNames.map((f) => (
                            <Badge key={f} variant="outline" className="text-xs py-0">
                              {f}
                            </Badge>
                          ))}
                        <span>·</span>
                        <span>{topic.degrees.map((d) => d.toUpperCase()).join(", ")}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/topics`)}
                    >
                      View <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Student: My Projects view (original)                               */
/* ------------------------------------------------------------------ */
function StudentProjectsView() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("active");

  const userId = currentUser?.id ?? "";

  const fetchApplications = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("topic_applications")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "draft")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data as ApplicationRow[]);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const currentStatuses = TAB_CONFIG.find((t) => t.id === activeTab)!.statuses;
  const filtered = applications.filter((a) => currentStatuses.includes(a.status));

  const counts = {
    active: applications.filter((a) => a.status === "accepted").length,
    pending: applications.filter((a) => a.status === "submitted").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Projects</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md transition-colors",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
            {counts[tab.id] > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs h-5 min-w-[20px] justify-center">
                {counts[tab.id]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="h-12 w-12" />}
          title={
            activeTab === "active"
              ? "No Active Projects"
              : activeTab === "pending"
              ? "No Pending Applications"
              : "No Rejected Applications"
          }
          description={
            activeTab === "active"
              ? "Once a supervisor accepts your application, your project will appear here."
              : activeTab === "pending"
              ? "Apply for a topic to see your pending applications here."
              : "No applications have been rejected."
          }
          actionLabel={activeTab !== "rejected" ? "Browse Topics" : undefined}
          onAction={activeTab !== "rejected" ? () => navigate("/topics") : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const topic = topics.find((t) => t.id === app.topic_id);
            if (!topic) return null;

            const supervisorNames = topic.supervisorIds
              .map((id) => {
                const s = getSupervisor(id);
                return s ? `${s.firstName} ${s.lastName}` : null;
              })
              .filter(Boolean);

            const fieldNames = topic.fieldIds
              .map((id) => getField(id)?.name)
              .filter(Boolean);

            const statusConfig = {
              accepted: { label: "Active", variant: "default" as const, className: "bg-green-600 hover:bg-green-600 text-white" },
              submitted: { label: "Pending", variant: "secondary" as const, className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
              rejected: { label: "Rejected", variant: "destructive" as const, className: "" },
            }[app.status] ?? { label: app.status, variant: "secondary" as const, className: "" };

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h3 className="font-semibold text-sm truncate">{topic.title}</h3>
                        <Badge variant={statusConfig.variant} className={cn("shrink-0", statusConfig.className)}>
                          {statusConfig.label}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {topic.description}
                      </p>

                      <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                        {supervisorNames.length > 0 && (
                          <span>Supervisor: {supervisorNames.join(", ")}</span>
                        )}
                        {fieldNames.length > 0 && (
                          <>
                            <span>·</span>
                            {fieldNames.map((f) => (
                              <Badge key={f} variant="outline" className="text-xs py-0">
                                {f}
                              </Badge>
                            ))}
                          </>
                        )}
                        <span>·</span>
                        <span>Applied {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      {app.status === "accepted" && topic.supervisorIds.length > 0 && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate(`/messages?contact=${topic.supervisorIds[0]}&role=supervisor`)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contact Supervisor
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/topics`)}
                      >
                        View <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export — delegates based on role                              */
/* ------------------------------------------------------------------ */
export default function ProjectsPage() {
  const { currentUser } = useAuth();

  if (currentUser?.role === "supervisor") {
    return <SupervisorTopicsView />;
  }

  return <StudentProjectsView />;
}
