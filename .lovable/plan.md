

## Add XP Badge to Home Page

### What
Display the current user's total XP prominently in the top-right corner of the Home page header area, next to the greeting. It will be a visually distinct badge with a star/sparkle icon and the XP number.

### How

**File: `src/pages/HomePage.tsx`**

1. Import `useStudentXp` hook and find the current user's XP row by matching `student_id` to `currentUser.id`
2. Modify the greeting header section to use `flex justify-between items-start` layout
3. Add an XP badge on the right side — a rounded pill with a gradient background (e.g., amber/yellow), a star icon, and the total XP number in bold text
4. Only show for students (`currentUser?.role === "student"`)
5. If no XP row found yet, show "0 XP" as fallback

### Visual Design
- Pill-shaped badge: `bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full px-4 py-2`
- Star icon + bold number + "XP" label
- Subtle shadow for prominence

### No other files need changes
The `useStudentXp` hook already fetches all rows with realtime subscription, so XP updates will reflect automatically.

