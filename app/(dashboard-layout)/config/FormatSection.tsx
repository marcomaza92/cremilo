"use client";

import { useUserConfig } from "@/app/hooks/useUserConfig";
import styles from "./FormatSection.module.css";

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

// number_format encodes decimal separator + currency position as "decimal-position"
// e.g. "comma-prefix" → decimal comma (1.234,56), symbol before ($ 100)
function parseNumberFormat(fmt: string): { decimal: "comma" | "dot"; position: "prefix" | "suffix" } {
  const parts = fmt.split("-");
  const decimal = parts[0] === "dot" ? "dot" : "comma";
  const position = parts[1] === "suffix" ? "suffix" : "prefix";
  return { decimal, position };
}

function buildPreview(decimal: "comma" | "dot", position: "prefix" | "suffix"): string {
  const amount = decimal === "comma" ? "1.234,56" : "1,234.56";
  return position === "prefix" ? `$ ${amount}` : `${amount} $`;
}

export default function FormatSection() {
  const { config, loading, saving, update } = useUserConfig();
  const { decimal, position } = parseNumberFormat(config.number_format);

  function setDecimal(next: "comma" | "dot") {
    update({ number_format: `${next}-${position}` });
  }

  function setPosition(next: "prefix" | "suffix") {
    update({ number_format: `${decimal}-${next}` });
  }

  if (loading) return <p className={styles.format__empty}>Cargando...</p>;

  return (
    <div className={styles.format} aria-busy={saving}>
      <div className={styles.format__row}>
        <span className={styles.format__label}>Separador decimal</span>
        <div className={styles.format__toggleGroup} role="group" aria-label="Separador decimal">
          <button
            type="button"
            className={`${styles.format__toggle} ${decimal === "comma" ? styles["format__toggle--active"] : ""}`}
            aria-pressed={decimal === "comma"}
            onClick={() => setDecimal("comma")}
          >
            ,
          </button>
          <button
            type="button"
            className={`${styles.format__toggle} ${decimal === "dot" ? styles["format__toggle--active"] : ""}`}
            aria-pressed={decimal === "dot"}
            onClick={() => setDecimal("dot")}
          >
            .
          </button>
        </div>
      </div>

      <div className={styles.format__row}>
        <span className={styles.format__label}>Posición del símbolo</span>
        <div className={styles.format__toggleGroup} role="group" aria-label="Posición del símbolo de moneda">
          <button
            type="button"
            className={`${styles.format__toggle} ${styles["format__toggle--wide"]} ${position === "prefix" ? styles["format__toggle--active"] : ""}`}
            aria-pressed={position === "prefix"}
            onClick={() => setPosition("prefix")}
          >
            $ 100
          </button>
          <button
            type="button"
            className={`${styles.format__toggle} ${styles["format__toggle--wide"]} ${position === "suffix" ? styles["format__toggle--active"] : ""}`}
            aria-pressed={position === "suffix"}
            onClick={() => setPosition("suffix")}
          >
            100 $
          </button>
        </div>
      </div>

      <div className={styles.format__row}>
        <span className={styles.format__label}>Formato de fecha</span>
        <div className={styles.format__toggleGroup} role="group" aria-label="Formato de fecha">
          {DATE_FORMATS.map((fmt) => (
            <button
              key={fmt}
              type="button"
              className={`${styles.format__toggle} ${styles["format__toggle--wide"]} ${config.date_format === fmt ? styles["format__toggle--active"] : ""}`}
              aria-pressed={config.date_format === fmt}
              onClick={() => update({ date_format: fmt })}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.format__preview} aria-label="Vista previa">
        <span className={styles.format__previewLabel}>Vista previa</span>
        <span className={styles.format__previewValue}>
          {buildPreview(decimal, position)}
        </span>
      </div>
    </div>
  );
}
