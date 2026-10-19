import type { Paginated } from "../types/api";
import type {
  Transaction,
  TransactionFilters,
  TransactionInput,
} from "../types/transactions";
import { request } from "./http";

const TRANSACTIONS_PATH = "/api/v1/transactions";

export const IDEMPOTENCY_HEADER = "Idempotency-Key";

function buildQuery(filters: TransactionFilters): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  return params.toString();
}

export function listTransactions(
  filters: TransactionFilters = {},
  signal?: AbortSignal,
): Promise<Paginated<Transaction>> {
  const query = buildQuery(filters);

  return request<Paginated<Transaction>>(
    `${TRANSACTIONS_PATH}${query ? `?${query}` : ""}`,
    { method: "GET", signal },
  );
}

export function createTransaction(
  input: TransactionInput,
  idempotencyKey: string,
): Promise<Transaction> {
  return request<Transaction>(TRANSACTIONS_PATH, {
    method: "POST",
    body: input,
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
  });
}

export function updateTransaction(
  id: string,
  input: TransactionInput,
  idempotencyKey: string,
): Promise<Transaction> {
  return request<Transaction>(
    `${TRANSACTIONS_PATH}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: input,
      headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
    },
  );
}

export function deleteTransaction(id: string): Promise<void> {
  return request<void>(`${TRANSACTIONS_PATH}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
