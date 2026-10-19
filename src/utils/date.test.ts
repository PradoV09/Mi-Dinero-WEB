import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  parseDateOnly,
  toDateInputValue,
} from "./date";

describe("fechas", () => {
  it("interpreta una fecha ISO sin desplazarla por zona horaria", () => {
    const date = parseDateOnly("2026-10-19");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(19);
    expect(formatDate("2026-10-19")).toBe(formatDate(date!));
  });

  it("rechaza fechas imposibles", () => {
    expect(parseDateOnly("2026-02-30")).toBeNull();
    expect(parseDateOnly("19/10/2026")).toBeNull();
    expect(formatDate("2026-02-30")).toBe("—");
    expect(formatDateTime("no-es-fecha")).toBe("—");
  });

  it("genera el valor de un input date", () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
