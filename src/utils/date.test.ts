import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  parseDateOnly,
  toDateInputValue,
  todayInBogota,
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

  it("calcula el día en America/Bogota, no en UTC", () => {
    expect(todayInBogota(new Date("2026-10-20T02:30:00.000Z"))).toBe(
      "2026-10-19",
    );
    expect(todayInBogota(new Date("2026-10-20T05:30:00.000Z"))).toBe(
      "2026-10-20",
    );
  });

  it("respeta el borde de mes en America/Bogota", () => {
    expect(todayInBogota(new Date("2026-11-01T03:00:00.000Z"))).toBe(
      "2026-10-31",
    );
    expect(todayInBogota(new Date("2026-11-01T06:00:00.000Z"))).toBe(
      "2026-11-01",
    );
  });
});
