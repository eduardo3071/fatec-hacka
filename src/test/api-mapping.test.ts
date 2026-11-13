import { describe, expect, it } from "vitest";
import { panelStatus, isPaid, mapOrder } from "@/lib/panel-sync";
import { trackStatus } from "@/lib/buyer";
import { unitFromApi, unitToApi, hhmm } from "@/lib/api/map";
import type { PanelProduct } from "@/lib/producer";

describe("API → telas", () => {
  it("status do produtor vindos do banco", () => {
    expect(panelStatus("pendente")).toBe("pendente");
    expect(panelStatus("aceito")).toBe("aceito");
    expect(panelStatus("entregue")).toBe("entregue");
    expect(panelStatus("recusado")).toBe("recusado");
    expect(panelStatus("cancelado")).toBe("recusado");
  });
  it("pagamento: só 'pago' conta como pago", () => {
    expect(isPaid("pago")).toBe(true);
    expect(isPaid("a_receber")).toBe(false);
  });
  it("status do comprador junta entrega e pagamento", () => {
    expect(trackStatus("entregue", "pago")).toBe("paid");
    expect(trackStatus("entregue", "a_receber")).toBe("delivered");
    expect(trackStatus("pendente", "a_receber")).toBe("pending");
  });
  it("unidades com acento ida e volta", () => {
    expect(unitToApi("maço")).toBe("maco");
    expect(unitFromApi("duzia")).toBe("dúzia");
    expect(hhmm("07:30:00")).toBe("07:30");
  });
  it("itens do pedido ligam ao produto pelo nome e usam o total cobrado", () => {
    const products: PanelProduct[] = [{ id: "x1", name: "Alface crespa", unit: "maço", price: 3.5, intermediaryPrice: null, active: true, glyph: "🥬" }];
    const o = mapOrder(
      { id: "o1", status: "aceito", payment_status: "a_receber", delivery_date: "2026-11-14", delivery_time: "07:00:00", total: 70, notes: null, source: "toque", buyer_name: "Restaurante A", buyer_phone: "11", items: [{ product_name: "Alface crespa", unit: "maco", quantity: 20, unit_price: 3.5, subtotal: 70 }], created_at: "" },
      products,
    );
    expect(o.items[0]?.productId).toBe("x1");
    expect(o.time).toBe("07:00");
    expect(o.total).toBe(70);
  });
});
