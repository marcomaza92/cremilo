"use client";

import { useState } from "react";
import DataTable, { DataTableRow } from "@/app/components/DataTable/DataTable";
import ItemForm, { ItemFormData } from "@/app/components/ItemForm";

const STUB_ROWS: DataTableRow[] = [
  {
    id: "1",
    name: "Tarjeta 6305",
    amount: 45000,
    currency: "ARS",
    dueDate: "2026-06-10",
    status: "Pendiente",
    children: [
      {
        id: "1a",
        name: "Netflix",
        amount: 8000,
        currency: "ARS",
        dueDate: "2026-06-10",
        status: "Pendiente",
      },
      {
        id: "1b",
        name: "Supermercado",
        amount: 37000,
        currency: "ARS",
        dueDate: "2026-06-10",
        status: "Pendiente",
      },
    ],
  },
  {
    id: "2",
    name: "Alquiler",
    amount: 180000,
    currency: "ARS",
    dueDate: "2026-05-01",
    status: "Pagado",
  },
  {
    id: "3",
    name: "Servicio de internet",
    amount: 12000,
    currency: "ARS",
    dueDate: "2026-05-15",
    status: "Vencido",
  },
];

type FormMode = { type: "add" } | { type: "edit"; id: string } | null;

export default function ExpensesSection() {
  const [formMode, setFormMode] = useState<FormMode>(null);

  function handleAdd() {
    setFormMode({ type: "add" });
  }

  function handleEdit(id: string) {
    setFormMode({ type: "edit", id });
  }

  function handleDelete(id: string) {
    console.log("delete", id);
  }

  function handleSave(data: ItemFormData) {
    console.log("save", data);
    setFormMode(null);
  }

  function handleCancel() {
    setFormMode(null);
  }

  const editItem =
    formMode?.type === "edit"
      ? STUB_ROWS.find((r) => r.id === formMode.id)
      : undefined;

  return (
    <>
      <DataTable
        title="Gastos del mes"
        rows={STUB_ROWS}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {formMode && (
        <ItemForm
          item={
            editItem
              ? {
                  id: editItem.id,
                  name: editItem.name,
                  currency: editItem.currency as "ARS" | "USD",
                  amount: editItem.amount,
                  dueDate: editItem.dueDate,
                  isPaid: editItem.status === "Pagado",
                }
              : undefined
          }
          globalRate={1200}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
