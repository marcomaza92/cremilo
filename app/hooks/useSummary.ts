"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

export interface SummaryData {
  totalIncome: number;
  totalOutcome: number;
  remaining: number;
  currency: string;
}

async function fetchSummary(): Promise<SummaryData> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, currency, section")
    .in("section", ["ingresos", "gastos", "tarjetas"]);

  if (error) throw error;

  let totalIncome = 0;
  let totalOutcome = 0;

  for (const row of data ?? []) {
    const amount = Number(row.amount);
    if (row.section === "ingresos") {
      totalIncome += amount;
    } else {
      totalOutcome += amount;
    }
  }

  return {
    totalIncome,
    totalOutcome,
    remaining: totalIncome - totalOutcome,
    currency: "ARS",
  };
}

export function useSummary() {
  return useQuery<SummaryData>({
    queryKey: ["summary"],
    queryFn: fetchSummary,
  });
}
