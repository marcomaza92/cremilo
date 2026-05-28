"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./ItemForm.module.css";

export type Currency = "ARS" | "USD";
export type PaymentMethod = "Efectivo" | "Débito" | "Crédito" | "Transferencia" | "Otro";

export interface ItemFormData {
  name: string;
  currency: Currency;
  amount: number;
  rate?: number;
  isPaid: boolean;
  paymentMethod: PaymentMethod;
  dueDate: string;
}

export interface ItemFormProps {
  /** When provided, the form opens in edit mode with these values pre-filled. */
  item?: Partial<ItemFormData> & { id?: string };
  /** Pre-filled rate for USD mode (from global config). */
  globalRate?: number;
  onSave: (data: ItemFormData) => void;
  onCancel: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "Efectivo",
  "Débito",
  "Crédito",
  "Transferencia",
  "Otro",
];

function initialState(item?: ItemFormProps["item"], globalRate?: number): ItemFormData {
  return {
    name: item?.name ?? "",
    currency: item?.currency ?? "ARS",
    amount: item?.amount ?? 0,
    rate: item?.rate ?? globalRate,
    isPaid: item?.isPaid ?? false,
    paymentMethod: item?.paymentMethod ?? "Efectivo",
    dueDate: item?.dueDate ?? "",
  };
}

export default function ItemForm({
  item,
  globalRate,
  onSave,
  onCancel,
}: ItemFormProps) {
  const [form, setForm] = useState<ItemFormData>(() =>
    initialState(item, globalRate)
  );
  const [errors, setErrors] = useState<Partial<Record<keyof ItemFormData, string>>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusable = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(item?.id);

  /* Focus trap + Escape to cancel */
  useEffect(() => {
    firstFocusable.current?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  function set<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.amount || form.amount <= 0) next.amount = "Amount must be greater than 0.";
    if (form.currency === "USD" && (!form.rate || form.rate <= 0))
      next.rate = "Rate is required for USD items.";
    if (!form.dueDate) next.dueDate = "Due date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSave(form);
  }

  return (
    /* Backdrop */
    <div
      className={styles.backdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-form-title"
        className={styles.dialog}
      >
        {/* Header */}
        <div className={styles.dialog__header}>
          <h2 id="item-form-title" className={styles.dialog__title}>
            {isEdit ? "EDIT ITEM" : "ADD ITEM"}
          </h2>
          <button
            type="button"
            className={styles.dialog__close}
            aria-label="Cancel and close form"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {/* Name */}
          <div className={styles.field}>
            <label htmlFor="item-name" className={styles.field__label}>
              Name
            </label>
            <input
              ref={firstFocusable}
              id="item-name"
              type="text"
              className={`${styles.field__input} ${errors.name ? styles["field__input--error"] : ""}`}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              aria-describedby={errors.name ? "item-name-error" : undefined}
              aria-invalid={Boolean(errors.name)}
              maxLength={120}
              autoComplete="off"
            />
            {errors.name && (
              <span id="item-name-error" className={styles.field__error} role="alert">
                {errors.name}
              </span>
            )}
          </div>

          {/* Currency toggle */}
          <div className={styles.field}>
            <span className={styles.field__label} id="currency-label">
              Currency
            </span>
            <div
              role="group"
              aria-labelledby="currency-label"
              className={styles.currencyToggle}
            >
              {(["ARS", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={form.currency === c}
                  className={`${styles.currencyToggle__btn} ${
                    form.currency === c ? styles["currencyToggle__btn--active"] : ""
                  }`}
                  onClick={() => set("currency", c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Rate row */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="item-amount" className={styles.field__label}>
                Real value ({form.currency})
              </label>
              <input
                id="item-amount"
                type="number"
                min={0}
                step="0.01"
                className={`${styles.field__input} ${errors.amount ? styles["field__input--error"] : ""}`}
                value={form.amount || ""}
                onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                aria-describedby={errors.amount ? "item-amount-error" : undefined}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && (
                <span id="item-amount-error" className={styles.field__error} role="alert">
                  {errors.amount}
                </span>
              )}
            </div>

            {form.currency === "USD" && (
              <div className={styles.field}>
                <label htmlFor="item-rate" className={styles.field__label}>
                  Rate (ARS/USD)
                </label>
                <input
                  id="item-rate"
                  type="number"
                  min={0}
                  step="0.01"
                  className={`${styles.field__input} ${errors.rate ? styles["field__input--error"] : ""}`}
                  value={form.rate || ""}
                  onChange={(e) => set("rate", parseFloat(e.target.value) || undefined)}
                  aria-describedby={errors.rate ? "item-rate-error" : undefined}
                  aria-invalid={Boolean(errors.rate)}
                />
                {errors.rate && (
                  <span id="item-rate-error" className={styles.field__error} role="alert">
                    {errors.rate}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Due date */}
          <div className={styles.field}>
            <label htmlFor="item-due-date" className={styles.field__label}>
              Due Date
            </label>
            <input
              id="item-due-date"
              type="date"
              className={`${styles.field__input} ${errors.dueDate ? styles["field__input--error"] : ""}`}
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              aria-describedby={errors.dueDate ? "item-due-date-error" : undefined}
              aria-invalid={Boolean(errors.dueDate)}
            />
            {errors.dueDate && (
              <span id="item-due-date-error" className={styles.field__error} role="alert">
                {errors.dueDate}
              </span>
            )}
          </div>

          {/* Is paid + Payment method row */}
          <div className={styles.row}>
            {/* Is Paid toggle */}
            <div className={styles.field}>
              <span className={styles.field__label} id="is-paid-label">
                Is paid?
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={form.isPaid}
                aria-labelledby="is-paid-label"
                className={`${styles.toggle} ${form.isPaid ? styles["toggle--on"] : ""}`}
                onClick={() => set("isPaid", !form.isPaid)}
              >
                <span className={styles.toggle__track} aria-hidden="true">
                  <span className={styles.toggle__thumb} />
                </span>
                <span className={styles.toggle__label}>
                  {form.isPaid ? "Yes" : "No"}
                </span>
              </button>
            </div>

            {/* Payment method */}
            <div className={styles.field}>
              <label htmlFor="item-payment-method" className={styles.field__label}>
                Payment Method
              </label>
              <select
                id="item-payment-method"
                className={styles.field__select}
                value={form.paymentMethod}
                onChange={(e) =>
                  set("paymentMethod", e.target.value as PaymentMethod)
                }
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actions__cancel}
              onClick={onCancel}
            >
              CANCEL
            </button>
            <button type="submit" className={styles.actions__save}>
              {isEdit ? "SAVE CHANGES" : "ADD ITEM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
