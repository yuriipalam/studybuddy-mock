import { Home, MessageSquare, FolderKanban, BookOpen, Briefcase, Users, Building2, Settings, GraduationCap, UserCheck, User, School, LogOut, Trophy } from "lucide-react";
import studyondLogo from "@/assets/studyond.svg";
import studyondLogoLight from "@/assets/studyond-light.svg";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

const personalItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "My Projects", url: "/projects", icon: FolderKanban },
];

const exploreItems = [
  { title: "Topics", url: "/topics", icon: BookOpen },
  { title: "Jobs", url: "/jobs", icon: Briefcase },
];

const peopleSubItems = [
  { title: "Experts", url: "/people/experts", icon: UserCheck },
  { title: "Students", url: "/people/students", icon: GraduationCap },
  { title: "Supervisors", url: "/people/supervisors", icon: User },
];

const orgSubItems = [
  { title: "Industry Partners", url: "/organizations/companies", icon: Building2 },
  { title: "Study Programs", url: "/organizations/study-programs", icon: GraduationCap },
  { title: "Universities", url: "/organizations/universities", icon: School },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { currentUser, logout } = useAuth();
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === "dark" ? studyondLogoLight : studyondLogo;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/");
  const isPeopleActive = peopleSubItems.some((i) => currentPath === i.url || currentPath.startsWith(i.url + "/"));
  const isOrgActive = orgSubItems.some((i) => currentPath === i.url || currentPath.startsWith(i.url + "/"));

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 pb-2">
          {!collapsed && (
            <img src={logo} alt="Studyond" className="h-6" />
          )}
          {collapsed && (
            <img src={logo} alt="Studyond" className="h-5 w-5 object-contain" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Explore</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {exploreItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* People collapsible */}
              <Collapsible defaultOpen={isPeopleActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isPeopleActive}>
                      <Users className="h-4 w-4" />
                      <span>People</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {peopleSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                            <NavLink to={sub.url}>
                              <sub.icon className="h-3.5 w-3.5" />
                              <span>{sub.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* Organizations collapsible */}
              <Collapsible defaultOpen={isOrgActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={isOrgActive}>
                      <Building2 className="h-4 w-4" />
                      <span>Organizations</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {orgSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton asChild isActive={isActive(sub.url)}>
                            <NavLink to={sub.url}>
                              <sub.icon className="h-3.5 w-3.5" />
                              <span>{sub.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {currentUser?.role === "student" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/ranking")}>
                <NavLink to="/ranking">
                  <Trophy className="h-4 w-4" />
                  <span>My Ranking</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")}>
              <NavLink to="/settings">
                <Settings className="h-4 w-4" />
                <span>My Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && currentUser && (
          <div className="flex items-center gap-3 px-3 py-2 border-t border-border">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback>{currentUser.firstName[0]}{currentUser.lastName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{currentUser.firstName} {currentUser.lastName}</span>
                <Badge variant="outline" className="text-[10px] capitalize px-1 py-0">{currentUser.role}</Badge>
              </div>
              <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
