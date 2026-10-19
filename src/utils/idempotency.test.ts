import { describe, expect, it } from "vitest";
import { createIdempotencyKey } from "./idempotency";

describe("createIdempotencyKey", () => {
  it("genera claves únicas y no vacías por intento", () => {
    const keys = new Set(
      Array.from({ length: 200 }, () => createIdempotencyKey()),
    );

    expect(keys.size).toBe(200);
    for (const key of keys) {
      expect(key.length).toBeGreaterThan(8);
    }
  });
});
