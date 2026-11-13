/**
 * Maps API data into the panel's shapes, so the screens stay the same with or without the API.
 */
import type { ApiOrder, ApiProduct, ApiProducer } from "@/lib/api";
import { glyphFor, hhmm, unitFromApi } from "@/lib/api";
import type { PanelOrder, PanelProduct, PanelStatus, Profile } from "@/lib/producer";

export function mapProduct(p: ApiProduct): PanelProduct {
  return {
    id: p.id,
    name: p.name,
    unit: unitFromApi(p.unit),
    price: p.price,
    intermediaryPrice: p.intermediary_price,
    active: p.active,
    glyph: glyphFor(p.name),
  };
}

export function mapProfile(p: ApiProducer): Profile {
  return { name: p.name, city: p.municipality ?? "", slug: p.slug, pixKey: p.pix_key ?? "" };
}

export function panelStatus(status: string): PanelStatus {
  const s = status.toLowerCase();
  if (/recus|reject|cancel/.test(s)) return "recusado";
  if (/entreg|deliver/.test(s)) return "entregue";
  if (/aceit|accept/.test(s)) return "aceito";
  return "pendente";
}

export function isPaid(paymentStatus: string): boolean {
  return /pag|paid/.test(paymentStatus.toLowerCase()) && !/nao|não|pend|unpaid/.test(paymentStatus.toLowerCase());
}

/** API order items carry names only; link them to products by name (+unit). */
export function mapOrder(o: ApiOrder, products: PanelProduct[]): PanelOrder {
  const norm = (x: string) => x.trim().toLowerCase();
  return {
    id: o.id,
    buyerName: o.buyer_name,
    buyerPhone: o.buyer_phone,
    items: o.items.map((it) => {
      const unit = unitFromApi(it.unit);
      const p =
        products.find((x) => norm(x.name) === norm(it.product_name) && x.unit === unit) ??
        products.find((x) => norm(x.name) === norm(it.product_name));
      return { productId: p?.id ?? `nome:${it.product_name}`, quantity: it.quantity };
    }),
    date: o.delivery_date,
    time: hhmm(o.delivery_time),
    status: panelStatus(o.status),
    paid: isPaid(o.payment_status),
    total: o.total,
    ...(o.notes ? { notes: o.notes } : {}),
  };
}
