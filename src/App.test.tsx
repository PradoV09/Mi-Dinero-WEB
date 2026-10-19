import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import App from "./App";
import { ToastProvider } from "./components/ui";
import { AuthProvider } from "./contexts/AuthContext";

describe("ruta de movimientos", () => {
  it("exige sesión y redirige a login", async () => {
    render(
      <MemoryRouter initialEntries={["/app/movimientos"]}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Ingresos y gastos" }),
    ).not.toBeInTheDocument();
  });
});
