"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { UserConfig } from "./types";

export const USER_CONFIG_KEY = ["user_config"] as const;

export function useUserConfig() {
  const supabase = createClient();
  return useQuery({
    queryKey: USER_CONFIG_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_config")
        .select("user_id, date_format, number_format, global_currency, global_rate_id, updated_at")
        .single();
      if (error) throw error;
      return data as UserConfig;
    },
  });
}

type UserConfigPatch = Partial<
  Pick<UserConfig, "date_format" | "number_format" | "global_currency" | "global_rate_id">
>;

export function useUpdateUserConfig() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: UserConfigPatch) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("user_config")
        .upsert(
          { user_id: user!.id, ...patch, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
        .select("user_id, date_format, number_format, global_currency, global_rate_id, updated_at")
        .single();
      if (error) throw error;
      return data as UserConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_CONFIG_KEY });
    },
  });
}
