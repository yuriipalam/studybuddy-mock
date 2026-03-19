import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Check, CheckCheck, Pencil, X, Trash2 } from "lucide-react";
import { useMessaging } from "@/contexts/MessagingContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  // Compare by calendar date to avoid timezone issues
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
    markAsRead,
    setTyping,
    typingUsers,
    loading,
  } = useMessaging();

  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const userId = currentUser?.id;

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  // Get the other participant's info
  const getContact = (conv: typeof conversations[0]) =>
    conv.participants.find((p) => p.user_id !== userId);

  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const contact = getContact(c);
    return contact?.user_name.toLowerCase().includes(search.toLowerCase());
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (activeConversationId) {
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, messages.length, markAsRead]);

  // Handle typing indicator
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
                      "flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-border hover:bg-muted/50 transition-colors",
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
                        <p className="text-sm font-medium truncate">{convContact?.user_name}</p>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatTime(conv.lastMessage.created_at)}
                          </span>
                        )}
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
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Avatar className="h-9 w-9">
                {contact?.user_avatar && <AvatarImage src={contact.user_avatar} />}
                <AvatarFallback className="text-xs font-semibold">
                  {contact?.user_name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{contact?.user_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {contact?.user_role}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
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

                        return (
                          <div key={msg.id} className={cn("flex group", isMe ? "justify-end" : "justify-start")}>
                            {!isMe && (
                              <div className="w-7 mr-2 shrink-0">
                                {showAvatar && (
                                  <Avatar className="h-7 w-7">
                                    {contact?.user_avatar && <AvatarImage src={contact.user_avatar} />}
                                    <AvatarFallback className="text-[10px]">
                                      {contact?.user_name?.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            )}
                            <div className={cn("flex items-center gap-1", isMe && "flex-row-reverse")}>
                              <div
                                className={cn(
                                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
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
                                    "text-[10px]",
                                    isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                                  )}>
                                    {formatTime(msg.created_at)}
                                  </span>
                                  <ReadReceipt isMe={isMe} readAt={msg.read_at} />
                                </div>
                              </div>
                              {/* Edit button - only for own messages */}
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
                            {contact?.user_avatar && <AvatarImage src={contact.user_avatar} />}
                            <AvatarFallback className="text-[10px]">
                              {contact?.user_name?.split(" ").map((w) => w[0]).join("").slice(0, 2)}
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
        )}
      </div>
    </div>
  );
}
