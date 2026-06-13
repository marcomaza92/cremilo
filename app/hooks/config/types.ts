export type Rate = {
  id: string;
  user_id: string;
  name: string;
  value: number;
  updated_at: string;
};

export type GroupingCategory = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  grouping_category_id: string;
  created_at: string;
};

export type PaymentMethodType = "card" | "cash" | "transfer";

export type PaymentMethod = {
  id: string;
  user_id: string;
  name: string;
  type: PaymentMethodType;
  card_last4: string | null;
  created_at: string;
};

export type UserConfig = {
  user_id: string;
  date_format: string;
  number_format: string;
  global_currency: string;
  global_rate_id: string | null;
  updated_at: string;
};
