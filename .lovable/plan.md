

## Voice, Video & Screen Share for Messages

### Overview
Add real-time voice calling, video calling, and screen sharing to the chat panel using WebRTC via the browser's native APIs. Two buttons (voice call, video call) will appear in the chat header next to the contact info. During an active call, a call UI overlay appears with controls for mute, camera toggle, screen share, and hang up.

### Technical Approach

**WebRTC peer-to-peer** with Supabase Realtime channels for signaling (exchanging SDP offers/answers and ICE candidates). No external service needed for basic 1:1 calls.

**Signaling flow:**
```text
User A clicks call → sends offer via Supabase channel → 
User B sees incoming call → accepts → sends answer → 
ICE candidates exchanged → peer connection established
```

### Changes

**1. Create `src/hooks/useWebRTC.ts`**
- Custom hook managing `RTCPeerConnection`, local/remote `MediaStream`
- Functions: `startCall(video: boolean)`, `answerCall()`, `hangUp()`, `toggleMute()`, `toggleCamera()`, `shareScreen()`
- Uses a Supabase Realtime channel (scoped to conversation ID) for signaling
- Handles ICE candidate exchange, renegotiation for screen share
- STUN servers: Google's free public STUN servers

**2. Create `src/components/CallOverlay.tsx`**
- Full-overlay component shown during active call
- Displays remote video (large) and local video (small picture-in-picture)
- Control bar: mute mic, toggle camera, share screen, hang up
- Incoming call dialog with accept/decline buttons
- Call timer display
- Audio-only mode shows avatar instead of video

**3. Update `src/pages/MessagesPage.tsx`**
- Add `Phone` and `Video` icon buttons to the chat header (line ~740, after contact info div)
- Import and render `CallOverlay` when a call is active
- Wire up the `useWebRTC` hook with the active conversation ID

**4. Create Supabase Realtime channel for signaling**
- Use `supabase.channel(`call-signal-${conversationId}`)` for WebRTC signaling
- Broadcast events: `offer`, `answer`, `ice-candidate`, `hang-up`, `call-rejected`
- No database table needed — signaling is ephemeral

### UI Layout
- Two small icon buttons (Phone, Video) in the chat header row, right-aligned
- Call overlay renders on top of the chat area when active
- Screen share replaces the remote video stream; a badge indicates "Screen sharing"

