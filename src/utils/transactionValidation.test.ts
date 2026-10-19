import { describe, expect, it } from "vitest";
import {
  validateTransactionForm,
  type TransactionFormValues,
} from "./transactionValidation";

const valid: TransactionFormValues = {
  type: "expense",
  account_id: "acc-1",
  category_id: "cat-1",
  amount: "12500.50",
  transaction_date: "2026-10-19",
  description: "Mercado",
};

describe("validateTransactionForm", () => {
  it("acepta un formulario completo y válido", () => {
    expect(validateTransactionForm(valid)).toEqual({});
  });

  it("exige cuenta, categoría e importe", () => {
    const errors = validateTransactionForm({
      ...valid,
      account_id: "",
      category_id: "",
      amount: "",
    });

    expect(errors.account_id).toBeDefined();
    expect(errors.category_id).toBeDefined();
    expect(errors.amount).toBeDefined();
  });

  it("rechaza importe cero, negativo, con coma o sin decimales válidos", () => {
    expect(validateTransactionForm({ ...valid, amount: "0" }).amount).toBe(
      "El importe debe ser mayor que cero.",
    );
    expect(validateTransactionForm({ ...valid, amount: "-1" }).amount).toBe(
      "El importe debe ser mayor que cero.",
    );
    expect(validateTransactionForm({ ...valid, amount: "10,50" }).amount).toBe(
      "Usa un importe válido, por ejemplo 12500.50.",
    );
    expect(validateTransactionForm({ ...valid, amount: "10." }).amount).toBe(
      "Usa un importe válido, por ejemplo 12500.50.",
    );
  });

  it("rechaza fechas imposibles y descripciones demasiado largas", () => {
    const errors = validateTransactionForm({
      ...valid,
      transaction_date: "2026-02-30",
      description: "x".repeat(501),
    });

    expect(errors.transaction_date).toBe("La fecha no es válida.");
    expect(errors.description).toBe(
      "La descripción no puede superar 500 caracteres.",
    );
  });
});
