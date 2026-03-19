import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send } from "lucide-react";
import { useMessaging } from "@/contexts/MessagingContext";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const navigate = useNavigate();
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    getConversation,
  } = useMessaging();

  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeConv = activeConversationId ? getConversation(activeConversationId) : null;

  const filteredConvs = conversations.filter(
    (c) => !search || c.contactName.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages.length]);

  const handleSend = () => {
    if (!input.trim() || !activeConversationId) return;
    sendMessage(activeConversationId, input.trim());
    setInput("");
  };

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
          {filteredConvs.length === 0 ? (
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
                const lastMsg = conv.messages[conv.messages.length - 1];
                const isActive = conv.id === activeConversationId;
                const initials = conv.contactName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2);

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
                      <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conv.contactName}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{lastMsg.content}</p>
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
                <AvatarFallback className="text-xs font-semibold">
                  {activeConv.contactName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{activeConv.contactName}</p>
                <p className="text-xs text-muted-foreground capitalize">{activeConv.contactRole} · {activeConv.contactTitle}</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3 max-w-2xl mx-auto">
                {activeConv.messages.map((msg) => {
                  const isMe = msg.senderId === "student-01";
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        {msg.content}
                        <div className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  onChange={(e) => setInput(e.target.value)}
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
