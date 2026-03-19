import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/contexts/MessagingContext";
import CallOverlay from "@/components/CallOverlay";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type CallState = "idle" | "calling" | "incoming" | "connected";

interface CallRecord {
  conversationId: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  callType: "voice" | "video";
}

interface CallContextType {
  callState: CallState;
  startCall: (conversationId: string, targetUserId: string, targetUserName: string, video: boolean) => Promise<void>;
  activeCallConversationId: string | null;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}

// Simple ringtone using Web Audio API
function createRingtone() {
  let audioCtx: AudioContext | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isPlaying = false;

  const playTone = () => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 440;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.stop(audioCtx.currentTime + 0.5);
  };

  return {
    start() {
      if (isPlaying) return;
      isPlaying = true;
      audioCtx = new AudioContext();
      playTone();
      intervalId = setInterval(() => {
        if (audioCtx && isPlaying) {
          // Double beep pattern
          playTone();
          setTimeout(() => { if (isPlaying) playTone(); }, 200);
        }
      }, 2000);
    },
    stop() {
      isPlaying = false;
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      if (audioCtx) { audioCtx.close(); audioCtx = null; }
    },
  };
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { conversations } = useMessaging();
  const userId = currentUser?.id;
  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Someone";

  const [callState, setCallState] = useState<CallState>("idle");
  const [isVideo, setIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCallVideo, setIncomingCallVideo] = useState(false);
  const [callerName, setCallerName] = useState("");
  const [contactName, setContactName] = useState("");
  const [activeCallConversationId, setActiveCallConversationId] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const signalingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const ringChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callRecordRef = useRef<CallRecord | null>(null);
  const callStartTimeRef = useRef<Date | null>(null);
  const ringtoneRef = useRef(createRingtone());

  const cleanup = useCallback(() => {
    ringtoneRef.current.stop();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    remoteStreamRef.current = new MediaStream();
    pendingCandidatesRef.current = [];
    // Clean up signaling channel
    if (signalingChannelRef.current) {
      supabase.removeChannel(signalingChannelRef.current);
      signalingChannelRef.current = null;
    }
    setCallState("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
    setActiveCallConversationId(null);
  }, []);

  const saveCallHistory = useCallback(async (status: "completed" | "missed" | "rejected") => {
    const record = callRecordRef.current;
    if (!record) return;
    const duration = callStartTimeRef.current
      ? Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000)
      : 0;
    await supabase.from("call_history").insert({
      conversation_id: record.conversationId,
      caller_id: record.callerId,
      caller_name: record.callerName,
      receiver_id: record.receiverId,
      receiver_name: record.receiverName,
      call_type: record.callType,
      status,
      duration: status === "completed" ? duration : 0,
      started_at: callStartTimeRef.current?.toISOString() || new Date().toISOString(),
      ended_at: new Date().toISOString(),
    });
    callRecordRef.current = null;
    callStartTimeRef.current = null;
  }, []);

  const createPeerConnection = useCallback((convId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && signalingChannelRef.current) {
        signalingChannelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: e.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (e) => {
      e.streams[0]?.getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        callStartTimeRef.current = new Date();
        setCallState("connected");
        setCallDuration(0);
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      }
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        saveCallHistory("completed");
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanup, saveCallHistory]);

  const setupSignalingChannel = useCallback((convId: string) => {
    // Remove existing signaling channel if any
    if (signalingChannelRef.current) {
      supabase.removeChannel(signalingChannelRef.current);
    }

    const channel = supabase.channel(`call-signal-${convId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        const pc = pcRef.current;
        if (!pc) return;
        ringtoneRef.current.stop();
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        }
        pendingCandidatesRef.current = [];
      })
      .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
        const pc = pcRef.current;
        if (!pc || !pc.remoteDescription) {
          pendingCandidatesRef.current.push(payload.candidate);
          return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      })
      .on("broadcast", { event: "hang-up" }, () => {
        saveCallHistory("completed");
        cleanup();
      })
      .on("broadcast", { event: "call-rejected" }, () => {
        saveCallHistory("rejected");
        cleanup();
      })
      .subscribe();

    signalingChannelRef.current = channel;
    return channel;
  }, [cleanup, saveCallHistory]);

  // Subscribe to user-level ring channel for incoming calls
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(`call-ring-${userId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "incoming-call" }, ({ payload }) => {
        if (callState !== "idle") return; // Already in a call
        setCallerName(payload.callerName || "Someone");
        setContactName(payload.callerName || "Someone");
        setIncomingCallVideo(payload.video);
        setActiveCallConversationId(payload.conversationId);
        setCallState("incoming");

        // Store the offer SDP and caller info
        (window as any).__pendingOffer = payload.sdp;
        (window as any).__pendingCallRecord = {
          conversationId: payload.conversationId,
          callerId: payload.callerId,
          callerName: payload.callerName,
          receiverId: userId,
          receiverName: userName,
          callType: payload.video ? "video" : "voice",
        };

        // Start ringtone
        ringtoneRef.current.start();
      })
      .subscribe();

    ringChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      ringChannelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const startCall = useCallback(async (conversationId: string, targetUserId: string, targetUserName: string, video: boolean) => {
    if (callState !== "idle") return;

    setIsVideo(video);
    setCallState("calling");
    setActiveCallConversationId(conversationId);
    setContactName(targetUserName);

    // Set up call record
    callRecordRef.current = {
      conversationId,
      callerId: userId!,
      callerName: userName,
      receiverId: targetUserId,
      receiverName: targetUserName,
      callType: video ? "video" : "voice",
    };

    // No ringtone for the caller — only the receiver hears it

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    // Set up signaling channel for this conversation
    const sigChannel = setupSignalingChannel(conversationId);
    const pc = createPeerConnection(conversationId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Send offer via signaling channel
    sigChannel.send({
      type: "broadcast",
      event: "offer",
      payload: { sdp: offer, video, callerName: userName },
    });

    // Ring the target user via their personal ring channel
    const targetRingChannel = supabase.channel(`call-ring-${targetUserId}`, {
      config: { broadcast: { self: false } },
    });
    await targetRingChannel.subscribe();
    targetRingChannel.send({
      type: "broadcast",
      event: "incoming-call",
      payload: {
        sdp: offer,
        video,
        callerName: userName,
        callerId: userId,
        conversationId,
      },
    });
    // Clean up the temporary ring channel after sending
    setTimeout(() => supabase.removeChannel(targetRingChannel), 2000);
  }, [callState, userId, userName, setupSignalingChannel, createPeerConnection]);

  const answerCall = useCallback(async () => {
    const convId = activeCallConversationId;
    if (!convId) return;

    ringtoneRef.current.stop();

    const pendingRecord = (window as any).__pendingCallRecord;
    if (pendingRecord) {
      callRecordRef.current = pendingRecord;
      delete (window as any).__pendingCallRecord;
    }

    const video = incomingCallVideo;
    setIsVideo(video);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    // Set up signaling channel
    const sigChannel = setupSignalingChannel(convId);
    const pc = createPeerConnection(convId);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offerSdp = (window as any).__pendingOffer;
    if (offerSdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      delete (window as any).__pendingOffer;
    }

    for (const c of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    sigChannel.send({
      type: "broadcast",
      event: "answer",
      payload: { sdp: answer },
    });

    setCallState("connected");
  }, [activeCallConversationId, incomingCallVideo, setupSignalingChannel, createPeerConnection]);

  const rejectCall = useCallback(() => {
    ringtoneRef.current.stop();
    const convId = activeCallConversationId;

    // Save as missed/rejected
    const pendingRecord = (window as any).__pendingCallRecord;
    if (pendingRecord) {
      callRecordRef.current = pendingRecord;
      delete (window as any).__pendingCallRecord;
    }
    saveCallHistory("missed");

    if (convId) {
      // Notify caller via signaling channel
      const channel = supabase.channel(`call-signal-${convId}`, {
        config: { broadcast: { self: false } },
      });
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({ type: "broadcast", event: "call-rejected", payload: {} });
          setTimeout(() => supabase.removeChannel(channel), 1000);
        }
      });
    }

    delete (window as any).__pendingOffer;
    setCallState("idle");
    setActiveCallConversationId(null);
  }, [activeCallConversationId, saveCallHistory]);

  const hangUp = useCallback(() => {
    ringtoneRef.current.stop();
    signalingChannelRef.current?.send({ type: "broadcast", event: "hang-up", payload: {} });
    saveCallHistory(callState === "connected" ? "completed" : "missed");
    cleanup();
  }, [cleanup, saveCallHistory, callState]);

  const toggleMute = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  }, []);

  const shareScreen = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, screenStream);
      }
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack && sender) sender.replaceTrack(camTrack);
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      };
    } catch {
      // User cancelled screen share picker
    }
  }, [isScreenSharing]);

  return (
    <CallContext.Provider value={{ callState, startCall, activeCallConversationId }}>
      {children}
      <CallOverlay
        callState={callState}
        isVideo={isVideo}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        callDuration={callDuration}
        callerName={callerName}
        contactName={contactName}
        incomingCallVideo={incomingCallVideo}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onAnswer={answerCall}
        onReject={rejectCall}
        onHangUp={hangUp}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
        onShareScreen={shareScreen}
      />
    </CallContext.Provider>
  );
}
