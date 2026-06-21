"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export interface UserConfig {
  date_format: string;
  number_format: string;
  global_currency: string;
  global_currency_rate: number;
}

const DEFAULTS: UserConfig = {
  date_format: "DD/MM/YYYY",
  number_format: "comma-prefix",
  global_currency: "ARS",
  global_currency_rate: 0,
};

export function useUserConfig() {
  const [config, setConfig] = useState<UserConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("user_config")
      .select("date_format, number_format, global_currency, global_currency_rate")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setConfig({ ...DEFAULTS, ...data });
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(async (patch: Partial<UserConfig>) => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const next = { ...config, ...patch };
    setConfig(next);
    await supabase
      .from("user_config")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    setSaving(false);
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  return { config, loading, saving, update };
}
