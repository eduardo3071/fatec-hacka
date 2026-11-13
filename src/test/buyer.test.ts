import { describe, expect, it } from "vitest";
import { cartCount, cartTotal, maskPhone, isValidPhone, TIME_SLOTS, findProducer, itemsLabel } from "@/lib/buyer";

describe("buyer flow rules", () => {
  it("time chips run from 06:00 to 12:00 every 30 min", () => {
    expect(TIME_SLOTS[0]).toBe("06:00");
    expect(TIME_SLOTS[1]).toBe("06:30");
    expect(TIME_SLOTS.at(-1)).toBe("12:00");
    expect(TIME_SLOTS).toHaveLength(13);
  });
  it("cart: 20 alface + 10 couve + 1 brócolis = 3 itens, R$ 106,00", () => {
    const cart = { p1: 20, p2: 10, p3: 1 };
    expect(cartCount(cart)).toBe(3);
    expect(itemsLabel(cartCount(cart))).toBe("3 itens");
    expect(cartTotal(cart)).toBe(106);
  });
  it("brazilian phone mask", () => {
    expect(maskPhone("11988881010")).toBe("(11) 98888-1010");
    expect(maskPhone("1133334444")).toBe("(11) 3333-4444");
    expect(isValidPhone("(11) 9888")).toBe(false);
    expect(isValidPhone("(11) 98888-1010")).toBe(true);
  });
  it("producer link /p/marcos-biritiba resolves to Marcos", () => {
    expect(findProducer("marcos-biritiba")?.name).toBe("Marcos");
    expect(findProducer("outro")).toBeUndefined();
  });
});
