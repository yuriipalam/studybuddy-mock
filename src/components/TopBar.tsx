import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, UserPlus } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation } from "react-router-dom";

const routeLabels: Record<string, string> = {
  "/": "Home",
  "/messages": "Messages",
  "/projects": "My Projects",
  "/topics": "Topics",
  "/jobs": "Jobs",
  "/people/experts": "Experts",
  "/people/students": "Students",
  "/people/supervisors": "Supervisors",
  "/organizations/companies": "Industry Partners",
  "/organizations/study-programs": "Study Programs",
  "/settings": "My Settings",
};

export function TopBar({ onToggleChat, chatOpen }: { onToggleChat: () => void; chatOpen: boolean }) {
  const location = useLocation();
  const path = location.pathname;
  const label = routeLabels[path] || "Page";

  const segments = path.split("/").filter(Boolean);
  const parentLabel = segments.length > 1 ? routeLabels["/" + segments[0]] || segments[0] : null;

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            {parentLabel && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink>{parentLabel}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </Button>
        <Button
          variant={chatOpen ? "default" : "ghost"}
          size="icon"
          onClick={onToggleChat}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
