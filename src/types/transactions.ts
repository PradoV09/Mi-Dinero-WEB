import type { Currency } from "../utils/money";

export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  account_id: string;
  category_id: string;
  category_name?: string;
  amount: string;
  currency: Currency;
  transaction_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionInput {
  type: TransactionType;
  account_id: string;
  category_id: string;
  amount: string;
  transaction_date: string;
  description?: string;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  account_id?: string;
  category_id?: string;
  type?: TransactionType;
  page?: number;
  page_size?: number;
}
