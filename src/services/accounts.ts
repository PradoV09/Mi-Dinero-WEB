import type { Account } from "../types/accounts";
import type { Paginated } from "../types/api";
import { request } from "./http";

const ACCOUNTS_PATH = "/api/v1/accounts";

export function listAccounts(signal?: AbortSignal): Promise<Paginated<Account>> {
  return request<Paginated<Account>>(`${ACCOUNTS_PATH}?page_size=100`, {
    method: "GET",
    signal,
  });
}
