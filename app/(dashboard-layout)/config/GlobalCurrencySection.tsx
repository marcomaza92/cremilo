"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserConfig } from "@/app/hooks/useUserConfig";
import { Rate } from "@/app/hooks/useRates";
import styles from "./GlobalCurrencySection.module.css";

const CURRENCIES = ["ARS", "USD", "EUR"] as const;
type Currency = (typeof CURRENCIES)[number];

export default function GlobalCurrencySection() {
  const { config, loading, saving, update } = useUserConfig();
  const [rates, setRates] = useState<Rate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);

  const currency = config.global_currency as Currency;
  const showRateSelector = currency !== "ARS";

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      setRatesLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRatesLoading(false); return; }
      const { data } = await supabase
        .from("rates")
        .select("id, name, value")
        .eq("user_id", user.id)
        .order("name", { ascending: true });
      setRates((data as Rate[]) ?? []);
      setRatesLoading(false);
    })();
  }, []);

  function setCurrency(next: Currency) {
    update({
      global_currency: next,
      global_rate_id: next === "ARS" ? null : config.global_rate_id,
    });
  }

  const selectedRate = rates.find((r) => r.id === config.global_rate_id);

  if (loading) return <p className={styles.currency__empty}>Cargando...</p>;

  return (
    <div className={styles.currency} aria-busy={saving}>
      <div className={styles.currency__row}>
        <span className={styles.currency__label}>Moneda predeterminada</span>
        <div
          className={styles.currency__toggleGroup}
          role="group"
          aria-label="Moneda predeterminada"
        >
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.currency__toggle} ${currency === c ? styles["currency__toggle--active"] : ""}`}
              aria-pressed={currency === c}
              onClick={() => setCurrency(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {showRateSelector && (
        <div className={styles.currency__row}>
          <label
            className={styles.currency__label}
            htmlFor="global-rate-select"
          >
            Tasa de cambio ({currency}/ARS)
          </label>
          {ratesLoading ? (
            <span className={styles.currency__hint}>Cargando tasas...</span>
          ) : rates.length === 0 ? (
            <span className={styles.currency__hint}>
              Agregá una tasa en la sección TASAS primero.
            </span>
          ) : (
            <select
              id="global-rate-select"
              className={styles.currency__select}
              value={config.global_rate_id ?? ""}
              onChange={(e) =>
                update({ global_rate_id: e.target.value || null })
              }
              aria-label={`Seleccionar tasa de cambio ${currency} a ARS`}
            >
              <option value="">— Seleccionar tasa —</option>
              {rates.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.value})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {showRateSelector && selectedRate && (
        <div
          className={styles.currency__preview}
          aria-label="Vista previa de conversión"
        >
          <span className={styles.currency__previewLabel}>Vista previa</span>
          <span className={styles.currency__previewValue}>
            1 {currency} = {selectedRate.value.toLocaleString("es-AR")} ARS
          </span>
        </div>
      )}
    </div>
  );
}
