"use client";

import DataTable, { DataTableRow } from "@/app/components/DataTable/DataTable";

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

export default function ExpensesSection() {
  function handleAdd() {
    console.log("add");
  }

  function handleEdit(id: string) {
    console.log("edit", id);
  }

  function handleDelete(id: string) {
    console.log("delete", id);
  }

  return (
    <DataTable
      title="Gastos del mes"
      rows={STUB_ROWS}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
