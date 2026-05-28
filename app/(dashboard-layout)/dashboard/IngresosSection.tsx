"use client";

import { useState } from "react";
import DataTable, { DataTableRow } from "@/app/components/DataTable/DataTable";
import ItemForm, { ItemFormData } from "@/app/components/ItemForm";

const STUB_ROWS: DataTableRow[] = [
  {
    id: "i-1",
    name: "Sueldo",
    amount: 450000,
    currency: "ARS",
    dueDate: "2026-05-31",
    status: "Pagado",
  },
  {
    id: "i-2",
    name: "Freelance",
    amount: 120000,
    currency: "ARS",
    dueDate: "2026-05-15",
    status: "Pendiente",
  },
];

type FormMode = { type: "add" } | { type: "edit"; id: string } | null;

export default function IngresosSection() {
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
        title="Ingresos"
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
