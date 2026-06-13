"use client";

import DataTable from "@/app/components/DataTable/DataTable";
import ItemForm from "@/app/components/ItemForm";
import { useTarjetas } from "@/app/hooks/useTarjetas";

export default function TarjetasSection() {
  const { rows, formMode, editItem, openAdd, openEdit, remove, save, cancel } =
    useTarjetas();

  return (
    <>
      <DataTable
        title="Tarjetas"
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
