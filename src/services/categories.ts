import type { Paginated } from "../types/api";
import type { Category, TransactionType } from "../types/transactions";
import { request } from "./http";

const CATEGORIES_PATH = "/api/v1/categories";

export function listCategories(
  type?: TransactionType,
  signal?: AbortSignal,
): Promise<Paginated<Category>> {
  const params = new URLSearchParams({ page_size: "100" });

  if (type) {
    params.set("type", type);
  }

  return request<Paginated<Category>>(`${CATEGORIES_PATH}?${params}`, {
    method: "GET",
    signal,
  });
}
