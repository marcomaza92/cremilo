"use client";

import { useTransactions } from "./useTransactions";

export type { } from "./useTransactions";

export function useIngresos() {
  return useTransactions("ingresos");
}
