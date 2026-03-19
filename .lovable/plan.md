

## Plan: Add "My Ranking" Navigation Item

### What
Add a new "My Ranking" nav item in the sidebar footer, positioned directly above "My Settings".

### Changes

**File: `src/components/AppSidebar.tsx`**
- Import a ranking icon (e.g., `Trophy` from lucide-react)
- Add a new `SidebarMenuItem` for "My Ranking" linking to `/ranking`, placed above the existing "My Settings" item in the `SidebarFooter`

**File: `src/App.tsx`**
- Add a route for `/ranking` pointing to a new `RankingPage`

**File: `src/pages/RankingPage.tsx`** (new)
- Create a placeholder page for "My Ranking"

