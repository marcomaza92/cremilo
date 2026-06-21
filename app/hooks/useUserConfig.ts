"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

export interface UserConfig {
  date_format: string;
  number_format: string;
  global_currency: string;
  global_rate_id: string | null;
}

const DEFAULTS: UserConfig = {
  date_format: "DD/MM/YYYY",
  // DB default is 'dot-comma'; we normalise it to our encoding on read
  number_format: "comma-prefix",
  global_currency: "ARS",
  global_rate_id: null,
};

// DB stores legacy 'dot-comma' / 'comma-dot'; our UI uses '<decimal>-<position>'.
// Map old values on the way in; write new format on the way out.
function normaliseFmt(raw: string): string {
  if (raw === "dot-comma") return "comma-prefix";
  if (raw === "comma-dot") return "dot-prefix";
  return raw;
}

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
      .select("date_format, number_format, global_currency, global_rate_id")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setConfig({
        ...DEFAULTS,
        ...data,
        number_format: normaliseFmt(data.number_format),
      });
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<UserConfig>) => {
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
      await supabase.from("user_config").upsert(
        {
          user_id: user.id,
          date_format: next.date_format,
          number_format: next.number_format,
          global_currency: next.global_currency,
          global_rate_id: next.global_rate_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      setSaving(false);
    },
    [config] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { config, loading, saving, update };
}
