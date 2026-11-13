import { describe, expect, it } from "vitest";
import { earningsFor, harvestFor, pendingOn, routeFor, slugStatus, parseMoney, SEED_PRODUCTS, MONTHLY_FEE, type PanelOrder } from "@/lib/producer";

const P = SEED_PRODUCTS; // alface 3,50 (atravessador 1,50) · cenoura 4,00 (sem preço do atravessador)
const ord = (id: string, status: PanelOrder["status"], items: [string, number][], date = "2026-11-14", time = "07:00", buyerName = "Restaurante A"): PanelOrder => ({
  id, buyerName, buyerPhone: "", status, paid: false, date, time, items: items.map(([productId, quantity]) => ({ productId, quantity })),
});

describe("producer panel rules", () => {
  it("harvest sums accepted orders per product, ignoring pending and refused", () => {
    const rows = harvestFor("2026-11-14", [
      ord("a", "aceito", [["p1", 20]]),
      ord("b", "aceito", [["p1", 15]], undefined, "08:00", "Padaria Sol"),
      ord("c", "pendente", [["p1", 99]]),
      ord("d", "recusado", [["p1", 99]]),
    ], P);
    expect(rows[0]?.total).toBe(35);
    expect(rows[0]?.buyers).toHaveLength(2);
  });
  it("counts pending orders of the day for the amber warning", () => {
    expect(pendingOn("2026-11-14", [ord("a", "pendente", [["p1", 1]]), ord("b", "pendente", [["p1", 1]]), ord("c", "aceito", [["p1", 1]])])).toBe(2);
  });
  it("route is ordered by delivery time", () => {
    const r = routeFor("2026-11-14", [ord("late", "aceito", [["p1", 1]], undefined, "09:00"), ord("early", "aceito", [["p1", 1]], undefined, "06:30")]);
    expect(r.map((x) => x.id)).toEqual(["early", "late"]);
  });
  it("extra gain only counts products with middleman price; coverage reflects that", () => {
    // 20 alface: 70,00 sold, gain (3,50-1,50)*20 = 40,00 · 7,5 kg cenoura: 30,00 sold, no reference
    const e = earningsFor("2026-11", [ord("a", "entregue", [["p1", 20], ["p4", 7.5]])], P);
    expect(e.revenue).toBe(100);
    expect(e.extraGain).toBe(40);
    expect(e.coverage).toBeCloseTo(0.7);
    expect(e.delivered).toBe(1);
  });
  it("monthly fee of R$ 50 'paid itself' floor(gain/50) times", () => {
    expect(MONTHLY_FEE).toBe(50);
    const e = earningsFor("2026-11", [ord("a", "entregue", [["p1", 170]])], P); // gain 340
    expect(e.extraGain).toBe(340);
    expect(e.feeTimes).toBe(6);
  });
  it("link address availability", () => {
    expect(slugStatus("marcos-biritiba")).toBe("free");
    expect(slugStatus("joao-mogi")).toBe("taken");
    expect(slugStatus("ab")).toBe("invalid");
  });
  it("parses Brazilian money input", () => {
    expect(parseMoney("3,50")).toBe(3.5);
    expect(parseMoney("R$ 1.234,56")).toBe(1234.56);
    expect(parseMoney("")).toBeNull();
  });
});
