/**
 * Producer panel — sample data + pure calculations + device storage. No network.
 */
import { isoDay } from "@/lib/buyer";
import { PRODUCER, PRODUCTS, type Unit } from "@/lib/mock";

export const UNITS: Unit[] = ["maço", "kg", "unidade", "dúzia", "caixa", "engradado"];
export const MONTHLY_FEE = 50;

export interface PanelProduct {
  id: string;
  name: string;
  unit: Unit;
  price: number;
  /** What the middleman pays per unit; null = not informed. */
  intermediaryPrice: number | null;
  active: boolean;
  glyph: string;
}

export type PanelStatus = "pendente" | "aceito" | "entregue" | "recusado";

export interface PanelOrder {
  id: string;
  buyerName: string;
  buyerPhone: string;
  items: { productId: string; quantity: number }[];
  date: string; // yyyy-mm-dd
  time: string; // HH:MM
  status: PanelStatus;
  paid: boolean;
  notes?: string;
  isNew?: boolean;
}

export interface Profile {
  name: string;
  city: string;
  slug: string;
  pixKey: string;
}

export interface PanelState {
  profile: Profile | null;
  products: PanelProduct[];
  orders: PanelOrder[];
  harvested: Record<string, boolean>; // `${date}:${productId}`
  notifyAsked: boolean;
}

const MIDDLEMAN: Record<string, number | null> = { p1: 1.5, p2: 1.2, p3: 3.5, p4: null, p5: 1.6 };

export const SEED_PRODUCTS: PanelProduct[] = PRODUCTS.map((p) => ({
  id: p.id,
  name: p.name,
  unit: p.unit,
  price: p.price,
  intermediaryPrice: MIDDLEMAN[p.id] ?? null,
  active: true,
  glyph: p.glyph,
}));

const B = {
  ra: ["Restaurante A", "(11) 98888-1010"],
  mb: ["Mercadinho B", "(11) 97777-2020"],
  ps: ["Padaria Sol", "(11) 96666-3030"],
  lc: ["Lanchonete C", "(11) 95555-4040"],
} as const;

function o(
  id: string,
  buyer: readonly [string, string],
  day: number,
  time: string,
  status: PanelStatus,
  items: [string, number][],
  paid = false,
  extra: Partial<PanelOrder> = {},
): PanelOrder {
  return {
    id,
    buyerName: buyer[0],
    buyerPhone: buyer[1],
    items: items.map(([productId, quantity]) => ({ productId, quantity })),
    date: isoDay(day),
    time,
    status,
    paid,
    ...extra,
  };
}

export function seedOrders(): PanelOrder[] {
  const delivered: PanelOrder[] = [];
  const rotation: [readonly [string, string], [string, number][]][] = [
    [B.ra, [["p1", 20], ["p2", 10], ["p4", 6]]],
    [B.mb, [["p3", 8], ["p4", 10]]],
    [B.ps, [["p5", 12], ["p1", 10]]],
    [B.lc, [["p2", 15], ["p4", 8]]],
  ];
  for (let i = 1; i <= 40; i += 2) {
    const r = rotation[i % rotation.length];
    if (!r) continue;
    delivered.push(o(`d${i}`, r[0], -i, "07:00", "entregue", r[1], i % 3 !== 0));
  }
  return [
    o("n1", B.ra, 1, "07:00", "pendente", [["p1", 20], ["p2", 10]], false, { notes: "Entregar na porta dos fundos" }),
    o("n2", B.mb, 1, "08:30", "pendente", [["p3", 6], ["p4", 4]]),
    o("a1", B.ps, 1, "06:30", "aceito", [["p5", 12], ["p1", 15]]),
    o("a2", B.ra, 0, "07:00", "aceito", [["p1", 10], ["p3", 4]]),
    o("a3", B.lc, 0, "09:00", "aceito", [["p2", 8], ["p4", 5]], true),
    o("r1", B.lc, 2, "10:00", "recusado", [["p3", 30]]),
    ...delivered,
  ];
}

/** The order that "arrives" while the panel is open (demo). */
export function incomingOrder(): PanelOrder {
  return o(`n${Date.now()}`, B.lc, 1, "09:30", "pendente", [["p2", 12], ["p5", 6]], false, { isNew: true });
}

export function initialState(): PanelState {
  return { profile: null, products: SEED_PRODUCTS, orders: seedOrders(), harvested: {}, notifyAsked: false };
}

export const DEMO_PROFILE: Profile = {
  name: PRODUCER.name,
  city: PRODUCER.city,
  slug: PRODUCER.slug,
  pixKey: PRODUCER.pixKey,
};

// ---------- Calculations ----------
export function orderTotal(order: PanelOrder, products: PanelProduct[]): number {
  return order.items.reduce((s, it) => {
    const p = products.find((x) => x.id === it.productId);
    return s + (p ? p.price * it.quantity : 0);
  }, 0);
}

export interface HarvestRow {
  product: PanelProduct;
  total: number;
  buyers: { name: string; quantity: number }[];
}

/** What to harvest on a day: accepted (and already delivered) orders only. */
export function harvestFor(date: string, orders: PanelOrder[], products: PanelProduct[]): HarvestRow[] {
  const map = new Map<string, HarvestRow>();
  for (const ord of orders) {
    if (ord.date !== date || (ord.status !== "aceito" && ord.status !== "entregue")) continue;
    for (const it of ord.items) {
      const product = products.find((p) => p.id === it.productId);
      if (!product) continue;
      const row = map.get(product.id) ?? { product, total: 0, buyers: [] };
      row.total += it.quantity;
      row.buyers.push({ name: ord.buyerName, quantity: it.quantity });
      map.set(product.id, row);
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function pendingOn(date: string, orders: PanelOrder[]): number {
  return orders.filter((x) => x.date === date && x.status === "pendente").length;
}

export function routeFor(date: string, orders: PanelOrder[]): PanelOrder[] {
  return orders
    .filter((x) => x.date === date && (x.status === "aceito" || x.status === "entregue"))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export interface Earnings {
  revenue: number;
  delivered: number;
  extraGain: number;
  coverage: number; // 0..1
  feeTimes: number;
}

/** Month = "yyyy-mm". Extra gain only counts items whose middleman price is known. */
export function earningsFor(month: string, orders: PanelOrder[], products: PanelProduct[]): Earnings {
  let revenue = 0;
  let covered = 0;
  let extraGain = 0;
  let delivered = 0;
  for (const ord of orders) {
    if (ord.status !== "entregue" || !ord.date.startsWith(month)) continue;
    delivered += 1;
    for (const it of ord.items) {
      const p = products.find((x) => x.id === it.productId);
      if (!p) continue;
      const value = p.price * it.quantity;
      revenue += value;
      if (p.intermediaryPrice != null) {
        covered += value;
        extraGain += (p.price - p.intermediaryPrice) * it.quantity;
      }
    }
  }
  return {
    revenue,
    delivered,
    extraGain,
    coverage: revenue > 0 ? covered / revenue : 0,
    feeTimes: Math.floor(extraGain / MONTHLY_FEE),
  };
}

// ---------- Onboarding helpers ----------
const TAKEN_SLUGS = ["joao-mogi", "horta-do-sol", "sitio-boa-vista"];

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 41);
}

export function slugStatus(slug: string): "invalid" | "taken" | "free" {
  if (!/^[a-z0-9][a-z0-9-]{2,40}$/.test(slug)) return "invalid";
  return TAKEN_SLUGS.includes(slug) ? "taken" : "free";
}

export interface Proposal {
  name: string;
  unit: Unit;
  price: number | null;
  intermediaryPrice: number | null;
  glyph: string;
}

export const VOICE_PROPOSAL: Proposal[] = [
  { name: "Alface crespa", unit: "maço", price: 3.5, intermediaryPrice: null, glyph: "🥬" },
  { name: "Couve", unit: "maço", price: 3, intermediaryPrice: null, glyph: "🥗" },
  { name: "Cenoura", unit: "kg", price: null, intermediaryPrice: null, glyph: "🥕" },
];

export const PHOTO_PROPOSAL: Proposal[] = [
  { name: "Brócolis", unit: "maço", price: 6, intermediaryPrice: null, glyph: "🥦" },
  { name: "Rúcula", unit: "maço", price: null, intermediaryPrice: null, glyph: "🌿" },
  { name: "Ovos caipira", unit: "dúzia", price: 14, intermediaryPrice: null, glyph: "🥚" },
];

/** Parses "3,50" / "3.50" / "R$ 3,50" → 3.5; empty → null. */
export function parseMoney(raw: string): number | null {
  const clean = raw.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

// ---------- Storage ----------
const KEY = "cc:panel:v1";

export function loadState(): PanelState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as PanelState;
  } catch {
    /* fall through to seed */
  }
  return initialState();
}

export function saveState(state: PanelState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function resetState() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
