import { useState } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  "/ranking": "Rankings",
  "/settings": "My Settings",
};

const mockNotifications = [
  { id: 1, text: "New topic suggestion available", time: "2m ago", read: false },
  { id: 2, text: "Prof. Schmidt commented on your proposal", time: "1h ago", read: false },
  { id: 3, text: "Your thesis topic was approved", time: "3h ago", read: true },
];

export function TopBar({ onToggleChat, chatOpen }: { onToggleChat: () => void; chatOpen: boolean }) {
  const location = useLocation();
  const path = location.pathname;
  const label = routeLabels[path] || "Page";
  const [notifOpen, setNotifOpen] = useState(false);

  const segments = path.split("/").filter(Boolean);
  const parentLabel = segments.length > 1 ? routeLabels["/" + segments[0]] || segments[0] : null;

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

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
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Notifications</p>
            </div>
            <div className="max-h-64 overflow-auto">
              {mockNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border last:border-0 text-sm ${!n.read ? "bg-accent/50" : ""}`}
                >
                  <p className="text-foreground">{n.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
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
