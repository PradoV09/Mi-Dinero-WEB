import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("se deshabilita y anuncia el estado de carga", () => {
    render(
      <Button loading loadingLabel="Guardando…">
        Guardar
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Guardando…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("ejecuta la acción al hacer clic", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    screen.getByRole("button", { name: "Guardar" }).click();

    expect(onClick).toHaveBeenCalledOnce();
  });
});
