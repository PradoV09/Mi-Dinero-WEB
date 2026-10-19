import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ToastProvider } from "../../components/ui";
import { API_URL } from "../../services/http";
import type { Account } from "../../types/accounts";
import type { Category, Transaction } from "../../types/transactions";
import TransactionsPage from "./TransactionsPage";

const COP_ACCOUNT: Account = {
  id: "acc-cop",
  name: "Nu Ahorros",
  type: "savings",
  currency: "COP",
  balance: "100000",
  archived: false,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

const USD_ACCOUNT: Account = {
  id: "acc-usd",
  name: "Cuenta USD",
  type: "bank",
  currency: "USD",
  balance: "20.50",
  archived: false,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
};

const CATEGORIES: Category[] = [
  { id: "cat-food", name: "Mercado", type: "expense" },
  { id: "cat-salary", name: "Salario", type: "income" },
];

function makeTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "tx-1",
    type: "expense",
    account_id: COP_ACCOUNT.id,
    category_id: "cat-food",
    category_name: "Mercado",
    amount: "12500.50",
    currency: "COP",
    transaction_date: "2026-10-19",
    description: "Mercado semanal",
    created_at: "2026-10-19T12:00:00Z",
    updated_at: "2026-10-19T12:00:00Z",
    ...overrides,
  };
}

function paginated<T>(items: T[], page = 1, total = items.length) {
  return {
    items,
    page,
    page_size: 20,
    total,
  };
}

const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

function renderPage(initialEntry = "/app/movimientos") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ToastProvider>
        <Routes>
          <Route path="/app/movimientos" element={<TransactionsPage />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

function baseHandlers(
  transactions: Transaction[],
  accounts: Account[] = [COP_ACCOUNT, USD_ACCOUNT],
) {
  return [
    http.get(`${API_URL}/api/v1/accounts`, () =>
      HttpResponse.json(paginated(accounts)),
    ),
    http.get(`${API_URL}/api/v1/categories`, ({ request }) => {
      const type = new URL(request.url).searchParams.get("type");
      const items = type
        ? CATEGORIES.filter((category) => category.type === type)
        : CATEGORIES;
      return HttpResponse.json(paginated(items));
    }),
    http.get(`${API_URL}/api/v1/transactions`, () =>
      HttpResponse.json(paginated(transactions)),
    ),
  ];
}

describe("página de movimientos", () => {
  it("muestra saldos separados por moneda sin mezclarlos", async () => {
    server.use(...baseHandlers([makeTransaction()]));

    renderPage();

    expect(screen.getByText("Cargando movimientos…")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: /COP · Pesos colombianos/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /USD · Dólares estadounidenses/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$ 100\.000/)).toBeInTheDocument();
    expect(screen.getByText(/US\$ 20,50/)).toBeInTheDocument();
    expect(await screen.findByText("Mercado semanal")).toBeInTheDocument();
  });

  it("muestra el estado vacío con CTA para crear", async () => {
    server.use(...baseHandlers([]));

    renderPage();

    expect(
      await screen.findByText("Aún no hay movimientos"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear el primer movimiento" }),
    ).toBeInTheDocument();
  });

  it("muestra error y permite reintentar", async () => {
    let attempts = 0;

    server.use(
      http.get(`${API_URL}/api/v1/accounts`, () =>
        HttpResponse.json(paginated([COP_ACCOUNT])),
      ),
      http.get(`${API_URL}/api/v1/categories`, () =>
        HttpResponse.json(paginated(CATEGORIES)),
      ),
      http.get(`${API_URL}/api/v1/transactions`, () => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json(
            { error: { code: "server_error", message: "Falla temporal." } },
            { status: 500 },
          );
        }
        return HttpResponse.json(paginated([]));
      }),
    );

    renderPage();

    expect(
      await screen.findByText("No pudimos cargar los movimientos"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(
      await screen.findByText("Aún no hay movimientos"),
    ).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it("refleja filtros de la URL y los limpia", async () => {
    const seenTypes: Array<string | null> = [];

    server.use(
      http.get(`${API_URL}/api/v1/transactions`, ({ request }) => {
        const url = new URL(request.url);
        seenTypes.push(url.searchParams.get("type"));
        if (url.searchParams.get("type")) {
          expect(url.searchParams.get("account_id")).toBe("acc-cop");
          expect(url.searchParams.get("page")).toBe("2");
          return HttpResponse.json(paginated([makeTransaction()], 2, 21));
        }
        return HttpResponse.json(paginated([makeTransaction()]));
      }),
      ...baseHandlers([makeTransaction()]),
    );

    renderPage("/app/movimientos?type=expense&account_id=acc-cop&page=2");

    expect(
      await screen.findByText(/Página 2 de 2/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    await waitFor(() => expect(seenTypes).toContain(null));
  });

  it("crea un movimiento y no lo duplica con doble clic", async () => {
    const posts: Array<{ key: string | null; body: Record<string, unknown> }> = [];
    const stored: Transaction[] = [];

    server.use(
      ...baseHandlers(stored),
      http.post(`${API_URL}/api/v1/transactions`, async ({ request }) => {
        posts.push({
          key: request.headers.get("Idempotency-Key"),
          body: (await request.json()) as Record<string, unknown>,
        });
        const created = makeTransaction({
          id: "tx-new",
          type: "income",
          category_id: "cat-salary",
          category_name: "Salario",
          amount: "500000",
          description: "Pago",
        });
        stored.push(created);
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    renderPage();
    await screen.findByRole("heading", { name: /COP · Pesos colombianos/ });

    fireEvent.click(screen.getByRole("button", { name: "Nuevo movimiento" }));
    const dialog = screen.getByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText(/Tipo/), {
      target: { value: "income" },
    });
    await within(dialog).findByRole("option", { name: "Salario" });
    fireEvent.change(within(dialog).getByLabelText(/Cuenta/), {
      target: { value: COP_ACCOUNT.id },
    });
    fireEvent.change(within(dialog).getByLabelText(/Categoría/), {
      target: { value: "cat-salary" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Importe/), {
      target: { value: "500000" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Descripción/), {
      target: { value: "Pago" },
    });

    within(dialog).getByRole("button", { name: "Guardar movimiento" });
    const form = dialog.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].key).toBeTruthy();
    expect(posts[0].body).toMatchObject({
      type: "income",
      account_id: COP_ACCOUNT.id,
      category_id: "cat-salary",
      amount: "500000",
    });
    expect(posts[0].body).not.toHaveProperty("currency");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("muestra los errores por campo del backend (422)", async () => {
    server.use(
      ...baseHandlers([]),
      http.post(`${API_URL}/api/v1/transactions`, () =>
        HttpResponse.json(
          {
            error: {
              code: "validation_error",
              message: "Datos inválidos",
              details: { amount: ["El importe supera el máximo permitido."] },
            },
          },
          { status: 422 },
        ),
      ),
    );

    renderPage();
    await screen.findByRole("heading", { name: /COP · Pesos colombianos/ });

    fireEvent.click(screen.getByRole("button", { name: "Nuevo movimiento" }));
    const dialog = screen.getByRole("dialog");

    fireEvent.change(within(dialog).getByLabelText(/Cuenta/), {
      target: { value: COP_ACCOUNT.id },
    });
    await within(dialog).findByRole("option", { name: "Mercado" });
    fireEvent.change(within(dialog).getByLabelText(/Categoría/), {
      target: { value: "cat-food" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Importe/), {
      target: { value: "999999999" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Guardar movimiento" }),
    );

    expect(
      await within(dialog).findByText("El importe supera el máximo permitido."),
    ).toBeInTheDocument();
  });

  it("elimina con confirmación", async () => {
    let deleted = false;

    server.use(
      ...baseHandlers([makeTransaction()]),
      http.delete(`${API_URL}/api/v1/transactions/tx-1`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderPage();
    await screen.findByText("Mercado semanal");

    fireEvent.click(
      screen.getByRole("button", { name: /Eliminar movimiento/ }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/el saldo de la cuenta se actualizará/i),
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(deleted).toBe(true));
  });

  it("muestra descripciones con HTML como texto y no crea scripts", async () => {
    const description = '<script>alert("x")</script> & "comillas" ñ';
    server.use(
      ...baseHandlers([makeTransaction({ description })]),
    );

    renderPage();

    expect(await screen.findByText(description)).toBeInTheDocument();
    expect(document.querySelector("script")).toBeNull();
  });
});
