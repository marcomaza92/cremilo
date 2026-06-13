"use client";

import { useTransactions } from "./useTransactions";

export function useTarjetas() {
  return useTransactions("tarjetas");
}
