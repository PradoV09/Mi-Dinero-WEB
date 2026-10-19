import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Input, Select } from "../ui";
import { ApiError, getFieldError } from "../../services/http";
import { listCategories } from "../../services/categories";
import type { Account } from "../../types/accounts";
import type {
  Category,
  Transaction,
  TransactionInput,
  TransactionType,
} from "../../types/transactions";
import { todayInBogota } from "../../utils/date";
import { createIdempotencyKey } from "../../utils/idempotency";
import {
  validateTransactionForm,
  type TransactionFormErrors,
  type TransactionFormValues,
} from "../../utils/transactionValidation";

export interface TransactionFormProps {
  mode: "create" | "edit";
  accounts: Account[];
  initial?: Transaction;
  onCancel: () => void;
  onSubmit: (input: TransactionInput, idempotencyKey: string) => Promise<void>;
}

function initialValues(initial?: Transaction): TransactionFormValues {
  return {
    type: initial?.type ?? "expense",
    account_id: initial?.account_id ?? "",
    category_id: initial?.category_id ?? "",
    amount: initial?.amount ?? "",
    transaction_date: initial?.transaction_date ?? todayInBogota(),
    description: initial?.description ?? "",
  };
}

function fieldErrorsFromApi(error: unknown): TransactionFormErrors {
  if (!(error instanceof ApiError)) {
    return {};
  }

  return {
    type: getFieldError(error, "type"),
    account_id: getFieldError(error, "account_id"),
    category_id: getFieldError(error, "category_id"),
    amount: getFieldError(error, "amount"),
    transaction_date: getFieldError(error, "transaction_date"),
    description: getFieldError(error, "description"),
  };
}

export function TransactionForm({
  mode,
  accounts,
  initial,
  onCancel,
  onSubmit,
}: TransactionFormProps) {
  const [values, setValues] = useState<TransactionFormValues>(() => initialValues(initial));
  const [errors, setErrors] = useState<TransactionFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    setCategories([]);
    setCategoriesLoading(true);
    setCategoriesError(null);

    listCategories(values.type, controller.signal)
      .then((response) => {
        setCategories(response.items);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setCategoriesError(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las categorías.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setCategoriesLoading(false);
        }
      });

    return () => controller.abort();
  }, [values.type]);

  const selectedAccount = accounts.find(
    (account) => account.id === values.account_id,
  );

  const accountOptions = accounts
    .filter(
      (account) =>
        !account.archived || account.id === values.account_id,
    )
    .map((account) => ({
      value: account.id,
      label: account.archived
        ? `${account.name} (archivada)`
        : account.name,
    }));

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  if (
    initial &&
    initial.type === values.type &&
    !categories.some((category) => category.id === initial.category_id)
  ) {
    categoryOptions.unshift({
      value: initial.category_id,
      label: initial.category_name ?? "Categoría actual",
    });
  }

  function updateField<K extends keyof TransactionFormValues>(
    field: K,
    value: TransactionFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleTypeChange(type: TransactionType) {
    setValues((current) => ({
      ...current,
      type,
      category_id: "",
    }));
    setErrors((current) => ({ ...current, type: undefined, category_id: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (inFlight.current) {
      return;
    }

    const nextErrors = validateTransactionForm(values);
    setErrors(nextErrors);
    setGeneralError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    inFlight.current = true;
    setSubmitting(true);

    const idempotencyKey = createIdempotencyKey();
    const input: TransactionInput = {
      type: values.type,
      account_id: values.account_id,
      category_id: values.category_id,
      amount: values.amount.trim(),
      transaction_date: values.transaction_date,
      description: values.description.trim() || undefined,
    };

    try {
      await onSubmit(input, idempotencyKey);
    } catch (error: unknown) {
      const nextFieldErrors = fieldErrorsFromApi(error);
      setErrors((current) => ({ ...current, ...nextFieldErrors }));

      if (!Object.values(nextFieldErrors).some(Boolean)) {
        setGeneralError(
          error instanceof Error
            ? error.message
            : "No pudimos guardar el movimiento.",
        );
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit} noValidate>
      {generalError && (
        <div className="form-alert" role="alert">
          {generalError}
        </div>
      )}

      <Select
        label="Tipo"
        required
        value={values.type}
        error={errors.type}
        options={[
          { value: "expense", label: "Gasto" },
          { value: "income", label: "Ingreso" },
        ]}
        onChange={(event) =>
          handleTypeChange(event.target.value as TransactionType)
        }
      />

      <Select
        label="Cuenta"
        required
        placeholder="Selecciona una cuenta"
        value={values.account_id}
        error={errors.account_id}
        options={accountOptions}
        hint="Solo se ofrecen cuentas activas."
        onChange={(event) => updateField("account_id", event.target.value)}
      />

      <p className="form-note" aria-live="polite">
        Moneda:{" "}
        {selectedAccount
          ? selectedAccount.currency
          : "se hereda de la cuenta seleccionada"}
      </p>

      <Select
        label="Categoría"
        required
        placeholder={
          categoriesLoading ? "Cargando categorías…" : "Selecciona una categoría"
        }
        value={values.category_id}
        error={errors.category_id ?? categoriesError ?? undefined}
        options={categoryOptions}
        disabled={categoriesLoading}
        onChange={(event) => updateField("category_id", event.target.value)}
      />

      <Input
        label="Importe"
        required
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={values.amount}
        error={errors.amount}
        hint="Usa punto decimal. La moneda se hereda de la cuenta."
        onChange={(event) => updateField("amount", event.target.value)}
      />

      <Input
        label="Fecha"
        type="date"
        required
        value={values.transaction_date}
        error={errors.transaction_date}
        onChange={(event) =>
          updateField("transaction_date", event.target.value)
        }
      />

      <Input
        label="Descripción (opcional)"
        maxLength={500}
        value={values.description}
        error={errors.description}
        onChange={(event) => updateField("description", event.target.value)}
      />

      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === "create" ? "Guardar movimiento" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
