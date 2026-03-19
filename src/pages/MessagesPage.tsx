import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { MessageSquare, Send, Check, CheckCheck, Pencil, X, Trash2, Paperclip, FileText, Image as ImageIcon, File as FileIcon, Download, Eye } from "lucide-react";
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

export default function MessagesPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    messages,
    sendMessage,
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
  } = useMessaging();

  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [deleteConvId, setDeleteConvId] = useState<string | null>(null);
  const [chatTab, setChatTab] = useState<"messages" | "files">("messages");
  const [convFiles, setConvFiles] = useState<ChatFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<ChatFile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const userId = currentUser?.id;

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const getContact = (conv: typeof conversations[0]) =>
    conv.participants.find((p) => p.user_id !== userId);

  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const contact = getContact(c);
    return contact?.user_name.toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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
    if (!input.trim() || !activeConversationId) return;
    const content = input.trim();
    setInput("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    await sendMessage(activeConversationId, content);
  };

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeConversationId) return;
    const validFiles = Array.from(files).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" exceeds 100MB limit`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    setUploading(true);
    for (const file of validFiles) {
      await uploadFile(activeConversationId, file);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (chatTab === "files") loadFiles();
  };

  const loadFiles = useCallback(async () => {
    if (!activeConversationId) return;
    setFilesLoading(true);
    const files = await getConversationFiles(activeConversationId);
    setConvFiles(files);
    setFilesLoading(false);
  }, [activeConversationId, getConversationFiles]);

  useEffect(() => {
    if (chatTab === "files" && activeConversationId) {
      loadFiles();
    }
  }, [chatTab, activeConversationId, loadFiles]);

  // Reset tab when switching conversations
  useEffect(() => {
    setChatTab("messages");
  }, [activeConversationId]);

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage.from("chat-files").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const isPreviewable = (mimeType: string) => {
    return mimeType.startsWith("image/") || mimeType === "application/pdf" || mimeType.startsWith("text/");
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-primary" />;
    if (mimeType.includes("pdf")) return <FileText className="h-4 w-4 text-destructive" />;
    if (mimeType.startsWith("text/")) return <FileText className="h-4 w-4 text-accent-foreground" />;
    return <FileIcon className="h-4 w-4 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileClick = (f: ChatFile) => {
    if (isPreviewable(f.mime_type)) {
      setPreviewFile(f);
    } else {
      // Download non-previewable files
      const url = getFileUrl(f.file_path);
      const a = document.createElement("a");
      a.href = url;
      a.download = f.file_name;
      a.click();
    }
  };

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

  const contact = activeConv ? getContact(activeConv) : null;
  const contactInitials = contact?.user_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2) || "?";

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left panel - conversation list */}
      <div className="w-80 border-r border-border flex flex-col">
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
                    <Avatar className="h-10 w-10 shrink-0">
                      {convContact?.user_avatar && (
                        <AvatarImage src={convContact.user_avatar} />
                      )}
                      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-sm font-medium truncate">{convContact?.user_name}</p>
                          {convContact?.user_role === "supervisor" && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 leading-none shrink-0">
                              Your Supervisor
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {conv.lastMessage && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatTime(conv.lastMessage.created_at)}
                            </span>
                          )}
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
                        {convTyping.length > 0 ? (
                          <span className="text-xs text-primary italic">typing...</span>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {conv.lastMessage?.content || "No messages yet"}
                          </p>
                        )}
                        {conv.unreadCount > 0 && (
                          <Badge className="h-5 min-w-[20px] rounded-full text-[10px] px-1.5">
                            {conv.unreadCount}
                          </Badge>
                        )}
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
      <div className="flex-1 flex flex-col">
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
          <>
            {/* Chat header */}
            <div className="border-b border-border">
              <div className="flex items-center gap-3 px-4 py-3">
                <Avatar className="h-9 w-9">
                  {contact?.user_avatar ? (
                    <AvatarImage src={contact.user_avatar} />
                  ) : null}
                  <AvatarFallback className="text-xs font-semibold">
                    {contactInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{contact?.user_name || "Unknown"}</p>
                    {contact?.user_role === "supervisor" && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 leading-none">
                        Your Supervisor
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
              </div>
              <div className="flex px-4 gap-4">
                <button
                  className={cn(
                    "pb-2 text-sm font-medium border-b-2 transition-colors",
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
                    "pb-2 text-sm font-medium border-b-2 transition-colors",
                    chatTab === "files"
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setChatTab("files")}
                >
                  Files
                </button>
              </div>
            </div>

            {chatTab === "messages" ? (
              <>
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
                  <div className="space-y-1 max-w-2xl mx-auto">
                    {groupedMessages.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-4">
                          <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">
                            {group.date}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {group.msgs.map((msg, i) => {
                            const isMe = msg.sender_id === userId;
                            const showAvatar =
                              !isMe &&
                              (i === 0 || group.msgs[i - 1].sender_id !== msg.sender_id);

                            // Check if message is a file attachment
                            const isFileMsg = msg.content.startsWith("📎 ");

                            return (
                              <div key={msg.id} className={cn("flex group", isMe ? "justify-end" : "justify-start")}>
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
                                <div className={cn("flex items-center gap-1 max-w-[75%]", isMe && "flex-row-reverse")}>
                                  <div
                                    className={cn(
                                      "rounded-2xl px-3.5 py-2 text-sm",
                                      isMe
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted rounded-bl-md"
                                    )}
                                  >
                                    {editingId === msg.id ? (
                                      <form
                                        className="flex items-center gap-1.5"
                                        onSubmit={(e) => {
                                          e.preventDefault();
                                          if (editInput.trim() && editInput.trim() !== msg.content) {
                                            editMessage(msg.id, editInput.trim());
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
                                        />
                                        <Button type="submit" size="icon" variant="ghost" className="h-5 w-5 shrink-0">
                                          <Check className="h-3 w-3" />
                                        </Button>
                                        <Button type="button" size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={() => setEditingId(null)}>
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </form>
                                    ) : isFileMsg ? (
                                      <div className="flex items-center gap-1.5">
                                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                        <span>{msg.content.slice(2)}</span>
                                      </div>
                                    ) : (
                                      msg.content
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
                                          setEditingId(msg.id);
                                          setEditInput(msg.content);
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
                        <div className="flex items-center gap-2 pt-1">
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

                {/* Input */}
                <div className="border-t border-border p-3">
                  <form
                    className="flex items-center gap-2 max-w-2xl mx-auto"
                    onSubmit={(e) => {
                      e.preventDefault();
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
                      className="shrink-0"
                    >
                      <Paperclip className={cn("h-4 w-4", uploading && "animate-pulse")} />
                    </Button>
                    <Input
                      value={input}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!input.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
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
                  <div className="max-w-2xl mx-auto space-y-4">
                    {groupedFiles.map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[10px] text-muted-foreground bg-muted px-3 py-0.5 rounded-full">
                            {group.date}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {group.files.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group cursor-pointer"
                              onClick={() => handleFileClick(f)}
                            >
                              {/* Thumbnail for images */}
                              {f.mime_type.startsWith("image/") ? (
                                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
                                  <img src={getFileUrl(f.file_path)} alt={f.file_name} className="h-full w-full object-cover" />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  {getFileIcon(f.mime_type)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{f.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(f.file_size)} · {formatTime(f.created_at)}
                                </p>
                              </div>
                              {isPreviewable(f.mime_type) ? (
                                <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              ) : (
                                <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </>
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
          <div className="flex-1 overflow-auto min-h-0">
            {previewFile?.mime_type.startsWith("image/") && (
              <img
                src={getFileUrl(previewFile.file_path)}
                alt={previewFile.file_name}
                className="w-full h-auto rounded-md"
              />
            )}
            {previewFile?.mime_type === "application/pdf" && (
              <iframe
                src={getFileUrl(previewFile.file_path)}
                className="w-full h-[60vh] rounded-md border border-border"
                title={previewFile.file_name}
              />
            )}
            {previewFile?.mime_type.startsWith("text/") && (
              <iframe
                src={getFileUrl(previewFile.file_path)}
                className="w-full h-[60vh] rounded-md border border-border bg-background"
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
