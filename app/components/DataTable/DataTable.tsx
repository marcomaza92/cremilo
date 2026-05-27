"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./DataTable.module.css";

export interface DataTableRow {
  id: string;
  name: string;
  amount: number;
  currency: string;
  isPaid: boolean;
  paymentMethod: string | null;
}

export interface DataTableProps {
  title: string;
  rows: DataTableRow[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatValue?: (amount: number, currency: string) => string;
}

function defaultFormatValue(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("es-AR")}`;
}

function KebabMenu({
  rowId,
  onEdit,
  onDelete,
}: {
  rowId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  function handleMenuKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]'
      );
      if (!items) return;
      const focused = document.activeElement;
      const idx = Array.from(items).indexOf(focused as HTMLButtonElement);
      const next =
        e.key === "ArrowDown"
          ? (idx + 1) % items.length
          : (idx - 1 + items.length) % items.length;
      items[next].focus();
    }
  }

  return (
    <div className={styles.kebab} ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.kebab__trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Row actions"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">⋮</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Row actions"
          className={styles.kebab__menu}
          onKeyDown={handleMenuKey}
        >
          <button
            role="menuitem"
            type="button"
            className={styles.kebab__item}
            onClick={() => {
              close();
              onEdit(rowId);
            }}
          >
            Edit
          </button>
          <button
            role="menuitem"
            type="button"
            className={`${styles.kebab__item} ${styles["kebab__item--danger"]}`}
            onClick={() => {
              close();
              onDelete(rowId);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function DataTable({
  title,
  rows,
  onAdd,
  onEdit,
  onDelete,
  formatValue = defaultFormatValue,
}: DataTableProps) {
  const [collapsed, setCollapsed] = useState(false);
  const contentId = `datatable-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className={styles.table}>
      <div className={styles.table__header}>
        <button
          type="button"
          className={styles.table__collapse}
          aria-expanded={!collapsed}
          aria-controls={contentId}
          onClick={() => setCollapsed((v) => !v)}
        >
          <span
            className={styles.table__collapseIcon}
            aria-hidden="true"
          >
            {collapsed ? "▶" : "▼"}
          </span>
          <h2 className={styles.table__title}>{title.toUpperCase()}</h2>
        </button>

        <button
          type="button"
          className={styles.table__addBtn}
          onClick={onAdd}
          aria-label={`Add item to ${title}`}
        >
          + ADD
        </button>
      </div>

      <div id={contentId} hidden={collapsed}>
        <table className={styles.table__grid} role="table">
          <thead>
            <tr className={styles.table__row}>
              <th className={styles.table__th} scope="col">Item</th>
              <th className={styles.table__th} scope="col">Value</th>
              <th className={styles.table__th} scope="col">Paid?</th>
              <th className={styles.table__th} scope="col">Payment Method</th>
              <th className={styles.table__th} scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  className={styles.table__empty}
                  colSpan={5}
                >
                  No items yet. Click &ldquo;+ ADD&rdquo; to add one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className={styles.table__row}>
                  <td className={styles.table__td}>{row.name}</td>
                  <td className={styles.table__td}>
                    {formatValue(row.amount, row.currency)}
                  </td>
                  <td className={styles.table__td}>
                    <span
                      className={`${styles.badge} ${
                        row.isPaid
                          ? styles["badge--paid"]
                          : styles["badge--unpaid"]
                      }`}
                      aria-label={row.isPaid ? "Paid" : "Unpaid"}
                    >
                      {row.isPaid ? "✓ Paid" : "✗ Unpaid"}
                    </span>
                  </td>
                  <td className={styles.table__td}>
                    {row.paymentMethod ?? "—"}
                  </td>
                  <td className={`${styles.table__td} ${styles["table__td--actions"]}`}>
                    <KebabMenu
                      rowId={row.id}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
