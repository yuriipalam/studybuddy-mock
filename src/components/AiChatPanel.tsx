import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

export function AiChatPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages }),
        }
      );

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Stream failed" }));
        throw new Error(err.error || "Stream failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            // partial JSON, wait for more
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      upsertAssistant("\n\n*Sorry, something went wrong. Please try again.*");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground" />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">How can I help?</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ask me anything about topics, experts, or thesis writing.
            </p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="text-sm"
            disabled={isLoading}
          />
          <Button size="icon" type="submit" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
