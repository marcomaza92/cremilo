"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { Rate } from "./types";

export const RATES_KEY = ["rates"] as const;

export function useRates() {
  const supabase = createClient();
  return useQuery({
    queryKey: RATES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rates")
        .select("id, user_id, name, value, updated_at")
        .order("name");
      if (error) throw error;
      return data as Rate[];
    },
  });
}

export function useCreateRate() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, value }: { name: string; value: number }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("rates")
        .insert({ user_id: user!.id, name, value, updated_at: new Date().toISOString() })
        .select("id, user_id, name, value, updated_at")
        .single();
      if (error) throw error;
      return data as Rate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATES_KEY });
    },
  });
}

export function useUpdateRate() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, value }: { id: string; name: string; value: number }) => {
      const { data, error } = await supabase
        .from("rates")
        .update({ name, value, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("id, user_id, name, value, updated_at")
        .single();
      if (error) throw error;
      return data as Rate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATES_KEY });
    },
  });
}

export function useDeleteRate() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      replacementId,
    }: {
      id: string;
      replacementId?: string;
    }) => {
      // Clear or remap global_rate_id before deleting
      await supabase
        .from("user_config")
        .update({ global_rate_id: replacementId ?? null })
        .eq("global_rate_id", id);

      const { error } = await supabase.from("rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RATES_KEY });
      queryClient.invalidateQueries({ queryKey: USER_CONFIG_KEY });
    },
  });
}

// Returns count of transactions referencing this rate.
// Currently 0 — transactions.rate_id FK not yet added (future Monthly Calculator work).
export function useRateReferenceCount(rateId: string | null) {
  return useQuery({
    queryKey: ["rate_reference_count", rateId],
    queryFn: async () => 0,
    enabled: !!rateId,
  });
}

// Imported here to avoid a circular dependency between useRates and useUserConfig
const USER_CONFIG_KEY = ["user_config"] as const;
