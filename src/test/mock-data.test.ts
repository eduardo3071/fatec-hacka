import { describe, expect, it } from "vitest";

import { ALFACE, COUVE, PRODUCTS, PRODUCER, orderItemCount, orderTotal } from "@/lib/mock";

describe("sample catalog", () => {
  it("has the five products with the stated prices", () => {
    expect(PRODUCTS.map((p) => [p.name, p.unit, p.price])).toEqual([
      ["Alface crespa", "maço", 3.5],
      ["Couve", "maço", 3.0],
      ["Brócolis", "maço", 6.0],
      ["Cenoura", "kg", 4.0],
      ["Rúcula", "maço", 3.5],
    ]);
  });

  it("is Marcos from Biritiba-Mirim", () => {
    expect(PRODUCER.name).toBe("Marcos");
    expect(PRODUCER.city).toBe("Biritiba-Mirim");
  });

  it("totals a order from its items", () => {
    const order = {
      id: "x",
      buyer: { id: "b", name: "Restaurante A", phone: "" },
      deliveryDate: "2026-11-14",
      deliveryTime: "07:00",
      status: "pending" as const,
      items: [
        { product: ALFACE, quantity: 20 },
        { product: COUVE, quantity: 10 },
      ],
    };
    // 20 × 3,50 + 10 × 3,00
    expect(orderTotal(order)).toBeCloseTo(100, 2);
    expect(orderItemCount(order)).toBe(30);
  });
});
