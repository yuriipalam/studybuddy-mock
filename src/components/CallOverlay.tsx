import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Phone as PhoneIcon,
} from "lucide-react";
import type { CallState } from "@/contexts/CallContext";
import { cn } from "@/lib/utils";

interface CallOverlayProps {
  callState: CallState;
  isVideo: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  callerName: string;
  contactName: string;
  incomingCallVideo: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  onAnswer: () => void;
  onReject: () => void;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onShareScreen: () => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export default function CallOverlay({
  callState,
  isVideo,
  isMuted,
  isCameraOff,
  isScreenSharing,
  callDuration,
  callerName,
  contactName,
  incomingCallVideo,
  localVideoRef,
  remoteVideoRef,
  onAnswer,
  onReject,
  onHangUp,
  onToggleMute,
  onToggleCamera,
  onShareScreen,
}: CallOverlayProps) {
  const remoteRef = useRef<HTMLVideoElement>(null);
  const localRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (remoteRef.current) {
      (remoteVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = remoteRef.current;
    }
    if (localRef.current) {
      (localVideoRef as React.MutableRefObject<HTMLVideoElement | null>).current = localRef.current;
    }
  });

  if (callState === "idle") return null;

  // Incoming call dialog — fixed full-screen overlay
  if (callState === "incoming") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 p-8 rounded-2xl bg-card border shadow-xl max-w-xs text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-primary/30 animate-pulse">
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {callerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="text-xl font-bold text-foreground">{callerName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Incoming {incomingCallVideo ? "video" : "voice"} call…
            </p>
          </div>
          <div className="flex gap-6">
            <Button
              size="lg"
              variant="destructive"
              className="rounded-full h-16 w-16 shadow-lg"
              onClick={onReject}
            >
              <PhoneOff className="h-7 w-7" />
            </Button>
            <Button
              size="lg"
              className="rounded-full h-16 w-16 bg-green-600 hover:bg-green-700 text-white shadow-lg"
              onClick={onAnswer}
            >
              <PhoneIcon className="h-7 w-7" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const showName = contactName || "Contact";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm">
      {/* Main video / avatar area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-28 w-28">
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                {showName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xl font-semibold text-foreground">{showName}</p>
          </div>
        )}

        {/* Local video PiP */}
        {isVideo && (
          <div className="absolute bottom-4 right-4 w-36 h-28 rounded-lg overflow-hidden border-2 border-border shadow-lg bg-muted">
            <video
              ref={localRef}
              autoPlay
              playsInline
              muted
              className={cn("w-full h-full object-cover", isCameraOff && "hidden")}
            />
            {isCameraOff && (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {callState === "calling" && (
            <Badge variant="secondary" className="animate-pulse">Calling…</Badge>
          )}
          {callState === "connected" && (
            <Badge variant="secondary">{formatDuration(callDuration)}</Badge>
          )}
          {isScreenSharing && (
            <Badge className="bg-blue-600 text-white">Screen sharing</Badge>
          )}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 py-5 px-4 bg-card border-t">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={onToggleMute}
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>

        {isVideo && (
          <Button
            variant={isCameraOff ? "destructive" : "outline"}
            size="icon"
            className="rounded-full h-12 w-12"
            onClick={onToggleCamera}
          >
            {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        )}

        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={onShareScreen}
        >
          <MonitorUp className="h-5 w-5" />
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-12 w-12"
          onClick={onHangUp}
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
