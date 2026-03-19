import { useQuery } from "@tanstack/react-query";
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
    staleTime: 30_000,
  });
}
