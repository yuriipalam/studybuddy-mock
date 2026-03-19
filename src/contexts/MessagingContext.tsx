import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactRole: "expert" | "supervisor" | "student";
  contactTitle: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface MessagingContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  startConversation: (contact: { id: string; name: string; role: "expert" | "supervisor" | "student"; title: string }) => string;
  sendMessage: (conversationId: string, content: string) => void;
  getConversation: (id: string) => Conversation | undefined;
  getConversationByContact: (contactId: string) => Conversation | undefined;
}

const AUTO_REPLIES = [
  "Thanks for reaching out! I'd be happy to discuss this further.",
  "That sounds very interesting. Could you tell me more about your background?",
  "Great question! Let me think about that and get back to you with more details.",
  "I appreciate your interest. Would you like to schedule a call to discuss this in more detail?",
  "Absolutely, I think there could be a great fit here. What's your timeline for the thesis?",
  "Thanks for your message! I'm currently supervising a few students on similar topics.",
  "That's a really relevant area of research. Have you looked into the latest publications on this?",
  "I'd recommend starting with a literature review in this area. Happy to point you to some key papers.",
  "Wonderful! Let's set up a short meeting to discuss the scope and expectations.",
  "I'm glad you're interested in this topic. We have some exciting data you could work with.",
  "Sure, I can provide more context about the project. When would be a good time to chat?",
  "Thanks! I'll share some relevant materials with you shortly.",
];

const STORAGE_KEY = "studyond-conversations";

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

const MessagingContext = createContext<MessagingContextType | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c.id === id),
    [conversations]
  );

  const getConversationByContact = useCallback(
    (contactId: string) => conversations.find((c) => c.contactId === contactId),
    [conversations]
  );

  const startConversation = useCallback(
    (contact: { id: string; name: string; role: "expert" | "supervisor" | "student"; title: string }) => {
      const existing = conversations.find((c) => c.contactId === contact.id);
      if (existing) {
        setActiveConversationId(existing.id);
        return existing.id;
      }

      const newConv: Conversation = {
        id: `conv-${Date.now()}`,
        contactId: contact.id,
        contactName: contact.name,
        contactRole: contact.role,
        contactTitle: contact.title,
        messages: [
          {
            id: `msg-${Date.now()}`,
            senderId: contact.id,
            content: `Hi! Thanks for connecting with me on Studyond. How can I help you?`,
            timestamp: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      return newConv.id;
    },
    [conversations]
  );

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: "student-01",
        content,
        timestamp: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, messages: [...c.messages, userMsg] } : c
        )
      );

      // Auto-reply after a short delay
      setTimeout(() => {
        setConversations((prev) => {
          const conv = prev.find((c) => c.id === conversationId);
          if (!conv) return prev;

          const replyIndex = conv.messages.length % AUTO_REPLIES.length;
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-reply`,
            senderId: conv.contactId,
            content: AUTO_REPLIES[replyIndex],
            timestamp: new Date().toISOString(),
          };

          return prev.map((c) =>
            c.id === conversationId ? { ...c, messages: [...c.messages, reply] } : c
          );
        });
      }, 1000 + Math.random() * 2000);
    },
    []
  );

  return (
    <MessagingContext.Provider
      value={{
        conversations,
        activeConversationId,
        setActiveConversationId,
        startConversation,
        sendMessage,
        getConversation,
        getConversationByContact,
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
