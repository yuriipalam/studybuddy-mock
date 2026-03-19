

# Studyond Clone — Implementation Plan (shadcn/ui)

## Overview
Build a full Studyond clone using **shadcn/ui components** throughout, with in-memory mock data. All UI primitives (buttons, cards, inputs, badges, avatars, dropdowns, sheets, tooltips, etc.) come from the existing shadcn/ui library already installed in the project.

## Architecture

### Layout (`src/components/Layout.tsx`)
- **SidebarProvider** + **Sidebar** (collapsible="icon") from `@/components/ui/sidebar`
- Sidebar sections using SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton
- Personal: Home, Messages, My Projects
- Explore: Topics, Jobs, People (sub-items: Experts, Students, Supervisors), Organizations (sub-items: Industry Partners, Study Programs)
- Footer: Settings + user avatar using **Avatar** component
- Top bar with **SidebarTrigger**, breadcrumbs, notification **Button** (ghost/icon), Invite **Button**
- Active route highlighting via **NavLink**

### Routing (`src/App.tsx`)
10 routes: `/`, `/messages`, `/projects`, `/topics`, `/jobs`, `/people/experts`, `/people/students`, `/people/supervisors`, `/organizations/companies`, `/organizations/study-programs`, `/settings`

### Mock Data (`src/data/`)
Files: `mockTopics.ts`, `mockJobs.ts`, `mockExperts.ts`, `mockStudents.ts`, `mockSupervisors.ts`, `mockCompanies.ts`, `mockStudyPrograms.ts`, `mockUser.ts`
- Each exports typed arrays + simulated async fetch functions with ~200ms delay
- Client-side filtering/search helpers

### Pages (all using shadcn/ui)

| Page | Key shadcn components |
|---|---|
| **Home** `/` | Card, Button, Avatar, Badge |
| **Messages** `/messages` | Card, Input, ScrollArea, Separator, Avatar |
| **My Projects** `/projects` | Card, Button (empty state) |
| **Topics** `/topics` | Input, Select (filters), Button, Card, Badge, ScrollArea, Separator |
| **Jobs** `/jobs` | Same as Topics |
| **People** (3 sub-pages) | Select (switcher), Input, Badge, Card, Avatar |
| **Organizations** (2 sub-pages) | Select (switcher), Input, Badge, Card, Avatar |
| **Settings** `/settings` | Card, Input, Label, Button, Separator |

### Component Breakdown

**Shared components** (`src/components/`):
- `Layout.tsx` — SidebarProvider wrapper + AppSidebar + top bar
- `AppSidebar.tsx` — Full sidebar using shadcn Sidebar primitives
- `TopBar.tsx` — Header with SidebarTrigger, breadcrumbs, actions
- `FilterBar.tsx` — Reusable row of Select dropdowns + Input search
- `EntityCard.tsx` — Reusable card for people/orgs (Avatar + Badge + stats)
- `TopicJobCard.tsx` — List item card for topics/jobs
- `DetailPanel.tsx` — Right-side detail view for topics/jobs
- `EmptyState.tsx` — Reusable empty state with icon + message + CTA Button

### Styling
- Indigo primary via CSS variables in `index.css` (override `--primary` HSL)
- Montserrat for headings (font-heading), Inter for body (already default)
- Soft gray background `bg-muted/30` on main content area
- All spacing, borders, radiuses from Tailwind + shadcn defaults

### Interactions
- Sidebar nav with active states (NavLink + SidebarMenuButton)
- Master-detail: clicking a topic/job card updates the detail panel (React state, no routing)
- Search Input filters lists in real-time
- Select dropdowns filter by category
- Bookmark toggle via Button (icon variant), state in memory
- People/Orgs sub-page switching via Select dropdown

### File Count Estimate
- ~8 mock data files
- ~8 page components
- ~8 shared components
- Layout + Sidebar + TopBar
- Total: ~27 new files

