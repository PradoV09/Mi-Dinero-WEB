import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { listAccounts } from "./accounts";
import { listCategories } from "./categories";
import { API_URL } from "./http";
import {
  createTransaction,
  deleteTransaction,
  IDEMPOTENCY_HEADER,
  listTransactions,
  updateTransaction,
} from "./transactions";

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

const transaction = {
  id: "tx-1",
  type: "expense" as const,
  account_id: "acc-1",
  category_id: "cat-1",
  amount: "12500.50",
  currency: "COP" as const,
  transaction_date: "2026-10-19",
  description: "Mercado",
  created_at: "2026-10-19T12:00:00Z",
  updated_at: "2026-10-19T12:00:00Z",
};

describe("servicio de movimientos", () => {
  it("envía los filtros y la paginación al listado", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/transactions`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("from")).toBe("2026-10-01");
        expect(url.searchParams.get("to")).toBe("2026-10-31");
        expect(url.searchParams.get("account_id")).toBe("acc-1");
        expect(url.searchParams.get("category_id")).toBe("cat-1");
        expect(url.searchParams.get("type")).toBe("expense");
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.get("page_size")).toBe("20");

        return HttpResponse.json({
          items: [transaction],
          page: 2,
          page_size: 20,
          total: 21,
        });
      }),
    );

    const result = await listTransactions({
      from: "2026-10-01",
      to: "2026-10-31",
      account_id: "acc-1",
      category_id: "cat-1",
      type: "expense",
      page: 2,
      page_size: 20,
    });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(21);
  });

  it("crea con Idempotency-Key y cuerpo JSON", async () => {
    server.use(
      http.post(
        `${API_URL}/api/v1/transactions`,
        async ({ request }) => {
          expect(request.headers.get(IDEMPOTENCY_HEADER)).toBe("key-123");
          expect(request.headers.get("content-type")).toBe("application/json");
          const body = (await request.json()) as Record<string, unknown>;
          expect(body).toMatchObject({
            type: "expense",
            account_id: "acc-1",
            category_id: "cat-1",
            amount: "12500.50",
            transaction_date: "2026-10-19",
          });

          return HttpResponse.json(transaction, { status: 201 });
        },
      ),
    );

    await expect(
      createTransaction(
        {
          type: "expense",
          account_id: "acc-1",
          category_id: "cat-1",
          amount: "12500.50",
          transaction_date: "2026-10-19",
          description: "Mercado",
        },
        "key-123",
      ),
    ).resolves.toMatchObject({ id: "tx-1" });
  });

  it("edita con PATCH e Idempotency-Key", async () => {
    server.use(
      http.patch(
        `${API_URL}/api/v1/transactions/tx-1`,
        async ({ request }) => {
          expect(request.headers.get(IDEMPOTENCY_HEADER)).toBe("key-edit");
          const body = (await request.json()) as Record<string, unknown>;
          expect(body.amount).toBe("13000");
          return HttpResponse.json({ ...transaction, amount: "13000" });
        },
      ),
    );

    await expect(
      updateTransaction(
        "tx-1",
        {
          type: "expense",
          account_id: "acc-1",
          category_id: "cat-1",
          amount: "13000",
          transaction_date: "2026-10-19",
        },
        "key-edit",
      ),
    ).resolves.toMatchObject({ amount: "13000" });
  });

  it("elimina el movimiento por id", async () => {
    server.use(
      http.delete(
        `${API_URL}/api/v1/transactions/tx-1`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(deleteTransaction("tx-1")).resolves.toBeUndefined();
  });
});

describe("servicios de cuentas y categorías", () => {
  it("lista cuentas activas y archivadas para filtrar en cliente", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/accounts`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("page_size")).toBe("100");
        return HttpResponse.json({
          items: [],
          page: 1,
          page_size: 100,
          total: 0,
        });
      }),
    );

    await expect(listAccounts()).resolves.toMatchObject({ total: 0 });
  });

  it("filtra categorías por tipo cuando se indica", async () => {
    server.use(
      http.get(`${API_URL}/api/v1/categories`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("type")).toBe("income");
        return HttpResponse.json({
          items: [{ id: "cat-income", name: "Salario", type: "income" }],
          page: 1,
          page_size: 100,
          total: 1,
        });
      }),
    );

    const result = await listCategories("income");
    expect(result.items[0]).toMatchObject({ type: "income" });
  });
});
