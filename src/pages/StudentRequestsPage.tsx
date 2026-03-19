import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { projects as allProjects, getStudent, getUniversity, getStudyProgram, getField } from "@/data";
import type { ThesisProject, ProjectState } from "@/data/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Eye, Clock, User, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useXpEngine, XP_TRIGGERS } from "@/hooks/useXpEngine";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const STORAGE_KEY = "studyond-project-decisions";

function loadDecisions(): Record<string, ProjectState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveDecision(projectId: string, state: ProjectState) {
  const decisions = loadDecisions();
  decisions[projectId] = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
}

type TabId = "pending" | "accepted" | "rejected";

export default function StudentRequestsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { awardXp } = useXpEngine();
  const [decisions, setDecisions] = useState(loadDecisions);
  const [activeTab, setActiveTab] = useState<TabId>("pending");
  const [viewProject, setViewProject] = useState<ThesisProject | null>(null);

  const supervisorId = currentUser?.id ?? "";

  // Get all projects that involve this supervisor or are proposed (unassigned) at same university
  const relevantProjects = useMemo(() => {
    return allProjects.filter((p) => {
      // Projects directly assigned to this supervisor
      if (p.supervisorIds.includes(supervisorId)) return true;
      // Proposed projects at same university (supervisor can pick up)
      if (p.state === "proposed" && p.universityId === "uni-01") return true;
      // Applied projects at same university
      if (p.state === "applied" && p.universityId === "uni-01") return true;
      return false;
    });
  }, [supervisorId]);

  const getEffectiveState = useCallback(
    (project: ThesisProject): ProjectState => {
      return decisions[project.id] ?? project.state;
    },
    [decisions]
  );

  const pending = useMemo(
    () => relevantProjects.filter((p) => {
      const state = getEffectiveState(p);
      return state === "proposed" || state === "applied";
    }),
    [relevantProjects, getEffectiveState]
  );

  const accepted = useMemo(
    () => relevantProjects.filter((p) => {
      const state = getEffectiveState(p);
      return state === "agreed" || state === "in_progress";
    }),
    [relevantProjects, getEffectiveState]
  );

  const rejected = useMemo(
    () => relevantProjects.filter((p) => getEffectiveState(p) === "rejected"),
    [relevantProjects, getEffectiveState]
  );

  const handleAccept = (project: ThesisProject) => {
    saveDecision(project.id, "agreed");
    setDecisions(loadDecisions());
    // Award XP to the student, not the supervisor
    if (project.studentId) {
      awardXp(XP_TRIGGERS.SUPERVISOR_INTERACTION, project.studentId);
    }
    toast.success(`Accepted "${project.title}"`);
  };

  const handleReject = (project: ThesisProject) => {
    saveDecision(project.id, "rejected");
    setDecisions(loadDecisions());
    toast.info(`Declined "${project.title}"`);
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

      {/* List */}
      {currentList.length === 0 ? (
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
          {currentList.map((project) => {
            const student = getStudent(project.studentId);
            const university = getUniversity(project.universityId ?? "");
            const effectiveState = getEffectiveState(project);

            return (
              <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="font-semibold">
                        {student ? `${student.firstName[0]}${student.lastName[0]}` : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground leading-snug">
                            {project.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {student && (
                              <span
                                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer flex items-center gap-1"
                                onClick={() => navigate(`/people/students/${student.id}`)}
                              >
                                <User className="h-3 w-3" />
                                {student.firstName} {student.lastName}
                              </span>
                            )}
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
                            effectiveState === "agreed" && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                            effectiveState === "rejected" && "border-destructive/30 text-destructive bg-destructive/10",
                            (effectiveState === "proposed" || effectiveState === "applied") && "border-amber-500/30 text-amber-600 bg-amber-500/10"
                          )}
                        >
                          {effectiveState === "agreed" ? "Accepted" : effectiveState}
                        </Badge>
                      </div>

                      {project.motivation && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          "{project.motivation}"
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
                          onClick={() => setViewProject(project)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View Details
                        </Button>
                        {activeTab === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleAccept(project)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(project)}
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
      <Dialog open={!!viewProject} onOpenChange={(o) => !o && setViewProject(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewProject?.title}</DialogTitle>
            <DialogDescription>
              {viewProject?.studentId && (() => {
                const s = getStudent(viewProject.studentId);
                return s ? `By ${s.firstName} ${s.lastName}` : "";
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {viewProject?.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm leading-relaxed">{viewProject.description}</p>
              </div>
            )}
            {viewProject?.motivation && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Student's Motivation</p>
                <p className="text-sm leading-relaxed italic">"{viewProject.motivation}"</p>
              </div>
            )}
            {viewProject && (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Status:</p>
                <Badge variant="outline" className="capitalize">{getEffectiveState(viewProject)}</Badge>
              </div>
            )}
            {viewProject && activeTab === "pending" && (
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => { handleAccept(viewProject); setViewProject(null); }}
                >
                  <Check className="h-4 w-4" />
                  Accept Request
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10"
                  onClick={() => { handleReject(viewProject); setViewProject(null); }}
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
