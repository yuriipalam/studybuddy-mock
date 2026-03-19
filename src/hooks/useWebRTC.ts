import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export type CallState = "idle" | "calling" | "incoming" | "connected";

interface UseWebRTCOptions {
  conversationId: string | null;
  userId: string | undefined;
  contactName?: string;
}

export function useWebRTC({ conversationId, userId, contactName }: UseWebRTCOptions) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [isVideo, setIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [incomingCallVideo, setIncomingCallVideo] = useState(false);
  const [callerName, setCallerName] = useState("");

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream>(new MediaStream());
  const screenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const isInitiatorRef = useRef(false);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    remoteStreamRef.current = new MediaStream();
    pendingCandidatesRef.current = [];
    setCallState("idle");
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsScreenSharing(false);
  }, []);

  // Subscribe to signaling channel
  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase.channel(`call-signal-${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "offer" }, async ({ payload }) => {
        if (callState === "connected" || callState === "calling") return;
        setCallerName(payload.callerName || "Someone");
        setIncomingCallVideo(payload.video);
        setCallState("incoming");
        // Store the offer to use when answering
        (window as any).__pendingOffer = payload.sdp;
      })
      .on("broadcast", { event: "answer" }, async ({ payload }) => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        // Flush pending candidates
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
        cleanup();
      })
      .on("broadcast", { event: "call-rejected" }, () => {
        cleanup();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
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
        setCallState("connected");
        setCallDuration(0);
        timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
      }
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [cleanup]);

  const startCall = useCallback(async (video: boolean) => {
    if (!channelRef.current) return;
    isInitiatorRef.current = true;
    setIsVideo(video);
    setCallState("calling");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const pc = createPeerConnection();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current.send({
      type: "broadcast",
      event: "offer",
      payload: { sdp: offer, video, callerName: contactName || "Someone" },
    });
  }, [createPeerConnection, contactName]);

  const answerCall = useCallback(async () => {
    if (!channelRef.current) return;
    isInitiatorRef.current = false;
    const video = incomingCallVideo;
    setIsVideo(video);
    setCallState("connected");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const pc = createPeerConnection();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offerSdp = (window as any).__pendingOffer;
    if (offerSdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(offerSdp));
      delete (window as any).__pendingOffer;
    }

    // Flush pending candidates
    for (const c of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    channelRef.current.send({
      type: "broadcast",
      event: "answer",
      payload: { sdp: answer },
    });
  }, [createPeerConnection, incomingCallVideo]);

  const rejectCall = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "call-rejected", payload: {} });
    delete (window as any).__pendingOffer;
    setCallState("idle");
  }, []);

  const hangUp = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "hang-up", payload: {} });
    cleanup();
  }, [cleanup]);

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
      // Stop screen share, restore camera
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

  return {
    callState,
    isVideo,
    isMuted,
    isCameraOff,
    isScreenSharing,
    callDuration,
    callerName,
    incomingCallVideo,
    localVideoRef,
    remoteVideoRef,
    startCall,
    answerCall,
    rejectCall,
    hangUp,
    toggleMute,
    toggleCamera,
    shareScreen,
  };
}
