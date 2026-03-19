import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  description: string;
  xp_amount: number;
  type: "success" | "warning";
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = currentUser?.id ?? "";

  const query = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, queryClient]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  }, [userId, queryClient]);

  const markAllAsRead = useCallback(async () => {
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
  }, [userId, queryClient]);

  const unreadCount = (query.data ?? []).filter((n) => !n.read).length;

  return { ...query, notifications: query.data ?? [], unreadCount, markAsRead, markAllAsRead };
}
