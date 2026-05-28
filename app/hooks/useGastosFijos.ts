"use client";

import { useTransactions } from "./useTransactions";

export function useGastosFijos() {
  return useTransactions("gastos");
}
