import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface XpActivityEntry {
  id: string;
  user_id: string;
  action: string;
  xp_amount: number;
  category: string;
  created_at: string;
}

export function useXpActivity() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const queryClient = useQueryClient();

  // Subscribe to realtime changes on xp_activity_log for this user
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("xp-activity-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "xp_activity_log" },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow.user_id === userId) {
            queryClient.invalidateQueries({ queryKey: ["xp_activity", userId] });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ["xp_activity", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("xp_activity_log")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as XpActivityEntry[];
    },
    enabled: !!userId,
    staleTime: 10_000,
  });
}
