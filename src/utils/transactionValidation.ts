import { isValidAmount } from "./money";
import { parseDateOnly } from "./date";
import type { TransactionType } from "../types/transactions";

export interface TransactionFormValues {
  type: TransactionType;
  account_id: string;
  category_id: string;
  amount: string;
  transaction_date: string;
  description: string;
}

export type TransactionFormErrors = Partial<
  Record<keyof TransactionFormValues, string>
>;

function isZeroAmount(value: string): boolean {
  return /^-?0+(\.0+)?$/.test(value.trim());
}

export function validateTransactionForm(
  values: TransactionFormValues,
): TransactionFormErrors {
  const errors: TransactionFormErrors = {};

  if (!values.type) {
    errors.type = "Selecciona el tipo de movimiento.";
  }

  if (!values.account_id) {
    errors.account_id = "Selecciona una cuenta.";
  }

  if (!values.category_id) {
    errors.category_id = "Selecciona una categoría.";
  }

  if (!values.amount.trim()) {
    errors.amount = "Escribe el importe.";
  } else if (!isValidAmount(values.amount)) {
    errors.amount = "Usa un importe válido, por ejemplo 12500.50.";
  } else if (isZeroAmount(values.amount)) {
    errors.amount = "El importe debe ser mayor que cero.";
  } else if (values.amount.trim().startsWith("-")) {
    errors.amount = "El importe debe ser mayor que cero.";
  }

  if (!values.transaction_date) {
    errors.transaction_date = "Selecciona la fecha.";
  } else if (!parseDateOnly(values.transaction_date)) {
    errors.transaction_date = "La fecha no es válida.";
  }

  if (values.description.length > 500) {
    errors.description = "La descripción no puede superar 500 caracteres.";
  }

  return errors;
}
