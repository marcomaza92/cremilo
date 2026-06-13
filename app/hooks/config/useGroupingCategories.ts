"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { GroupingCategory } from "./types";

export const GROUPING_CATEGORIES_KEY = ["grouping_categories"] as const;

export function useGroupingCategories() {
  const supabase = createClient();
  return useQuery({
    queryKey: GROUPING_CATEGORIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grouping_categories")
        .select("id, user_id, name, created_at")
        .order("name");
      if (error) throw error;
      return data as GroupingCategory[];
    },
  });
}

export function useCreateGroupingCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("grouping_categories")
        .insert({ user_id: user!.id, name })
        .select("id, user_id, name, created_at")
        .single();
      if (error) throw error;
      return data as GroupingCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPING_CATEGORIES_KEY });
    },
  });
}

export function useUpdateGroupingCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("grouping_categories")
        .update({ name })
        .eq("id", id)
        .select("id, user_id, name, created_at")
        .single();
      if (error) throw error;
      return data as GroupingCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPING_CATEGORIES_KEY });
    },
  });
}

export function useDeleteGroupingCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    // Callers must verify child category count is 0 before invoking.
    // The DB ON DELETE CASCADE on categories.grouping_category_id will
    // propagate anyway, but the UI must block deletion when children exist.
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("grouping_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUPING_CATEGORIES_KEY });
    },
  });
}

// Returns number of categories still assigned to this grouping.
// Used to block deletion and render the tooltip.
export function useGroupingCategoryChildCount(groupingId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["grouping_category_child_count", groupingId],
    queryFn: async () => {
      if (!groupingId) return 0;
      const { count, error } = await supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("grouping_category_id", groupingId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!groupingId,
  });
}
