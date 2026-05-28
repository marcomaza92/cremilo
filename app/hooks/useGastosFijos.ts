"use client";

import { useState } from "react";
import { DataTableRow } from "@/app/components/DataTable/DataTable";
import { ItemFormData } from "@/app/components/ItemForm";

const STUB_ROWS: DataTableRow[] = [
  {
    id: "gf-1",
    name: "Alquiler",
    amount: 180000,
    currency: "ARS",
    dueDate: "2026-05-01",
    status: "Pagado",
  },
  {
    id: "gf-2",
    name: "Servicio de internet",
    amount: 12000,
    currency: "ARS",
    dueDate: "2026-05-15",
    status: "Vencido",
  },
  {
    id: "gf-3",
    name: "Seguro de auto",
    amount: 35000,
    currency: "ARS",
    dueDate: "2026-06-01",
    status: "Pendiente",
  },
];

export type GastosFijosFormMode =
  | { type: "add" }
  | { type: "edit"; id: string }
  | null;

export function useGastosFijos() {
  const [rows, setRows] = useState<DataTableRow[]>(STUB_ROWS);
  const [formMode, setFormMode] = useState<GastosFijosFormMode>(null);

  function openAdd() {
    setFormMode({ type: "add" });
  }

  function openEdit(id: string) {
    setFormMode({ type: "edit", id });
  }

  function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function save(data: ItemFormData) {
    if (formMode?.type === "edit") {
      const { id } = formMode;
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                name: data.name,
                amount: data.amount,
                currency: data.currency,
                dueDate: data.dueDate,
                status: data.isPaid ? "Pagado" : "Pendiente",
              }
            : r
        )
      );
    } else {
      const newRow: DataTableRow = {
        id: `gf-${Date.now()}`,
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        dueDate: data.dueDate,
        status: data.isPaid ? "Pagado" : "Pendiente",
      };
      setRows((prev) => [...prev, newRow]);
    }
    setFormMode(null);
  }

  function cancel() {
    setFormMode(null);
  }

  const editItem =
    formMode?.type === "edit"
      ? rows.find((r) => r.id === formMode.id)
      : undefined;

  return { rows, formMode, editItem, openAdd, openEdit, remove, save, cancel };
}
