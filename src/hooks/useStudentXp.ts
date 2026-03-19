import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StudentXpRow {
  id: string;
  student_id: string;
  university_id: string;
  total_xp: number;
  xp_supervisor: number;
  xp_research: number;
  xp_referrals: number;
  xp_profile: number;
  rank_change: number;
}

async function fetchStudentXp(): Promise<StudentXpRow[]> {
  const { data, error } = await supabase
    .from("student_xp")
    .select("*")
    .order("total_xp", { ascending: false });

  if (error) throw error;
  return (data ?? []) as StudentXpRow[];
}

export function useStudentXp() {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes on student_xp
  useEffect(() => {
    const channel = supabase
      .channel("student-xp-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "student_xp" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["student_xp"] });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["student_xp"],
    queryFn: fetchStudentXp,
    staleTime: 10_000,
  });
}
