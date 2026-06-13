"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import type { PaymentMethod, PaymentMethodType } from "./types";

export const PAYMENT_METHODS_KEY = ["payment_methods"] as const;

export function usePaymentMethods() {
  const supabase = createClient();
  return useQuery({
    queryKey: PAYMENT_METHODS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("id, user_id, name, type, card_last4, created_at")
        .order("type")
        .order("name");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
}

type CreatePaymentMethodInput = {
  name: string;
  type: PaymentMethodType;
  card_last4?: string | null;
};

export function useCreatePaymentMethod() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, type, card_last4 }: CreatePaymentMethodInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("payment_methods")
        .insert({ user_id: user!.id, name, type, card_last4: card_last4 ?? null })
        .select("id, user_id, name, type, card_last4, created_at")
        .single();
      if (error) throw error;
      return data as PaymentMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
    },
  });
}

type UpdatePaymentMethodInput = {
  id: string;
  name: string;
  type: PaymentMethodType;
  card_last4?: string | null;
};

export function useUpdatePaymentMethod() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, type, card_last4 }: UpdatePaymentMethodInput) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .update({ name, type, card_last4: card_last4 ?? null })
        .eq("id", id)
        .select("id, user_id, name, type, card_last4, created_at")
        .single();
      if (error) throw error;
      return data as PaymentMethod;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
    },
  });
}

export function useDeletePaymentMethod() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENT_METHODS_KEY });
    },
  });
}

// Returns count of transactions referencing this payment method by name.
// Uses the existing transactions.payment_method text column.
export function usePaymentMethodReferenceCount(paymentMethodName: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["payment_method_reference_count", paymentMethodName],
    queryFn: async () => {
      if (!paymentMethodName) return 0;
      const { count, error } = await supabase
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("payment_method", paymentMethodName);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!paymentMethodName,
  });
}
