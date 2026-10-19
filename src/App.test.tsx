import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { MemoryRouter } from "react-router-dom";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import App from "./App";
import { ToastProvider } from "./components/ui";
import { API_URL } from "./services/http";

const server = setupServer(
  http.get(`${API_URL}/api/v1/accounts`, () =>
    HttpResponse.json({ items: [], page: 1, page_size: 100, total: 0 }),
  ),
  http.get(`${API_URL}/api/v1/categories`, () =>
    HttpResponse.json({ items: [], page: 1, page_size: 100, total: 0 }),
  ),
  http.get(`${API_URL}/api/v1/transactions`, () =>
    HttpResponse.json({ items: [], page: 1, page_size: 20, total: 0 }),
  ),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("ruta de movimientos", () => {
  it("muestra la vista previa sin sesión y con aviso", async () => {
    render(
      <MemoryRouter initialEntries={["/app/movimientos"]}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Ingresos y gastos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(
      "Vista previa temporal sin autenticación",
    );
  });
});
