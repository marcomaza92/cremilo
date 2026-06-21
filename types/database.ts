export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          user_id: string;
          section: "ingresos" | "gastos" | "tarjetas";
          name: string;
          amount: number;
          currency: string;
          is_paid: boolean;
          payment_method: string | null;
          installment_number: number | null;
          total_installments: number | null;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          section: "ingresos" | "gastos" | "tarjetas";
          name: string;
          amount?: number;
          currency?: string;
          is_paid?: boolean;
          payment_method?: string | null;
          installment_number?: number | null;
          total_installments?: number | null;
          due_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          section?: "ingresos" | "gastos" | "tarjetas";
          name?: string;
          amount?: number;
          currency?: string;
          is_paid?: boolean;
          payment_method?: string | null;
          installment_number?: number | null;
          total_installments?: number | null;
          due_date?: string | null;
          created_at?: string;
        };
      };
      rates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          value: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          value: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          value?: number;
          updated_at?: string;
        };
      };
      user_config: {
        Row: {
          user_id: string;
          date_format: string;
          number_format: string;
          global_currency: string;
          global_rate_id: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          date_format?: string;
          number_format?: string;
          global_currency?: string;
          global_rate_id?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          date_format?: string;
          number_format?: string;
          global_currency?: string;
          global_rate_id?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
