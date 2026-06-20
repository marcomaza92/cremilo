"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export interface Rate {
  id: string;
  name: string;
  value: number;
}

export function useRates() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("rates")
      .select("id, name, value")
      .order("name", { ascending: true });

    if (!error && data) {
      setRates(data as Rate[]);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  async function add(name: string, value: number) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: created, error } = await supabase
      .from("rates")
      .insert({ user_id: user!.id, name, value })
      .select("id, name, value")
      .single();

    if (!error && created) {
      setRates((prev) => [...prev, created as Rate]);
    }
    setAdding(false);
  }

  async function remove(id: string) {
    setRates((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("rates").delete().eq("id", id);
  }

  return { rates, loading, adding, setAdding, add, remove };
}
