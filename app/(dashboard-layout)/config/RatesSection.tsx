"use client";

import { useRef, useState } from "react";
import { useRates } from "@/app/hooks/useRates";
import styles from "./RatesSection.module.css";

export default function RatesSection() {
  const { rates, loading, adding, setAdding, add, remove } = useRates();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  function openForm() {
    setAdding(true);
    setName("");
    setValue("");
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  function cancel() {
    setAdding(false);
    setName("");
    setValue("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(value);
    if (!name.trim() || isNaN(parsed)) return;
    await add(name.trim(), parsed);
    setName("");
    setValue("");
  }

  return (
    <div className={styles.rates}>
      {loading ? (
        <p className={styles.rates__empty}>Cargando...</p>
      ) : (
        <table className={styles.rates__table} role="table">
          <thead>
            <tr className={styles.rates__headRow}>
              <th className={styles.rates__th} scope="col">Nombre</th>
              <th className={styles.rates__th} scope="col">Valor</th>
              <th className={styles.rates__th} scope="col">
                <span className="visually-hidden">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 && !adding ? (
              <tr>
                <td className={styles.rates__empty} colSpan={3}>
                  Sin tasas configuradas.
                </td>
              </tr>
            ) : (
              rates.map((rate) => (
                <tr key={rate.id} className={styles.rates__row}>
                  <td className={styles.rates__td}>{rate.name}</td>
                  <td className={styles.rates__td}>{rate.value}</td>
                  <td className={`${styles.rates__td} ${styles["rates__td--actions"]}`}>
                    <button
                      type="button"
                      className={styles.rates__deleteBtn}
                      aria-label={`Eliminar ${rate.name}`}
                      onClick={() => remove(rate.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}

            {adding && (
              <tr className={styles.rates__formRow}>
                <td className={styles.rates__td} colSpan={3}>
                  <form className={styles.rates__form} onSubmit={handleSubmit}>
                    <input
                      ref={nameRef}
                      className={styles.rates__input}
                      type="text"
                      placeholder="Nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      aria-label="Nombre de la tasa"
                    />
                    <input
                      className={styles.rates__input}
                      type="number"
                      placeholder="Valor"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      step="any"
                      required
                      aria-label="Valor de la tasa"
                    />
                    <div className={styles.rates__formActions}>
                      <button type="submit" className={styles.rates__saveBtn}>
                        GUARDAR
                      </button>
                      <button
                        type="button"
                        className={styles.rates__cancelBtn}
                        onClick={cancel}
                      >
                        CANCELAR
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {!adding && (
        <button
          type="button"
          className={styles.rates__addBtn}
          onClick={openForm}
        >
          + AGREGAR TASA
        </button>
      )}
    </div>
  );
}
