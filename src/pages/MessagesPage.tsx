import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageSquare, Send, Check, CheckCheck, Pencil, X, Trash2, Paperclip, FileText, Image as ImageIcon, File as FileIcon, Download, Eye, ExternalLink, Plus, Circle, CheckCircle2, Pin, PinOff, Loader2, Sparkles, Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { useCall } from "@/contexts/CallContext";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useMessaging, ChatFile } from "@/contexts/MessagingContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getStudent, getSupervisor, getExpert, getUniversity, getCompany, getFieldNames } from "@/data";
import { cn } from "@/lib/utils";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowDate.getTime() - dDate.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function ReadReceipt({ isMe, readAt }: { isMe: boolean; readAt: string | null }) {
  if (!isMe) return null;
  return readAt ? (
    <CheckCheck className="h-3 w-3 text-blue-400 shrink-0" />
  ) : (
    <Check className="h-3 w-3 text-primary-foreground/50 shrink-0" />
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

function OnlineIndicator({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-2.5 w-2.5 border-[1.5px]" : "h-3 w-3 border-2";
  return (
    <span className={cn("absolute bottom-0 right-0 rounded-full bg-green-500 border-background", s)} />
  );
}

// Real online status based on last_seen_at (online if seen within 5 minutes)
// Supervisors are always shown as online.
function useOnlineStatus(userIds: string[], roleMap: Record<string, string>) {
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (userIds.length === 0) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("user_accounts")
        .select("id, last_seen_at")
        .in("id", userIds);

      if (data) {
        const now = Date.now();
        const map: Record<string, boolean> = {};
        for (const u of data) {
          map[u.id] = u.last_seen_at
            ? now - new Date(u.last_seen_at).getTime() < 5 * 60 * 1000
            : false;
        }
        setOnlineMap(map);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, [userIds.join(",")]);

  return (userId: string) => {
    // Supervisors always appear online
    if (roleMap[userId] === "supervisor") return true;
    return !!onlineMap[userId];
  };
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const { currentUser } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
    sendMessageWithFiles,
    editMessage,
    deleteMessage,
    deleteConversation,
    markAsRead,
    setTyping,
    typingUsers,
    loading,
    messagesLoading,
    uploadFile,
    getConversationFiles,
    startConversation,
    getConversationByContact,
  } = useMessaging();

  const allContactIds = conversations.map((c) => {
    const ct = c.participants.find((p: any) => p.user_id !== currentUser?.id);
    return ct?.user_id || "";
  }).filter(Boolean);
  const isOnline = useOnlineStatus(allContactIds);

  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [deleteConvId, setDeleteConvId] = useState<string | null>(null);
  const [chatTab, setChatTab] = useState<"messages" | "files" | "milestones">("messages");
  const [convFiles, setConvFiles] = useState<ChatFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<ChatFile | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [milestones, setMilestones] = useState<{ id: string; text: string; description: string; completed: boolean }[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [milestonesEditMode, setMilestonesEditMode] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneText, setEditMilestoneText] = useState("");
  const [editMilestoneDesc, setEditMilestoneDesc] = useState("");
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [improvedText, setImprovedText] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);

  // Auto-open conversation from URL params (e.g. ?contact=supervisor-01&role=supervisor)
  useEffect(() => {
    const contactId = searchParams.get("contact");
    const contactRole = searchParams.get("role") || "supervisor";
    if (!contactId || !currentUser || loading) return;

    // Check if conversation already exists
    const existing = getConversationByContact(contactId);
    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      // Look up name from data
      const lookup = contactRole === "supervisor"
        ? getSupervisor(contactId)
        : contactRole === "expert"
          ? getExpert(contactId)
          : getStudent(contactId);
      const name = lookup ? `${(lookup as any).firstName} ${(lookup as any).lastName}` : contactId;
      startConversation({ id: contactId, name, role: contactRole });
    }
    // Clear the URL params
    window.history.replaceState({}, "", "/messages");
  }, [loading, currentUser]);

  // Load milestones from DB when conversation changes; seed defaults if empty
  useEffect(() => {
    if (!activeConversationId) { setMilestones([]); return; }
    let cancelled = false;
    const load = async () => {
      setMilestonesLoading(true);
      const { data } = await supabase
        .from("milestones")
        .select("*")
        .eq("conversation_id", activeConversationId)
        .order("position", { ascending: true });
      if (cancelled) return;
      if (data && data.length > 0) {
        setMilestones(data.map((r: any) => ({ id: r.id, text: r.text, description: r.description || "", completed: r.completed })));
      } else {
        // Auto-seed with default milestones
        const { getDefaultMilestones } = await import("@/data/topicMilestones");
        const defaults = getDefaultMilestones(); // generic for now
        const rows = defaults.map((m, i) => ({
          conversation_id: activeConversationId,
          text: m.text.slice(0, 150),
          description: m.description.slice(0, 300),
          position: i,
          completed: false,
        }));
        const { data: inserted } = await supabase
          .from("milestones")
          .insert(rows)
          .select();
        if (!cancelled && inserted) {
          setMilestones(inserted.map((r: any) => ({ id: r.id, text: r.text, description: r.description || "", completed: r.completed })));
        }
      }
      setMilestonesLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [activeConversationId]);

  const dbAddMilestone = async (text: string, description: string = "") => {
    if (!activeConversationId) return;
    const position = milestones.length;
    const { data } = await supabase
      .from("milestones")
      .insert({ conversation_id: activeConversationId, text: text.slice(0, 150), description: description.slice(0, 300), position, completed: false })
      .select()
      .single();
    if (data) setMilestones((prev) => [...prev, { id: data.id, text: data.text, description: data.description || "", completed: data.completed }]);
  };

  const dbToggleMilestone = async (id: string, completed: boolean) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, completed } : m)));
    await supabase.from("milestones").update({ completed }).eq("id", id);
  };

  const dbEditMilestone = async (id: string, text: string, description: string) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, text, description } : m)));
    await supabase.from("milestones").update({ text: text.slice(0, 150), description: description.slice(0, 300) }).eq("id", id);
  };

  const dbDeleteMilestone = async (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("milestones").delete().eq("id", id);
  };
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [dragging, setDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const userId = currentUser?.id;

  // Load pinned conversations
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("pinned_conversations")
      .select("conversation_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (!cancelled && data) {
          setPinnedIds(new Set(data.map((r: any) => r.conversation_id)));
        }
      });
    return () => { cancelled = true; };
  }, [userId]);

  const MAX_PINS = 5;

  const togglePin = async (conversationId: string) => {
    if (!userId) return;
    if (pinnedIds.has(conversationId)) {
      setPinnedIds((prev) => { const next = new Set(prev); next.delete(conversationId); return next; });
      await supabase.from("pinned_conversations").delete().eq("user_id", userId).eq("conversation_id", conversationId);
    } else {
      if (pinnedIds.size >= MAX_PINS) {
        toast.error(`You can pin up to ${MAX_PINS} chats`);
        return;
      }
      setPinnedIds((prev) => new Set(prev).add(conversationId));
      await supabase.from("pinned_conversations").insert({ user_id: userId, conversation_id: conversationId });
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const getContact = (conv: typeof conversations[0]) =>
    conv.participants.find((p) => p.user_id !== userId);

  const activeContact = activeConv ? getContact(activeConv) : null;

  const { startCall } = useCall();

  const filteredConvs = conversations
    .filter((c) => {
      if (!search) return true;
      const contact = getContact(c);
      return contact?.user_name.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const aPinned = pinnedIds.has(a.id) ? 0 : 1;
      const bPinned = pinnedIds.has(b.id) ? 0 : 1;
      return aPinned - bPinned;
    });

  useEffect(() => {
    if (chatTab === "messages") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, chatTab]);

  useEffect(() => {
    if (activeConversationId) {
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, messages.length, markAsRead]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (!activeConversationId) return;

      setTyping(activeConversationId, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (activeConversationId) setTyping(activeConversationId, false);
      }, 3000);
    },
    [activeConversationId, setTyping]
  );

  const handleSend = async () => {
    if (!input.trim() && pendingFiles.length === 0) return;
    if (!activeConversationId) return;
    const content = input.trim();
    setInput("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (pendingFiles.length > 0) {
      const filesToSend = [...pendingFiles];
      setPendingFiles([]);
      setUploading(true);
      await sendMessageWithFiles(activeConversationId, content, filesToSend);
      setUploading(false);
      await loadFiles();
    } else {
      await sendMessage(activeConversationId, content);
    }
  };

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeConversationId) return;
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 100MB limit`);
        return false;
      }
      return true;
    });
    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addValidFiles = (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 100MB limit`);
        return false;
      }
      return true;
    });
    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounterRef.current = 0;
    if (!activeConversationId || !e.dataTransfer.files.length) return;
    addValidFiles(e.dataTransfer.files);
  };

  const loadFiles = useCallback(async () => {
    if (!activeConversationId) return;
    setFilesLoading(true);
    const files = await getConversationFiles(activeConversationId);
    setConvFiles(files);
    setFilesLoading(false);
  }, [activeConversationId, getConversationFiles]);

  useEffect(() => {
    if (activeConversationId) {
      loadFiles();
    }
  }, [activeConversationId, loadFiles]);

  // Realtime subscription for chat_files so receiver sees attachments without refresh
  useEffect(() => {
    if (!activeConversationId) return;
    const channel = supabase
      .channel(`chat-files-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_files",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const newFile = payload.new as ChatFile;
          setConvFiles((prev) => {
            if (prev.find((f) => f.id === newFile.id)) return prev;
            return [newFile, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_files",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          if (deletedId) {
            setConvFiles((prev) => prev.filter((f) => f.id !== deletedId));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId]);

  // Reset tab when switching conversations
  useEffect(() => {
    setChatTab("messages");
    setPendingFiles([]);
  }, [activeConversationId]);

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from("chat-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const isPreviewable = (mimeType: string) => {
    return mimeType.startsWith("image/");
  };

  const getFileIcon = (mimeType: string, size: "sm" | "lg" = "sm") => {
    const cls = size === "lg" ? "h-5 w-5" : "h-4 w-4";
    if (mimeType.startsWith("image/")) return <ImageIcon className={cn(cls, "text-primary")} />;
    if (mimeType.includes("pdf")) return <FileText className={cn(cls, "text-destructive")} />;
    if (mimeType.startsWith("text/")) return <FileText className={cn(cls, "text-accent-foreground")} />;
    return <FileIcon className={cn(cls, "text-muted-foreground")} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileClick = (f: ChatFile) => {
    if (f.mime_type.startsWith("image/") || f.mime_type.includes("pdf")) {
      setPreviewFile(f);
    } else {
      downloadFile(f);
    }
  };

  const downloadFile = async (f: ChatFile) => {
    try {
      const url = getFileUrl(f.file_path);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = f.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleDeleteFile = async (f: ChatFile) => {
    const { error: storageError } = await supabase.storage.from("chat-files").remove([f.file_path]);
    if (storageError) { toast.error("Failed to delete file"); return; }
    await supabase.from("chat_files").delete().eq("id", f.id);
    setConvFiles((prev) => prev.filter((cf) => cf.id !== f.id));
    toast.success("File deleted");
  };

  // Extract accompanying text from a file message (lines that don't start with 📎)
  const getFileMessageText = (content: string) => {
    const lines = content.split("\n");
    const textLines = lines.filter((l) => !l.startsWith("📎"));
    return textLines.join("\n").trim();
  };

  // Find ALL ChatFiles matching a file message (may have multiple 📎 lines)
  const findFilesForMessage = useCallback((msgContent: string, messageId?: string): ChatFile[] => {
    if (!msgContent.startsWith("📎")) return [];
    // Prefer matching by message_id for accuracy
    if (messageId) {
      const byId = convFiles.filter((f) => f.message_id === messageId);
      if (byId.length > 0) return byId;
    }
    // Fallback: match by file names in content
    const fileNames = msgContent.split("\n")
      .filter((l) => l.startsWith("📎"))
      .map((l) => l.slice(2).trim());
    return convFiles.filter((f) => fileNames.includes(f.file_name));
  }, [convFiles]);

  // Group files by date
  const groupedFiles: { date: string; files: ChatFile[] }[] = [];
  let currentFileDate = "";
  for (const f of convFiles) {
    const d = formatDate(f.created_at);
    if (d !== currentFileDate) {
      currentFileDate = d;
      groupedFiles.push({ date: d, files: [f] });
    } else {
      groupedFiles[groupedFiles.length - 1].files.push(f);
    }
  };

  const activeTyping = activeConversationId
    ? (typingUsers[activeConversationId] || []).filter((t) => t.userId !== userId)
    : [];

  // Group messages by date
  const groupedMessages: { date: string; msgs: typeof messages }[] = [];
  let currentDate = "";
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (d !== currentDate) {
      currentDate = d;
      groupedMessages.push({ date: d, msgs: [msg] });
    } else {
      groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }
  }

  // Fetch call history for active conversation
  const [callHistory, setCallHistory] = useState<any[]>([]);
  useEffect(() => {
    if (!activeConversationId) { setCallHistory([]); return; }
    let cancelled = false;
    supabase
      .from("call_history")
      .select("*")
      .eq("conversation_id", activeConversationId)
      .order("started_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setCallHistory(data);
      });
    // Subscribe to new call history entries
    const channel = supabase.channel(`call-history-${activeConversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "call_history", filter: `conversation_id=eq.${activeConversationId}` }, (payload) => {
        setCallHistory((prev) => [...prev, payload.new]);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [activeConversationId]);

  // Merge messages and call history for display
  type TimelineItem = { type: "message"; data: typeof messages[0] } | { type: "call"; data: any };
  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ type: "message" as const, data: m })),
    ...callHistory.map((c) => ({ type: "call" as const, data: c })),
  ].sort((a, b) => {
    const aTime = a.type === "message" ? a.data.created_at : a.data.started_at;
    const bTime = b.type === "message" ? b.data.created_at : b.data.started_at;
    return new Date(aTime).getTime() - new Date(bTime).getTime();
  });

  // Group timeline by date
  const groupedTimeline: { date: string; items: TimelineItem[] }[] = [];
  let currentTimelineDate = "";
  for (const item of timeline) {
    const time = item.type === "message" ? item.data.created_at : item.data.started_at;
    const d = formatDate(time);
    if (d !== currentTimelineDate) {
      currentTimelineDate = d;
      groupedTimeline.push({ date: d, items: [item] });
    } else {
      groupedTimeline[groupedTimeline.length - 1].items.push(item);
    }
  }

  const handleImproveMessage = async () => {
    if (!input.trim() || improving) return;
    setImproving(true);
    setOriginalText(input);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/improve-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ message: input }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to improve message");
      }
      const { improved } = await resp.json();
      if (improved && improved !== input) {
        setImprovedText(improved);
        setInput(improved);
      } else {
        toast.info("Your message already looks great!");
        setOriginalText(null);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to improve message");
      setOriginalText(null);
    } finally {
      setImproving(false);
    }
  };

  const acceptImprovement = () => {
    setImprovedText(null);
    setOriginalText(null);
  };

  const declineImprovement = () => {
    if (originalText !== null) setInput(originalText);
    setImprovedText(null);
    setOriginalText(null);
  };

  const contact = activeConv ? getContact(activeConv) : null;
  const contactInitials = contact?.user_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="flex h-full">
      {/* Left panel - conversation list */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">You currently have no active chats.</p>
              <p
                className="text-sm text-primary cursor-pointer hover:underline mt-1"
                onClick={() => navigate("/people/experts")}
              >
                Click here to connect to experts.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredConvs.map((conv) => {
                const convContact = getContact(conv);
                const isActive = conv.id === activeConversationId;
                const initials = convContact?.user_name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2) || "?";
                const isPinned = pinnedIds.has(conv.id);

                const convTyping = (typingUsers[conv.id] || []).filter(
                  (t) => t.userId !== userId
                );

                return (
                  <div
                    key={conv.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-border hover:bg-muted/50 transition-colors group/conv",
                      isActive && "bg-muted"
                    )}
                    onClick={() => setActiveConversationId(conv.id)}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10">
                        {convContact?.user_avatar && (
                          <AvatarImage src={convContact.user_avatar} />
                        )}
                        <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      {convContact && isOnline(convContact.user_id) && <OnlineIndicator size="sm" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-medium truncate">{convContact?.user_name}</p>
                          {isPinned && (
                            <Pin className="h-3 w-3 text-primary shrink-0" />
                          )}
                          {convContact?.user_role === "supervisor" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 leading-none shrink-0 bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300">
                              Supervisor
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            className="opacity-0 group-hover/conv:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin(conv.id);
                            }}
                            title={isPinned ? "Unpin chat" : "Pin chat"}
                          >
                            {isPinned ? (
                              <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            className="opacity-0 group-hover/conv:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConvId(conv.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {convTyping.length > 0 ? (
                            <span className="text-xs text-primary italic">typing...</span>
                          ) : (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {conv.lastMessage?.content
                                ? conv.lastMessage.content.startsWith("📎")
                                  ? (() => {
                                      const fileCount = conv.lastMessage.content.split("\n").filter((l) => l.startsWith("📎")).length;
                                      return fileCount > 1 ? `📎 ${fileCount} files` : conv.lastMessage.content.split("\n")[0];
                                    })()
                                  : conv.lastMessage.content
                                : "No messages yet"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(conv.lastMessage.created_at)}
                            </span>
                          )}
                          {conv.unreadCount > 0 && (
                            <Badge className="h-5 min-w-[20px] rounded-full text-[10px] px-1.5">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right panel - chat */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {!activeConv ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {conversations.length === 0 ? "No conversations yet" : "Select a conversation"}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex-1 flex flex-col min-h-0">
            {/* Call overlay is now rendered globally by CallProvider */}
            {/* Chat header */}
            <div className="border-b border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    {contact?.user_avatar ? <AvatarImage src={contact.user_avatar} /> : null}
                    <AvatarFallback className="text-xs font-semibold">
                      {contactInitials}
                    </AvatarFallback>
                  </Avatar>
                  {contact && isOnline(contact.user_id) && <OnlineIndicator size="sm" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-base font-semibold cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        if (!contact) return;
                        const roleRouteMap: Record<string, string> = {
                          student: "/people/students/",
                          supervisor: "/people/supervisors/",
                          expert: "/people/experts/",
                        };
                        const base = roleRouteMap[contact.user_role || ""];
                        if (base) navigate(`${base}${contact.user_id}`);
                      }}
                    >
                      {contact?.user_name || "Unknown"}
                    </span>
                    {contact?.user_role === "supervisor" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 leading-none bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950 dark:border-blue-500 dark:text-blue-300">
                        Supervisor
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      if (!contact) return "";
                      const id = contact.user_id;
                      const student = getStudent(id);
                      if (student) {
                        const uni = getUniversity(student.universityId);
                        const fieldNames = getFieldNames(student.fieldIds);
                        return [uni?.name, fieldNames[0]].filter(Boolean).join(" · ");
                      }
                      const sup = getSupervisor(id);
                      if (sup) {
                        const uni = getUniversity(sup.universityId);
                        const fieldNames = getFieldNames(sup.fieldIds);
                        return [uni?.name, fieldNames[0]].filter(Boolean).join(" · ");
                      }
                      const exp = getExpert(id);
                      if (exp) {
                        const company = getCompany(exp.companyId);
                        const fieldNames = getFieldNames(exp.fieldIds);
                        return [company?.name, fieldNames[0]].filter(Boolean).join(" · ");
                      }
                      return "";
                    })()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                   <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => contact && activeConversationId && startCall(activeConversationId, contact.user_id, contact.user_name, false)}
                    title="Voice call"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => contact && activeConversationId && startCall(activeConversationId, contact.user_id, contact.user_name, true)}
                    title="Video call"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex px-4 gap-4">
                <button
                  className={cn(
                    "pb-2 text-xs font-medium border-b-2 transition-colors",
                    chatTab === "messages"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setChatTab("messages")}
                >
                  Messages
                </button>
                <button
                  className={cn(
                    "pb-2 text-xs font-medium border-b-2 transition-colors",
                    chatTab === "files"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setChatTab("files")}
                >
                  Files
                </button>
                {(contact?.user_role === "supervisor" || currentUser?.role === "supervisor") && (
                  <button
                    className={cn(
                      "pb-2 text-xs font-medium border-b-2 transition-colors",
                      chatTab === "milestones"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setChatTab("milestones")}
                  >
                    Milestones
                  </button>
                )}
              </div>
            </div>


            {chatTab === "messages" ? (
              <div
                className={cn("flex flex-col flex-1 min-h-0 relative", dragging && "ring-2 ring-primary ring-inset rounded-md")}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragCounterRef.current++;
                  setDragging(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragCounterRef.current--;
                  if (dragCounterRef.current === 0) setDragging(false);
                }}
                onDrop={handleDrop}
              >
                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-3">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full py-16">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading messages...</span>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-1 px-4">
                    {groupedTimeline.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-4">
                          <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">
                            {group.date}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {group.items.map((item, i) => {
                            if (item.type === "call") {
                              const call = item.data;
                              const isMyCall = call.caller_id === userId;
                              const isMissed = call.status === "missed";
                              const isRejected = call.status === "rejected";
                              const dur = call.duration > 0 ? formatDuration(call.duration) : null;
                              return (
                                <div key={`call-${call.id}`} className="flex justify-center my-3">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
                                    {isMissed || isRejected ? (
                                      <PhoneMissed className="h-3.5 w-3.5 text-destructive" />
                                    ) : isMyCall ? (
                                      <PhoneOutgoing className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                      <PhoneIncoming className="h-3.5 w-3.5 text-green-500" />
                                    )}
                                    <span>
                                      {isMissed ? "Missed" : isRejected ? "Declined" : isMyCall ? "Outgoing" : "Incoming"}{" "}
                                      {call.call_type} call
                                      {dur && ` · ${dur}`}
                                    </span>
                                    <span className="text-muted-foreground/60">
                                      {formatTime(call.started_at)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            const msg = item.data;
                            const prevItem = i > 0 ? group.items[i - 1] : null;
                            const isMe = msg.sender_id === userId;
                            const showAvatar =
                              !isMe &&
                              (i === 0 || !prevItem || prevItem.type !== "message" || prevItem.data.sender_id !== msg.sender_id);

                            // Check if message is a file attachment
                            const isFileMsg = msg.content.startsWith("📎 ");
                            const senderChanged = i > 0 && prevItem && prevItem.type === "message" && prevItem.data.sender_id !== msg.sender_id;

                            return (
                              <div key={msg.id} className={cn("flex w-full group", isMe ? "justify-end" : "justify-start", senderChanged && "mt-3")}>
                                {!isMe && (
                                  <div className="w-7 mr-2 shrink-0">
                                    {showAvatar && (
                                      <Avatar className="h-7 w-7">
                                        {contact?.user_avatar ? <AvatarImage src={contact.user_avatar} /> : null}
                                        <AvatarFallback className="text-[10px]">
                                          {contactInitials}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                  </div>
                                )}
                                <div className={cn("flex items-center gap-1 max-w-[95%] sm:max-w-[85%] md:max-w-[70%] lg:max-w-[50%] min-w-0", isMe && "flex-row-reverse")}>
                                  <div
                                    className={cn(
                                      "rounded-2xl px-3.5 py-2 text-sm break-words overflow-hidden min-w-0 [overflow-wrap:anywhere]",
                                      isMe
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted rounded-bl-md"
                                    )}
                                  >
                                    {editingId === msg.id ? (
                                      (() => {
                                        // For file messages, show the file previews above the edit input
                                        const editChatFiles = isFileMsg ? findFilesForMessage(msg.content, msg.id) : [];
                                        const filePrefix = msg.content.split("\n").filter((l: string) => l.startsWith("📎")).join("\n");
                                        return (
                                          <div className="space-y-1.5">
                                            {editChatFiles.length > 0 && (
                                              <>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {editChatFiles.filter(f => f.mime_type.startsWith("image/")).map((chatFile) => (
                                                    <div key={chatFile.id} className="rounded-lg overflow-hidden w-20 h-20">
                                                      <img src={getFileUrl(chatFile.file_path)} alt={chatFile.file_name} className="w-full h-full object-cover" />
                                                    </div>
                                                  ))}
                                                </div>
                                                {editChatFiles.filter(f => !f.mime_type.startsWith("image/")).map((chatFile) => (
                                                  <div key={chatFile.id} className={cn(
                                                    "flex items-center gap-3 rounded-xl p-2.5",
                                                    isMe ? "bg-primary-foreground/10" : "bg-background/60"
                                                  )}>
                                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", isMe ? "bg-primary-foreground/20" : "bg-muted")}>
                                                      {getFileIcon(chatFile.mime_type, "lg")}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                      <p className={cn("text-sm font-medium truncate", isMe ? "text-primary-foreground" : "text-foreground")}>{chatFile.file_name}</p>
                                                      <p className={cn("text-xs", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>{formatFileSize(chatFile.file_size)}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </>
                                            )}
                                            <form
                                              className="flex items-center gap-1.5"
                                              onSubmit={(e) => {
                                                e.preventDefault();
                                                const newText = editInput.trim();
                                                const newContent = isFileMsg
                                                  ? (newText ? `${filePrefix}\n${newText}` : filePrefix)
                                                  : newText;
                                                if (newContent && newContent !== msg.content) {
                                                  editMessage(msg.id, newContent);
                                                }
                                                setEditingId(null);
                                              }}
                                            >
                                              <input
                                                autoFocus
                                                className="bg-transparent outline-none flex-1 min-w-0 text-sm"
                                                value={editInput}
                                                onChange={(e) => setEditInput(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Escape") setEditingId(null);
                                                }}
                                                placeholder={isFileMsg ? "Add a caption..." : undefined}
                                              />
                                              <Button type="submit" size="icon" variant="ghost" className="h-5 w-5 shrink-0">
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button type="button" size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => setEditingId(null)}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </form>
                                          </div>
                                        );
                                      })()
                                    ) : isFileMsg ? (
                                      (() => {
                                        const chatFiles = findFilesForMessage(msg.content, msg.id);
                                        const accompanyingText = getFileMessageText(msg.content);
                                        const isTemp = msg.id.startsWith("temp-");
                                        if (chatFiles.length > 0) {
                                          return (
                                            <div className="space-y-1.5">
                                              <div className="flex flex-wrap gap-1.5">
                                                {chatFiles.filter(f => f.mime_type.startsWith("image/")).map((chatFile) => (
                                                  <div
                                                    key={chatFile.id}
                                                    className="rounded-lg overflow-hidden cursor-pointer w-20 h-20"
                                                    onClick={(e) => { e.stopPropagation(); handleFileClick(chatFile); }}
                                                  >
                                                    <img src={getFileUrl(chatFile.file_path)} alt={chatFile.file_name} className="w-full h-full object-cover" />
                                                  </div>
                                                ))}
                                              </div>
                                              {chatFiles.filter(f => !f.mime_type.startsWith("image/")).map((chatFile) => (
                                                <div
                                                  key={chatFile.id}
                                                  className={cn(
                                                    "flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-colors",
                                                    isMe ? "bg-primary-foreground/10 hover:bg-primary-foreground/15" : "bg-background/60 hover:bg-background/80"
                                                  )}
                                                  onClick={(e) => { e.stopPropagation(); handleFileClick(chatFile); }}
                                                >
                                                  <div className={cn(
                                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                                                    isMe ? "bg-primary-foreground/20" : "bg-muted"
                                                  )}>
                                                    {getFileIcon(chatFile.mime_type, "lg")}
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <p className={cn("text-sm font-medium truncate", isMe ? "text-primary-foreground" : "text-foreground")}>{chatFile.file_name}</p>
                                                    <p className={cn("text-xs", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>{formatFileSize(chatFile.file_size)}</p>
                                                  </div>
                                                </div>
                                              ))}
                                              {accompanyingText && (
                                                <div
                                                  className={cn(
                                                    "prose prose-sm max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [overflow-wrap:anywhere]",
                                                    isMe
                                                      ? "prose-invert text-primary-foreground [&_*]:text-primary-foreground"
                                                      : "dark:prose-invert"
                                                  )}
                                                >
                                                  <ReactMarkdown>{accompanyingText}</ReactMarkdown>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        }
                                        // Fallback: files not yet loaded (optimistic / uploading)
                                        const fileNames = msg.content.split("\n").filter((l) => l.startsWith("📎")).map((l) => l.slice(2).trim());
                                        return (
                                            <div className="space-y-1.5">
                                              {fileNames.map((name, j) => {
                                                const ext = name.split(".").pop()?.toLowerCase() || "";
                                                const looksLikeImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
                                                if (looksLikeImage) {
                                                  return (
                                                    <div key={j} className="w-20 h-20 rounded-lg bg-muted/50 flex items-center justify-center">
                                                      {isTemp ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                                                    </div>
                                                  );
                                                }
                                                return (
                                                  <div key={j} className={cn(
                                                    "flex items-center gap-3 rounded-xl p-2.5",
                                                    isMe ? "bg-primary-foreground/10" : "bg-background/60"
                                                  )}>
                                                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", isMe ? "bg-primary-foreground/20" : "bg-muted")}>
                                                      {isTemp ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <FileIcon className="h-5 w-5 text-muted-foreground" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                      <p className={cn("text-sm font-medium truncate", isMe ? "text-primary-foreground" : "text-foreground")}>{name}</p>
                                                      {isTemp && <p className={cn("text-xs", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>Uploading...</p>}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                              {accompanyingText && (
                                                <div
                                                  className={cn(
                                                    "prose prose-sm max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [overflow-wrap:anywhere]",
                                                    isMe
                                                      ? "prose-invert text-primary-foreground [&_*]:text-primary-foreground"
                                                      : "dark:prose-invert"
                                                  )}
                                                >
                                                  <ReactMarkdown>{accompanyingText}</ReactMarkdown>
                                                </div>
                                              )}
                                            </div>
                                        );
                                      })()
                                    ) : (
                                      <div
                                        className={cn(
                                          "prose prose-sm max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [overflow-wrap:anywhere]",
                                          isMe
                                            ? "prose-invert text-primary-foreground [&_*]:text-primary-foreground"
                                            : "dark:prose-invert"
                                        )}
                                      >
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                      </div>
                                    )}
                                    <div className={cn(
                                      "flex items-center gap-1 mt-0.5",
                                      isMe ? "justify-end" : "justify-start"
                                    )}>
                                      {msg.edited_at && (
                                        <span className={cn(
                                          "text-[10px] italic",
                                          isMe ? "text-primary-foreground/40" : "text-muted-foreground/60"
                                        )}>
                                          edited
                                        </span>
                                      )}
                                      <span className={cn(
                                        "text-[10px] whitespace-nowrap",
                                        isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                                      )}>
                                        {formatTime(msg.created_at)}
                                      </span>
                                      <ReadReceipt isMe={isMe} readAt={msg.read_at} />
                                    </div>
                                  </div>
                                  {/* Edit/delete buttons - only for own messages */}
                                  {isMe && !msg.id.startsWith("temp-") && editingId !== msg.id && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                      <button
                                        className="p-1 rounded hover:bg-muted"
                                        onClick={() => {
                                          const textPart = isFileMsg ? getFileMessageText(msg.content) : msg.content;
                                          setEditingId(msg.id);
                                          setEditInput(textPart);
                                        }}
                                      >
                                        <Pencil className="h-3 w-3 text-muted-foreground" />
                                      </button>
                                      <button
                                        className="p-1 rounded hover:bg-destructive/10"
                                        onClick={() => deleteMessage(msg.id)}
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Typing indicator */}
                    {activeTyping.length > 0 && (() => {
                      const lastMsg = messages[messages.length - 1];
                      const showAvatar = !lastMsg || lastMsg.sender_id === userId;
                      return (
                        <div className="flex w-full items-center gap-2 pt-1">
                          <div className="w-7 mr-2 shrink-0">
                            {showAvatar && (
                              <Avatar className="h-7 w-7">
                                {contact?.user_avatar ? <AvatarImage src={contact.user_avatar} /> : null}
                                <AvatarFallback className="text-[10px]">
                                  {contactInitials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5">
                            <TypingIndicator />
                          </div>
                        </div>
                      );
                    })()}

                    <div ref={bottomRef} />
                  </div>
                  )}
                </ScrollArea>

                {/* Pending files preview */}
                {pendingFiles.length > 0 && (
                  <div className="border-t border-border px-3 py-2">
                    <div className="flex flex-wrap gap-2 px-1">
                      {pendingFiles.map((file, idx) => {
                        const isImage = file.type.startsWith("image/");
                        const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";
                        return (
                          <div key={idx} className="relative h-16 w-16 rounded-lg border border-border bg-muted overflow-hidden group">
                            {isImage ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center gap-0.5">
                                <FileIcon className="h-5 w-5 text-muted-foreground" />
                                <span className="text-[9px] text-muted-foreground font-medium">{ext}</span>
                              </div>
                            )}
                            <button
                              type="button"
                              className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-foreground/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <X className="h-2.5 w-2.5 text-background" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="border-t border-border p-3 space-y-2">
                  {/* Improve button / accept-decline bar */}
                  {improvedText !== null ? (
                    <div className="flex items-center gap-2 px-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs text-muted-foreground flex-1">Message improved</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={declineImprovement}
                      >
                        <X className="h-3 w-3" />
                        Revert
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={acceptImprovement}
                      >
                        <Check className="h-3 w-3" />
                        Accept
                      </Button>
                    </div>
                  ) : input.trim().length > 2 ? (
                    <div className="flex justify-start px-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                        disabled={improving}
                        onClick={handleImproveMessage}
                      >
                        {improving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        {improving ? "Improving…" : "Improve message"}
                      </Button>
                    </div>
                  ) : null}

                  <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (improvedText !== null) acceptImprovement();
                      handleSend();
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 mb-0.5"
                    >
                      <Paperclip className={cn("h-4 w-4", uploading && "animate-pulse")} />
                    </Button>
                    <textarea
                      value={input}
                      onChange={(e) => {
                        handleInputChange(e.target.value);
                        if (improvedText !== null) {
                          setImprovedText(null);
                          setOriginalText(null);
                        }
                        // Auto-resize
                        e.target.style.height = "auto";
                        const maxH = 96;
                        const newHeight = Math.min(e.target.scrollHeight, maxH);
                        e.target.style.height = newHeight + "px";
                        e.target.style.overflowY = e.target.scrollHeight > maxH ? "auto" : "hidden";
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (improvedText !== null) acceptImprovement();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      style={{ maxHeight: "96px", overflowY: "hidden" }}
                    />
                    <Button type="submit" size="icon" disabled={!input.trim() && pendingFiles.length === 0} className="shrink-0 mb-0.5">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : chatTab === "files" ? (
              /* Files tab */
              <ScrollArea className="flex-1 px-4 py-3">
                {filesLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading files...</span>
                    </div>
                  </div>
                ) : convFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileIcon className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No files shared in this conversation yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-6 px-4">
                    {groupedFiles.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">
                            {group.date}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {group.files.map((f) => (
                            <div
                              key={f.id}
                              className="relative flex flex-col rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden group/file"
                              onClick={() => handleFileClick(f)}
                            >
                              {/* Download/Delete buttons */}
                              <div className="absolute top-1 right-1 z-10 flex items-center gap-0.5 opacity-0 group-hover/file:opacity-100 transition-opacity">
                                <button
                                  className="p-1 rounded bg-background/80 hover:bg-background shadow-sm"
                                  onClick={(e) => { e.stopPropagation(); downloadFile(f); }}
                                  title="Download"
                                >
                                  <Download className="h-3.5 w-3.5 text-foreground" />
                                </button>
                                <button
                                  className="p-1 rounded bg-background/80 hover:bg-destructive/10 shadow-sm"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFile(f); }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </button>
                              </div>
                              {/* Thumbnail / icon area */}
                              {f.mime_type.startsWith("image/") ? (
                                <div className="aspect-square overflow-hidden bg-muted">
                                  <img src={getFileUrl(f.file_path)} alt={f.file_name} className="h-full w-full object-cover" />
                                </div>
                              ) : (
                              <div className="aspect-square bg-muted flex flex-col items-center justify-center gap-2">
                                  {getFileIcon(f.mime_type, "lg")}
                                  <span className="text-xs text-muted-foreground uppercase font-medium">
                                    {f.file_name.split(".").pop()}
                                  </span>
                                </div>
                              )}
                              <div className="p-2 min-w-0">
                                <p className="text-xs font-medium truncate">{f.file_name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatFileSize(f.file_size)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            ) : chatTab === "milestones" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 px-3 py-3">
                  {/* Edit toggle */}
                  <div className="flex items-center justify-between px-1 pb-2">
                    <p className="text-lg text-foreground">Break your goal into milestones</p>
                    <Button
                      variant={milestonesEditMode ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        setMilestonesEditMode((v) => !v);
                        setEditingMilestoneId(null);
                      }}
                    >
                      {milestonesEditMode ? <Check className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                      {milestonesEditMode ? "Done" : "Edit"}
                    </Button>
                  </div>
                  {milestones.length > 0 && (() => {
                    const completed = milestones.filter((m) => m.completed).length;
                    const total = milestones.length;
                    const pct = Math.round((completed / total) * 100);
                    const barColor = pct < 40 ? "bg-orange-500" : pct < 75 ? "bg-yellow-500" : "bg-green-500";
                    return (
                      <div className="flex items-center gap-2 px-1 pr-4 pb-3">
                        <Progress value={pct} className="flex-1 h-2" indicatorClassName={barColor} />
                        <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                      </div>
                    );
                  })()}
                  <div className="py-2">
                    {milestones.map((m, i) => (
                      <div key={m.id} className="flex items-stretch">
                        {/* Timeline column */}
                        <div className="flex flex-col items-center w-6 shrink-0">
                          <button
                            onClick={() =>
                              !milestonesEditMode && dbToggleMilestone(m.id, !m.completed)
                            }
                            className="relative z-10 shrink-0"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                          {i < milestones.length - 1 && (
                            <div className="w-px flex-1 bg-border" />
                          )}
                          {i === milestones.length - 1 && (
                            <div className="w-px flex-1 border-l border-dashed border-border" />
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pb-6 pl-3 min-w-0 flex items-start gap-2">
                          {editingMilestoneId === m.id ? (
                            <form
                              className="flex flex-col gap-2 flex-1"
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (editMilestoneText.trim()) {
                                  dbEditMilestone(m.id, editMilestoneText.trim().slice(0, 150), editMilestoneDesc.trim().slice(0, 300));
                                }
                                setEditingMilestoneId(null);
                              }}
                            >
                              <Input
                                autoFocus
                                value={editMilestoneText}
                                onChange={(e) => setEditMilestoneText(e.target.value.slice(0, 150))}
                                className="h-7 text-sm"
                                 placeholder="Milestone name"
                                maxLength={150}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") setEditingMilestoneId(null);
                                }}
                              />
                              <textarea
                                value={editMilestoneDesc}
                                onChange={(e) => setEditMilestoneDesc(e.target.value.slice(0, 300))}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                                placeholder="Description"
                                maxLength={300}
                                rows={2}
                              />
                              <div className="flex items-center gap-2">
                                <Button type="submit" size="sm" className="h-7 px-2">Save</Button>
                                <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditingMilestoneId(null)}>Cancel</Button>
                                <span className="text-[10px] text-muted-foreground ml-auto">{editMilestoneDesc.length}/300</span>
                              </div>
                            </form>
                          ) : (
                            <>
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => !milestonesEditMode && setExpandedMilestoneId(expandedMilestoneId === m.id ? null : m.id)}
                              >
                                <p className={cn("text-sm truncate", m.completed && "line-through text-muted-foreground")}>
                                  {m.text}
                                </p>
                                {m.description && expandedMilestoneId === m.id && (
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words">
                                    {m.description}
                                  </p>
                                )}
                              </div>
                              {milestonesEditMode && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    className="p-1 rounded hover:bg-muted"
                                    onClick={() => {
                                      setEditingMilestoneId(m.id);
                                      setEditMilestoneText(m.text);
                                      setEditMilestoneDesc(m.description);
                                    }}
                                  >
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                  <button
                                    className="p-1 rounded hover:bg-destructive/10"
                                    onClick={() => dbDeleteMilestone(m.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add new milestone row */}
                    <div className="flex items-start">
                      <div className="flex flex-col items-center w-6 shrink-0">
                        {!addingMilestone ? (
                          <button
                            onClick={() => setAddingMilestone(true)}
                            className="relative z-10 shrink-0 h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <div className="flex-1 pl-3 min-w-0">
                        {addingMilestone ? (
                          <form
                            className="flex flex-col gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (newMilestoneText.trim()) {
                                dbAddMilestone(newMilestoneText.trim(), newMilestoneDesc.trim());
                                setNewMilestoneText("");
                                setNewMilestoneDesc("");
                                setAddingMilestone(false);
                              }
                            }}
                          >
                            <Input
                              autoFocus
                              value={newMilestoneText}
                              onChange={(e) => setNewMilestoneText(e.target.value.slice(0, 150))}
                              placeholder="Milestone name"
                              maxLength={150}
                              className="h-7 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                  setAddingMilestone(false);
                                  setNewMilestoneText("");
                                  setNewMilestoneDesc("");
                                }
                              }}
                            />
                            <textarea
                              value={newMilestoneDesc}
                              onChange={(e) => setNewMilestoneDesc(e.target.value.slice(0, 300))}
                              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                              placeholder="Description"
                              maxLength={300}
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <Button type="submit" size="sm" className="h-7 px-2" disabled={!newMilestoneText.trim()}>
                                Add
                              </Button>
                              <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setAddingMilestone(false); setNewMilestoneText(""); setNewMilestoneDesc(""); }}>
                                Cancel
                              </Button>
                              <span className="text-[10px] text-muted-foreground ml-auto">{newMilestoneDesc.length}/300</span>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setAddingMilestone(true)}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Add milestone
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Delete conversation confirmation */}
      <AlertDialog open={!!deleteConvId} onOpenChange={(open) => !open && setDeleteConvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConvId) deleteConversation(deleteConvId);
                setDeleteConvId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* File preview dialog */}
      <AlertDialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <AlertDialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 truncate">
              {previewFile && getFileIcon(previewFile.mime_type)}
              <span className="truncate">{previewFile?.file_name}</span>
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center">
            {previewFile?.mime_type.startsWith("image/") && (
              <img
                src={getFileUrl(previewFile.file_path)}
                alt={previewFile.file_name}
                className="max-w-full max-h-[60vh] object-contain rounded-md"
              />
            )}
            {previewFile?.mime_type.includes("pdf") && (
              <iframe
                src={getFileUrl(previewFile.file_path)}
                className="w-full h-[60vh] rounded-md border-0"
                title={previewFile.file_name}
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction asChild>
              <a
                href={getFileUrl(previewFile?.file_path || "")}
                download={previewFile?.file_name}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
