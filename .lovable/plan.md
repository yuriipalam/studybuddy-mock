

## Show Milestones Tab for Supervisors in Student Chats

### Problem
The Milestones tab currently only appears when the **contact** is a supervisor (`contact?.user_role === "supervisor"`). When a supervisor is chatting with a student, the contact is a student, so the tab is hidden from the supervisor's view.

### Fix
Change the condition on line 814 of `MessagesPage.tsx` from:

```tsx
{contact?.user_role === "supervisor" && ( ... )}
```

to:

```tsx
{(contact?.user_role === "supervisor" || currentUser?.role === "supervisor") && ( ... )}
```

This shows the Milestones tab whenever **either** party is a supervisor — covering both the student's view (contact is supervisor) and the supervisor's view (current user is supervisor).

### Files Changed
- `src/pages/MessagesPage.tsx` — one line condition update

