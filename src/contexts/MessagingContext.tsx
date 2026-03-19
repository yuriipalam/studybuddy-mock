import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  edited_at: string | null;
}

export interface ChatFile {
  id: string;
  conversation_id: string;
  message_id: string | null;
  sender_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface Participant {
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_role: string | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  participants: Participant[];
  lastMessage?: DbMessage;
  unreadCount: number;
}

interface TypingState {
  [conversationId: string]: { userId: string; userName: string; timestamp: number }[];
}

interface MessagingContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  messages: DbMessage[];
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  sendMessageWithFiles: (conversationId: string, content: string, files: File[]) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  startConversation: (contact: { id: string; name: string; role: string; avatar?: string }) => Promise<string>;
  getConversationByContact: (contactId: string) => Conversation | undefined;
  markAsRead: (conversationId: string) => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  typingUsers: TypingState;
  loading: boolean;
  messagesLoading: boolean;
  uploadFile: (conversationId: string, file: File) => Promise<void>;
  getConversationFiles: (conversationId: string) => Promise<ChatFile[]>;
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationIdRaw] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);

  // Cache: conversationId -> messages
  const messageCacheRef = useRef<Record<string, DbMessage[]>>({});

  const userId = currentUser?.id;

  // Load conversations for the current user
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!participations || participations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participations.map((p: any) => p.conversation_id);

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("created_at", { ascending: false });

    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("*")
      .in("conversation_id", convIds);

    const conversationsWithMeta: Conversation[] = [];

    for (const conv of convs || []) {
      const { data: lastMsgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userId)
        .is("read_at", null);

      const participants = (allParticipants || [])
        .filter((p: any) => p.conversation_id === conv.id)
        .map((p: any) => ({
          user_id: p.user_id,
          user_name: p.user_name,
          user_avatar: p.user_avatar,
          user_role: p.user_role,
        }));

      conversationsWithMeta.push({
        id: conv.id,
        created_at: conv.created_at,
        participants,
        lastMessage: lastMsgs?.[0] || undefined,
        unreadCount: count || 0,
      });
    }

    conversationsWithMeta.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at;
      const bTime = b.lastMessage?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(conversationsWithMeta);
    setLoading(false);
  }, [userId]);

  const [messagesLoading, setMessagesLoading] = useState(false);

  // Load messages for active conversation
  const loadMessages = useCallback(async () => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    // Show cached data immediately if available, otherwise show loading
    const cached = messageCacheRef.current[activeConversationId];
    if (cached) {
      setMessages(cached);
    } else {
      setMessages([]);
      setMessagesLoading(true);
    }

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true });

    const msgs = (data as DbMessage[]) || [];
    setMessages(msgs);
    messageCacheRef.current[activeConversationId] = msgs;
    setMessagesLoading(false);
  }, [activeConversationId]);

  // Custom setter that caches current messages before switching
  const setActiveConversationId = useCallback(
    (id: string | null) => {
      setActiveConversationIdRaw((prevId) => {
        // Cache current messages for the conversation we're leaving
        if (prevId) {
          setMessages((currentMsgs) => {
            messageCacheRef.current[prevId] = currentMsgs;
            return currentMsgs;
          });
        }
        return id;
      });
    },
    []
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to realtime message changes
  useEffect(() => {
    if (!userId) return;

    channelRef.current = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as DbMessage;

            setMessages((prev) => {
              const isActiveConv =
                (prev.length > 0 && prev[0].conversation_id === newMsg.conversation_id) ||
                (prev.length === 0 && activeConversationId === newMsg.conversation_id);

              if (!isActiveConv) return prev;

              // Replace optimistic temp message if it matches
              const tempIdx = prev.findIndex(
                (m) =>
                  m.id.startsWith("temp-") &&
                  m.sender_id === newMsg.sender_id &&
                  m.content === newMsg.content &&
                  m.conversation_id === newMsg.conversation_id
              );

              if (tempIdx !== -1) {
                const updated = [...prev];
                updated[tempIdx] = newMsg;
                return updated;
              }

              // Avoid duplicates
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Update conversation list in background (only for messages from others)
            if (newMsg.sender_id !== userId) {
              loadConversations();
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DbMessage;
            setMessages((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          }
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [userId, activeConversationId, loadConversations]);

  // Subscribe to typing channel for active conversation
  useEffect(() => {
    if (!activeConversationId || !userId) return;

    const channel = supabase.channel(`typing-${activeConversationId}`);

    channel.on("broadcast", { event: "typing" }, (payload: any) => {
      const { userId: typerId, userName, isTyping: typing } = payload.payload;
      if (typerId === userId) return;

      setTypingUsers((prev) => {
        const current = prev[activeConversationId] || [];
        if (typing) {
          const exists = current.find((t) => t.userId === typerId);
          if (exists) {
            return {
              ...prev,
              [activeConversationId]: current.map((t) =>
                t.userId === typerId ? { ...t, timestamp: Date.now() } : t
              ),
            };
          }
          return {
            ...prev,
            [activeConversationId]: [...current, { userId: typerId, userName, timestamp: Date.now() }],
          };
        }
        return {
          ...prev,
          [activeConversationId]: current.filter((t) => t.userId !== typerId),
        };
      });
    });

    channel.subscribe();
    typingChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
      typingChannelRef.current = null;
    };
  }, [activeConversationId, userId]);

  // Clean up stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const updated: TypingState = {};
        let changed = false;
        for (const [convId, users] of Object.entries(prev)) {
          const fresh = users.filter((t) => now - t.timestamp < 5000);
          if (fresh.length !== users.length) changed = true;
          if (fresh.length > 0) updated[convId] = fresh;
        }
        return changed ? updated : prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!userId || !currentUser) return;

      const channel = typingChannelRef.current;
      if (!channel) return;

      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId, userName: `${currentUser.firstName} ${currentUser.lastName}`, isTyping },
      });
    },
    [userId, currentUser]
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!userId) return;

      const tempMsg: DbMessage = {
        id: `temp-${crypto.randomUUID()}`,
        conversation_id: conversationId,
        sender_id: userId,
        content,
        created_at: new Date().toISOString(),
        read_at: null,
        edited_at: null,
      };

      setMessages((prev) => [...prev, tempMsg]);

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, lastMessage: tempMsg } : c
        )
      );

      setTyping(conversationId, false);

      const { error } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      });

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
        toast.error("Failed to send message");
      }
    },
    [userId, setTyping]
  );

  const startConversation = useCallback(
    async (contact: { id: string; name: string; role: string; avatar?: string }) => {
      if (!userId || !currentUser) return "";

      // Check if conversation already exists
      const { data: myParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", userId);

      if (myParticipations) {
        for (const p of myParticipations) {
          const { data: otherP } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", p.conversation_id)
            .eq("user_id", contact.id);

          if (otherP && otherP.length > 0) {
            setActiveConversationId(p.conversation_id);
            return p.conversation_id;
          }
        }
      }

      // Create new conversation
      const { data: conv } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (!conv) return "";

      // Add both participants
      await supabase.from("conversation_participants").insert([
        {
          conversation_id: conv.id,
          user_id: userId,
          user_name: `${currentUser.firstName} ${currentUser.lastName}`,
          user_avatar: currentUser.avatar,
          user_role: currentUser.role,
        },
        {
          conversation_id: conv.id,
          user_id: contact.id,
          user_name: contact.name,
          user_avatar: contact.avatar || null,
          user_role: contact.role,
        },
      ]);

      // Optimistically add conversation to state
      const newConv: Conversation = {
        id: conv.id,
        created_at: conv.created_at,
        participants: [
          {
            user_id: userId,
            user_name: `${currentUser.firstName} ${currentUser.lastName}`,
            user_avatar: currentUser.avatar || null,
            user_role: currentUser.role,
          },
          {
            user_id: contact.id,
            user_name: contact.name,
            user_avatar: contact.avatar || null,
            user_role: contact.role,
          },
        ],
        unreadCount: 0,
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(conv.id);
      setMessages([]);
      return conv.id;
    },
    [userId, currentUser, setActiveConversationId]
  );

  const getConversationByContact = useCallback(
    (contactId: string) =>
      conversations.find((c) => c.participants.some((p) => p.user_id === contactId)),
    [conversations]
  );

  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!userId) return;

      const { data: unread } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .is("read_at", null);

      if (unread && unread.length > 0) {
        const ids = unread.map((m: any) => m.id);
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", ids);

        setMessages((prev) =>
          prev.map((m) =>
            ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m
          )
        );

        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    },
    [userId]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (!userId) return;

      const editedAt = new Date().toISOString();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: newContent, edited_at: editedAt } : m
        )
      );

      const { error } = await supabase
        .from("messages")
        .update({ content: newContent, edited_at: editedAt })
        .eq("id", messageId)
        .eq("sender_id", userId);

      if (error) {
        toast.error("Failed to edit message");
        loadMessages();
      }
    },
    [userId, loadMessages]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!userId) return;

      const backup = messages;

      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", userId);

      if (error) {
        toast.error("Failed to delete message");
        setMessages(backup);
      } else {
        loadConversations();
      }
    },
    [userId, messages, loadConversations]
  );

  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!userId) return;

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationIdRaw(null);
        setMessages([]);
      }

      // Clear cache
      delete messageCacheRef.current[conversationId];

      await supabase.from("messages").delete().eq("conversation_id", conversationId);
      await supabase.from("conversation_participants").delete().eq("conversation_id", conversationId);
      const { error } = await supabase.from("conversations").delete().eq("id", conversationId);

      if (error) {
        toast.error("Failed to delete conversation");
        loadConversations();
      }
    },
    [userId, activeConversationId, loadConversations]
  );
  const uploadFile = useCallback(
    async (conversationId: string, file: File) => {
      if (!userId) return;

      const filePath = `${conversationId}/${crypto.randomUUID()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Failed to upload file");
        return;
      }

      // Send a message referencing the file
      const { data: msgData } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: `📎 ${file.name}`,
        })
        .select()
        .single();

      // Track in chat_files table
      await supabase.from("chat_files").insert({
        conversation_id: conversationId,
        message_id: msgData?.id || null,
        sender_id: userId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || "application/octet-stream",
      } as any);

      loadConversations();
    },
    [userId, loadConversations]
  );

  const getConversationFiles = useCallback(
    async (conversationId: string): Promise<ChatFile[]> => {
      const { data, error } = await supabase
        .from("chat_files")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load files");
        return [];
      }
      return (data as any as ChatFile[]) || [];
    },
    []
  );

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        messages,
        sendMessage,
        editMessage,
        deleteMessage,
        deleteConversation,
        startConversation,
        getConversationByContact,
        markAsRead,
        setTyping,
        typingUsers,
        loading,
        messagesLoading,
        uploadFile,
        getConversationFiles,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}
