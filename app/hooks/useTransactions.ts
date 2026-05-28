"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { DataTableRow, RowStatus } from "@/app/components/DataTable/DataTable";
import { ItemFormData } from "@/app/components/ItemForm";

type Section = "ingresos" | "gastos" | "tarjetas";

type FormMode = { type: "add" } | { type: "edit"; id: string } | null;

function rowStatus(isPaid: boolean, dueDate: string | null): RowStatus {
  if (isPaid) return "Pagado";
  if (dueDate && new Date(dueDate) < new Date()) return "Vencido";
  return "Pendiente";
}

function dbRowToTableRow(row: Record<string, unknown>): DataTableRow {
  const isPaid = Boolean(row.is_paid);
  const dueDate = (row.due_date as string | null) ?? "";
  return {
    id: row.id as string,
    name: row.name as string,
    amount: Number(row.amount),
    currency: (row.currency as string) ?? "ARS",
    dueDate,
    status: rowStatus(isPaid, dueDate),
  };
}

export function useTransactions(section: Section) {
  const [rows, setRows] = useState<DataTableRow[]>([]);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, name, amount, currency, is_paid, due_date")
      .eq("section", section)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setRows(data.map(dbRowToTableRow));
    }
    setLoading(false);
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setFormMode({ type: "add" });
  }

  function openEdit(id: string) {
    setFormMode({ type: "edit", id });
  }

  async function remove(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    await supabase.from("transactions").delete().eq("id", id);
  }

  async function save(data: ItemFormData) {
    if (formMode?.type === "edit") {
      const { id } = formMode;
      const patch = {
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        is_paid: data.isPaid,
        due_date: data.dueDate || null,
      };
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...patch,
                status: rowStatus(data.isPaid, data.dueDate ?? null),
              }
            : r
        )
      );
      await supabase.from("transactions").update(patch).eq("id", id);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const insert = {
        user_id: user!.id,
        section,
        name: data.name,
        amount: data.amount,
        currency: data.currency,
        is_paid: data.isPaid,
        due_date: data.dueDate || null,
      };
      const { data: created, error } = await supabase
        .from("transactions")
        .insert(insert)
        .select("id, name, amount, currency, is_paid, due_date")
        .single();

      if (!error && created) {
        setRows((prev) => [...prev, dbRowToTableRow(created)]);
      }
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

  return {
    rows,
    loading,
    formMode,
    editItem,
    openAdd,
    openEdit,
    remove,
    save,
    cancel,
  };
}
