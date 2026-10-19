import { useEffect, useState, type FormEvent } from "react";
import { Button, Input, Select } from "../ui";
import type { Account } from "../../types/accounts";
import type {
  Category,
  TransactionFilters as Filters,
  TransactionType,
} from "../../types/transactions";

export type FilterValues = Omit<Filters, "page" | "page_size">;

export interface TransactionFiltersProps {
  accounts: Account[];
  categories: Category[];
  values: FilterValues;
  disabled?: boolean;
  onChange: (values: FilterValues) => void;
  onClear: () => void;
}

export function TransactionFilters({
  accounts,
  categories,
  values,
  disabled = false,
  onChange,
  onClear,
}: TransactionFiltersProps) {
  const [draft, setDraft] = useState<FilterValues>(values);

  useEffect(() => {
    setDraft(values);
  }, [values]);

  const categoryOptions = categories
    .filter((category) => !draft.type || category.type === draft.type)
    .map((category) => ({ value: category.id, label: category.name }));

  function update<K extends keyof FilterValues>(
    field: K,
    value: FilterValues[K],
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "type" ? { category_id: undefined } : {}),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange(draft);
  }

  function handleClear() {
    setDraft({});
    onClear();
  }

  return (
    <form className="filters" onSubmit={handleSubmit} aria-label="Filtros de movimientos">
      <div className="filters__grid">
        <Input
          label="Desde"
          type="date"
          value={draft.from ?? ""}
          onChange={(event) => update("from", event.target.value || undefined)}
        />
        <Input
          label="Hasta"
          type="date"
          value={draft.to ?? ""}
          onChange={(event) => update("to", event.target.value || undefined)}
        />
        <Select
          label="Cuenta"
          placeholder="Todas las cuentas"
          value={draft.account_id ?? ""}
          options={accounts.map((account) => ({
            value: account.id,
            label: account.archived
              ? `${account.name} (archivada)`
              : account.name,
          }))}
          onChange={(event) =>
            update("account_id", event.target.value || undefined)
          }
        />
        <Select
          label="Tipo"
          placeholder="Todos los tipos"
          value={draft.type ?? ""}
          options={[
            { value: "income", label: "Ingresos" },
            { value: "expense", label: "Gastos" },
          ]}
          onChange={(event) =>
            update("type", (event.target.value as TransactionType) || undefined)
          }
        />
        <Select
          label="Categoría"
          placeholder="Todas las categorías"
          value={draft.category_id ?? ""}
          options={categoryOptions}
          onChange={(event) =>
            update("category_id", event.target.value || undefined)
          }
        />
      </div>
      <div className="filters__actions">
        <Button variant="ghost" onClick={handleClear} disabled={disabled}>
          Limpiar filtros
        </Button>
        <Button type="submit" variant="secondary" disabled={disabled}>
          Filtrar
        </Button>
      </div>
    </form>
  );
}
