"use client";

import { useUserConfig } from "@/app/hooks/useUserConfig";
import styles from "./GlobalCurrencySection.module.css";

const CURRENCIES = ["ARS", "USD", "EUR"] as const;
type Currency = (typeof CURRENCIES)[number];

export default function GlobalCurrencySection() {
  const { config, loading, saving, update } = useUserConfig();
  const currency = config.global_currency as Currency;
  const showRate = currency !== "ARS";

  function setCurrency(next: Currency) {
    update({ global_currency: next, global_currency_rate: next === "ARS" ? 0 : config.global_currency_rate });
  }

  function setRate(raw: string) {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0) {
      update({ global_currency_rate: parsed });
    }
  }

  if (loading) return <p className={styles.currency__empty}>Cargando...</p>;

  return (
    <div className={styles.currency} aria-busy={saving}>
      <div className={styles.currency__row}>
        <span className={styles.currency__label}>Moneda predeterminada</span>
        <div className={styles.currency__toggleGroup} role="group" aria-label="Moneda predeterminada">
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

      {showRate && (
        <div className={styles.currency__row}>
          <label className={styles.currency__label} htmlFor="global-currency-rate">
            Tasa de cambio ({currency}/ARS)
          </label>
          <input
            id="global-currency-rate"
            type="number"
            className={styles.currency__input}
            value={config.global_currency_rate || ""}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0.00"
            step="any"
            min="0"
            aria-label={`Tasa de cambio ${currency} a ARS`}
          />
        </div>
      )}

      {showRate && config.global_currency_rate > 0 && (
        <div className={styles.currency__preview} aria-label="Vista previa de conversión">
          <span className={styles.currency__previewLabel}>Vista previa</span>
          <span className={styles.currency__previewValue}>
            1 {currency} = {config.global_currency_rate.toLocaleString("es-AR")} ARS
          </span>
        </div>
      )}
    </div>
  );
}
