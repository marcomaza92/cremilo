"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { GROUPING_CATEGORIES_KEY } from "./useGroupingCategories";
import type { Category } from "./types";

export const CATEGORIES_KEY = ["categories"] as const;

export function useCategories() {
  const supabase = createClient();
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, user_id, name, grouping_category_id, created_at")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      grouping_category_id,
    }: {
      name: string;
      grouping_category_id: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("categories")
        .insert({ user_id: user!.id, name, grouping_category_id })
        .select("id, user_id, name, grouping_category_id, created_at")
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      // Invalidate child counts so the grouping delete button updates
      queryClient.invalidateQueries({ queryKey: GROUPING_CATEGORIES_KEY });
    },
  });
}

export function useUpdateCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      grouping_category_id,
    }: {
      id: string;
      name: string;
      grouping_category_id: string;
    }) => {
      const { data, error } = await supabase
        .from("categories")
        .update({ name, grouping_category_id })
        .eq("id", id)
        .select("id, user_id, name, grouping_category_id, created_at")
        .single();
      if (error) throw error;
      return data as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
    },
  });
}

export function useDeleteCategory() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    // replacementId: when the category is referenced by entries, all refs must be
    // updated to replacementId before deleting. Future work once transactions.category_id exists.
    mutationFn: async ({
      id,
    }: {
      id: string;
      replacementId?: string;
    }) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: GROUPING_CATEGORIES_KEY });
    },
  });
}

// Returns count of entries referencing this category.
// Currently 0 — transactions.category_id FK not yet added (future Gastos Diarios work).
export function useCategoryReferenceCount(categoryId: string | null) {
  return useQuery({
    queryKey: ["category_reference_count", categoryId],
    queryFn: async () => 0,
    enabled: !!categoryId,
  });
}
