import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["student_xp"],
    queryFn: fetchStudentXp,
    staleTime: 5 * 60 * 1000,
  });
}
