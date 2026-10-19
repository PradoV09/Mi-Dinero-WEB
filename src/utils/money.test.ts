import { describe, expect, it } from "vitest";
import {
  formatMoney,
  getCurrency,
  isCurrency,
  isValidAmount,
} from "./money";

function normalizeSpaces(value: string): string {
  return value.replace(/\u00a0/g, " ");
}

describe("formatMoney", () => {
  it("formatea COP sin decimales y con separador de miles", () => {
    expect(normalizeSpaces(formatMoney("1234.5", "COP"))).toBe("$ 1.235");
  });

  it("formatea USD con dos decimales", () => {
    expect(normalizeSpaces(formatMoney("1234.5", "USD"))).toBe(
      "US$ 1.234,50",
    );
  });

  it("formatea EUR con dos decimales", () => {
    expect(normalizeSpaces(formatMoney("1234.5", "EUR"))).toBe(
      "EUR 1.234,50",
    );
  });

  it("conserva el signo negativo", () => {
    expect(normalizeSpaces(formatMoney("-1234.5", "USD"))).toBe(
      "-US$ 1.234,50",
    );
  });

  it("devuelve un guion para importes inválidos", () => {
    expect(formatMoney("1.234,56", "COP")).toBe("—");
    expect(formatMoney("abc", "USD")).toBe("—");
    expect(formatMoney("", "EUR")).toBe("—");
  });

  it("no altera el valor recibido de la API", () => {
    const amount = "9876543210.10";
    expect(normalizeSpaces(formatMoney(amount, "USD"))).toBe(
      "US$ 9.876.543.210,10",
    );
  });
});

describe("utilidades de moneda", () => {
  it("valida el formato decimal de la API", () => {
    expect(isValidAmount("0")).toBe(true);
    expect(isValidAmount("10.50")).toBe(true);
    expect(isValidAmount("-10.50")).toBe(true);
    expect(isValidAmount("10,50")).toBe(false);
    expect(isValidAmount("10.")).toBe(false);
  });

  it("reconoce las monedas soportadas", () => {
    expect(isCurrency("COP")).toBe(true);
    expect(isCurrency("USD")).toBe(true);
    expect(isCurrency("EUR")).toBe(true);
    expect(isCurrency("GBP")).toBe(false);
  });

  it("expone los decimales de cada moneda", () => {
    expect(getCurrency("COP").decimals).toBe(0);
    expect(getCurrency("USD").decimals).toBe(2);
    expect(getCurrency("EUR").decimals).toBe(2);
  });
});
