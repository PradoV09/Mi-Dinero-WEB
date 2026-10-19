import type { Currency } from "../utils/money";

export type AccountType = "cash" | "bank" | "savings" | "credit" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}
