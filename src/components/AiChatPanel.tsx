import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, Sparkles, Loader2, Square, RotateCcw, Copy, RefreshCw, Paperclip, FileText, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatTopicCard, parseChatBlocks } from "@/components/ChatTopicCard";
import { ChatSupervisorCard } from "@/components/ChatSupervisorCard";
import { toast } from "sonner";
import { useUserProfile } from "@/contexts/UserProfileContext";

interface Attachment {
  file: File;
  preview?: string; // data URL for images
  id: string;
}

type Message = {
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; type: string; preview?: string }[];
};

const TEMPLATE_QUESTIONS = [
  "What topics are currently available?",
  "Help me find a supervisor for my thesis",
  "What are trending research areas?",
  "Suggest thesis topics based on my profile",
];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function AttachmentPreview({ attachment, onRemove }: { attachment: Attachment; onRemove: () => void }) {
  const isImage = isImageFile(attachment.file);

  return (
    <div className="relative group rounded-lg border border-border bg-background overflow-hidden">
      {isImage && attachment.preview ? (
        <div className="w-20 h-20 relative">
          <img src={attachment.preview} alt={attachment.file.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
      ) : (
        <div className="w-20 h-20 flex flex-col items-center justify-center gap-1 p-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">{attachment.file.name}</span>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-foreground/80 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

function MessageAttachments({ attachments }: { attachments: { name: string; type: string; preview?: string }[] }) {
  const images = attachments.filter((a) => a.type.startsWith("image/"));
  const files = attachments.filter((a) => !a.type.startsWith("image/"));

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="rounded-lg overflow-hidden border border-border/50 max-w-[200px]">
              <img
                src={img.preview}
                alt={img.name}
                className="max-w-full max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  if (img.preview) window.open(img.preview, "_blank");
                }}
              />
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded border border-border/50 bg-muted/30">
              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[120px]">{f.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { getProfileSummaryForAI } = useUserProfile();

  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = [];
    Array.from(files).forEach((file) => {
      const id = crypto.randomUUID();
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, preview: e.target?.result as string } : a))
          );
        };
        reader.readAsDataURL(file);
      }
      newAttachments.push({ file, id });
    });
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Handle drag & drop
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  // Handle paste images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      addFiles(imageFiles);
    }
  }, [addFiles]);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const resetChat = () => {
    stop();
    setMessages([]);
    setInput("");
    setAttachments([]);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    const currentAttachments = attachments;
    if ((!msg && currentAttachments.length === 0) || isLoading) return;

    const msgAttachments = currentAttachments.map((a) => ({
      name: a.file.name,
      type: a.file.type,
      preview: a.preview,
    }));

    const userMsg: Message = {
      role: "user",
      content: msg,
      attachments: msgAttachments.length > 0 ? msgAttachments : undefined,
    };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setAttachments([]);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    setIsLoading(true);
    let assistantSoFar = "";
    const controller = new AbortController();
    abortRef.current = controller;

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const snap = assistantSoFar;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: snap } : m
          );
        }
        return [...prev, { role: "assistant", content: snap }];
      });
    };

    // Build text-only messages for the API (attachments described inline)
    const apiMessages = allMessages.map((m) => {
      let content = m.content;
      if (m.attachments && m.attachments.length > 0) {
        const fileList = m.attachments.map((a) => `[Attached: ${a.name}]`).join(" ");
        content = content ? `${content}\n${fileList}` : fileList;
      }
      return { role: m.role, content };
    });

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages, userProfile: getProfileSummaryForAI() }),
          signal: controller.signal,
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
            // partial JSON
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("Chat error:", e);
      upsertAssistant("\n\n*Sorry, something went wrong. Please try again.*");
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  if (!open) return null;

  const hasContent = input.trim() || attachments.length > 0;

  return (
    <div
      className={`border-l border-border bg-card flex flex-col h-full min-w-0 overflow-hidden relative ${isDragging ? "ring-2 ring-primary ring-inset" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/5 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Paperclip className="h-8 w-8" />
            <span className="text-sm font-medium">Drop files here</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <span className="font-semibold text-sm">Topic Suggestion Agent</span>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={resetChat}>
              <RefreshCw className="h-3 w-3" />
              Reset chat
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Topic Suggestion Agent</p>
              <p className="text-xs text-muted-foreground mb-6 max-w-[240px]">
                I'll help you find suitable thesis topics based on your profile and interests.
              </p>
              <div className="flex flex-col gap-2 w-full">
                {TEMPLATE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-br-md px-3.5 py-2 text-sm max-w-[85%] bg-primary text-primary-foreground space-y-2">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="space-y-2">
                          {/* Inline image previews */}
                          {msg.attachments.filter((a) => a.type.startsWith("image/") && a.preview).map((img, j) => (
                            <div key={j} className="rounded-lg overflow-hidden">
                              <img
                                src={img.preview}
                                alt={img.name}
                                className="max-w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => img.preview && window.open(img.preview, "_blank")}
                              />
                            </div>
                          ))}
                          {/* Non-image file chips */}
                          {msg.attachments.filter((a) => !a.type.startsWith("image/")).map((f, j) => (
                            <div key={j} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-primary-foreground/10">
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[140px]">{f.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.content && <span className="whitespace-pre-wrap">{msg.content}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-sm leading-relaxed">
                      {(() => {
                        const segments = parseChatBlocks(msg.content);
                        return segments.map((seg, si) => {
                          if (seg.type === "topics") {
                            return (
                              <div key={si} className="flex flex-col gap-2 my-3">
                                {seg.topics.map((topic) => (
                                  <ChatTopicCard key={topic.id} topic={topic} />
                                ))}
                              </div>
                            );
                          }
                          if (seg.type === "supervisors") {
                            return (
                              <div key={si} className="flex flex-col gap-2 my-3">
                                {seg.supervisors.map((sup) => (
                                  <ChatSupervisorCard key={sup.id} supervisor={sup} />
                                ))}
                              </div>
                            );
                          }
                          // Pre-process markdown: ensure headers, lists, etc. start on new lines
                          const processed = seg.content
                            .replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2')
                            .replace(/([^\n])(\n?)(- )/g, (match, before, nl, dash) => {
                              return nl ? match : `${before}\n${dash}`;
                            })
                            .replace(/([^\n])(\n?)(\d+\.\s)/g, (match, before, nl, num) => {
                              return nl ? match : `${before}\n${num}`;
                            });
                          return (
                            <div key={si} className="prose prose-neutral dark:prose-invert max-w-none
                              prose-p:text-foreground prose-p:leading-7
                              prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
                              prose-h1:text-2xl prose-h1:mt-6 prose-h1:mb-3
                              prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
                              prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2
                              prose-strong:text-foreground
                              prose-ul:my-3 prose-ol:my-3
                              prose-li:my-1
                              prose-code:before:content-none prose-code:after:content-none
                              prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:text-foreground
                              prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-lg
                              prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground
                              [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                              [overflow-wrap:anywhere]">
                              <ReactMarkdown>{processed}</ReactMarkdown>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {(!isLoading || i !== messages.length - 1) && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            if (i === messages.length - 1) {
                              const prev = messages.slice(0, -1);
                              setMessages(prev);
                              const lastUser = [...prev].reverse().find((m) => m.role === "user");
                              if (lastUser) {
                                setTimeout(() => send(lastUser.content), 50);
                              }
                            }
                          }}
                          title="Regenerate"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => copyMessage(msg.content)}
                          title="Copy"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Thinking...</span>
              </div>
            )}
          </div>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-3 shrink-0">
        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((a) => (
              <AttachmentPreview key={a.id} attachment={a} onRemove={() => removeAttachment(a.id)} />
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="relative"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <ScrollArea className="w-full max-h-[120px] rounded-lg border border-border bg-background focus-within:ring-1 focus-within:ring-ring">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              onPaste={handlePaste}
              placeholder="What would you like to know?"
              className="w-full resize-none bg-transparent pl-10 pr-12 py-2 text-sm placeholder:text-muted-foreground focus:outline-none min-h-[36px] overflow-hidden"
              rows={1}
              disabled={isLoading}
            />
          </ScrollArea>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading ? (
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={stop}
                className="h-7 w-7"
              >
                <Square className="h-3 w-3 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                type="submit"
                disabled={!hasContent}
                className="h-7 w-7 rounded-md"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
