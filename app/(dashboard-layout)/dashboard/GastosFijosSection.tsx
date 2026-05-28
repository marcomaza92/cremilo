"use client";

import DataTable from "@/app/components/DataTable/DataTable";
import ItemForm from "@/app/components/ItemForm";
import { useGastosFijos } from "@/app/hooks/useGastosFijos";

export default function GastosFijosSection() {
  const { rows, formMode, editItem, openAdd, openEdit, remove, save, cancel } =
    useGastosFijos();

  return (
    <>
      <DataTable
        title="Gastos Fijos"
        rows={rows}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={remove}
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
          onSave={save}
          onCancel={cancel}
        />
      )}
    </>
  );
}
