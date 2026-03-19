

## Chat Improvements Plan

### Issues to Fix

1. **No optimistic updates** -- messages only appear after the server roundtrip, causing a perceived delay
2. **Read receipts invisible in dark mode** -- the `text-primary` color for the double-check icon blends into the dark bubble background
3. **Automatic greeting message on conversation start** -- `startConversation` inserts a fake message from the contact
4. **Typing indicator not visible** -- the broadcast channel works but the UI doesn't surface it reliably due to the indicator rendering logic

### Plan

#### 1. Optimistic message sending (MessagingContext + MessagesPage)

In `sendMessage`, immediately append a message with a temporary `id` (e.g. `temp-${uuid}`) to the local `messages` state before the Supabase insert. When the realtime INSERT event arrives, replace the temp message with the real one by matching `content + sender_id + conversation_id`. Also optimistically update the conversation list's `lastMessage`. On error, remove the temp message and show a toast.

#### 2. Fix dark mode read receipts (MessagesPage)

Change `ReadReceipt` icon colors:
- Read (double check): use `text-blue-400` instead of `text-primary` so it's visible on both light and dark primary backgrounds
- Unread (single check): use `text-primary-foreground/50` when inside a sent bubble (which has `bg-primary`)

#### 3. Remove automatic greeting message (MessagingContext)

Delete the `supabase.from("messages").insert(...)` block at the end of `startConversation` that sends "Hi! Thanks for connecting with me on StudyOnd..." on behalf of the contact. Conversations will start empty.

#### 4. Fix typing indicator visibility (MessagingContext)

The typing broadcast channel subscription currently only subscribes on first call to `setTyping`. This means if the other user types first, the current user's client hasn't joined the channel yet. Fix by subscribing to the typing channel for each active conversation when `activeConversationId` changes, not only when the current user starts typing.

### Files to Change

- **`src/contexts/MessagingContext.tsx`** -- optimistic send, remove auto-message, proactive typing channel subscription
- **`src/pages/MessagesPage.tsx`** -- fix read receipt colors for dark mode, handle optimistic message display

### Technical Details

Optimistic message shape:
```typescript
const tempMsg: DbMessage = {
  id: `temp-${crypto.randomUUID()}`,
  conversation_id: conversationId,
  sender_id: userId,
  content,
  created_at: new Date().toISOString(),
  read_at: null,
};
```

Realtime deduplication: when an INSERT arrives, check if a temp message with same `content`, `sender_id`, and `conversation_id` exists within a 10-second window, and replace it.

Read receipt color fix:
```tsx
// Inside sent message bubble (bg-primary)
readAt ? <CheckCheck className="h-3 w-3 text-blue-400" />
       : <Check className="h-3 w-3 text-primary-foreground/50" />
```

Typing channel: subscribe in a `useEffect` keyed on `activeConversationId` so both parties are listening before either starts typing.

