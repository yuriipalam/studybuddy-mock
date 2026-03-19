import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, UserPlus, CheckCheck } from "lucide-react";
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
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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

export function TopBar({ onToggleChat, chatOpen }: { onToggleChat: () => void; chatOpen: boolean }) {
  const location = useLocation();
  const path = location.pathname;
  const label = routeLabels[path] || "Page";
  const [notifOpen, setNotifOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

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
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={cn(
                      "px-4 py-3 border-b border-border last:border-0 text-sm cursor-pointer transition-colors",
                      !n.read && "bg-accent/30"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={cn(
                          "mt-0.5 shrink-0 h-2 w-2 rounded-full",
                          n.type === "success" ? "bg-emerald-500" : "bg-destructive"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-medium text-xs px-2 py-0.5 rounded-md inline-block",
                            n.type === "success"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-destructive/15 text-destructive"
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
