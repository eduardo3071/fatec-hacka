import { describe, expect, it } from "vitest";

import { formatDate, formatMoney, formatQty, formatTime } from "@/lib/format";

// pt-BR uses a no-break space after "R$", so compare with a plain space.
const plain = (s: string) => s.replace(/\u00a0/g, " ");

function shift(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function short(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

describe("pt-BR formatting", () => {
  it("writes money as R$ 1.234,56", () => {
    expect(plain(formatMoney(1234.5))).toBe("R$ 1.234,56");
    expect(plain(formatMoney(3.5))).toBe("R$ 3,50");
    expect(plain(formatMoney(0))).toBe("R$ 0,00");
  });

  it("pluralizes the unit except kg", () => {
    expect(formatQty(1, "maço")).toBe("1 maço");
    expect(formatQty(35, "maço")).toBe("35 maços");
    expect(formatQty(3, "kg")).toBe("3 kg");
  });

  it("says hoje and amanhã before the date", () => {
    const today = shift(0);
    const tomorrow = shift(1);
    expect(formatDate(today)).toBe(`hoje, ${short(today)}`);
    expect(formatDate(tomorrow)).toBe(`amanhã, ${short(tomorrow)}`);
    expect(formatDate(shift(6))).toMatch(/^\w{3}, \d{2}\/\d{2}$/);
  });

  it("keeps times as 07:00", () => {
    expect(formatTime("07:00")).toBe("07:00");
    expect(formatTime("06:30:00")).toBe("06:30");
  });
});
