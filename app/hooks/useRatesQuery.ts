"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export interface Rate {
  id: string;
  name: string;
  value: number;
  updated_at: string;
}

async function fetchRates(): Promise<Rate[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rates")
    .select("id, name, value, updated_at")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Rate[];
}

export function useRatesQuery() {
  return useQuery<Rate[]>({
    queryKey: ["rates"],
    queryFn: fetchRates,
  });
}
