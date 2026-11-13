/**
 * Buyer flow logic — pure helpers + browser storage. Sample data only, no network.
 */
import { PRODUCER, PRODUCTS, ALFACE, COUVE, type Product, type Producer } from "@/lib/mock";

export type Cart = Record<string, number>;

export interface CartLine {
  product: Product;
  quantity: number;
}

export function findProducer(slug: string): Producer | undefined {
  return slug === PRODUCER.slug ? PRODUCER : undefined;
}

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function cartLines(cart: Cart): CartLine[] {
  return PRODUCTS.filter((p) => (cart[p.id] ?? 0) > 0).map((product) => ({
    product,
    quantity: cart[product.id] ?? 0,
  }));
}

/** Number of distinct products in the cart ("3 itens"). */
export function cartCount(cart: Cart): number {
  return cartLines(cart).length;
}

export function cartTotal(cart: Cart): number {
  return cartLines(cart).reduce((s, l) => s + l.product.price * l.quantity, 0);
}

export function itemsLabel(n: number): string {
  return n === 1 ? "1 item" : `${n} itens`;
}

/** Brazilian phone mask: "(11) 98888-1010" / "(11) 3333-4444". */
export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

export function isValidPhone(masked: string): boolean {
  const n = masked.replace(/\D/g, "").length;
  return n === 10 || n === 11;
}

/** Delivery time chips: 06:00, 06:30 … 12:00. */
export const TIME_SLOTS: string[] = Array.from({ length: 13 }, (_, i) => {
  const mins = 6 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

export function isoDay(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------- Simulated voice result ----------
export interface VoiceResult {
  transcript: string;
  items: CartLine[];
  unmatched: string[];
  deliveryDay: "amanha";
  deliveryTime: string;
}

export const SAMPLE_VOICE_RESULT: VoiceResult = {
  transcript: "Vinte maços de alface e dez de couve, e uns tomates. Amanhã às sete.",
  items: [
    { product: ALFACE, quantity: 20 },
    { product: COUVE, quantity: 10 },
  ],
  unmatched: ["tomates"],
  deliveryDay: "amanha",
  deliveryTime: "07:00",
};

// ---------- Storage ----------
export type TrackStatus = "pending" | "accepted" | "rejected" | "delivered" | "paid";

export interface PlacedOrder {
  token: string;
  producerSlug: string;
  items: { productId: string; quantity: number }[];
  total: number;
  deliveryDate: string;
  deliveryTime: string;
  buyerName: string;
  buyerPhone: string;
  notes: string;
  status: TrackStatus;
  createdAt: string;
}

export interface BuyerInfo {
  name: string;
  phone: string;
}

export interface DeliveryPrefs {
  day: "hoje" | "amanha" | "data";
  date?: string;
  time?: string;
}

const K = {
  cart: (slug: string) => `cc:cart:${slug}`,
  prefs: (slug: string) => `cc:prefs:${slug}`,
  last: (slug: string) => `cc:last:${slug}`,
  buyer: "cc:buyer",
  orders: "cc:orders",
};

function read<T>(key: string, store: "local" | "session" = "local"): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = (store === "local" ? localStorage : sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown, store: "local" | "session" = "local") {
  if (typeof window === "undefined") return;
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the flow still works in memory */
  }
}

export const storage = {
  getCart: (slug: string) => read<Cart>(K.cart(slug), "session") ?? {},
  setCart: (slug: string, cart: Cart) => write(K.cart(slug), cart, "session"),
  getPrefs: (slug: string) => read<DeliveryPrefs>(K.prefs(slug), "session"),
  setPrefs: (slug: string, p: DeliveryPrefs) => write(K.prefs(slug), p, "session"),
  getBuyer: () => read<BuyerInfo>(K.buyer),
  setBuyer: (b: BuyerInfo) => write(K.buyer, b),
  /** Last order's cart; falls back to a sample so "Repetir" always does something in the demo. */
  getLastCart: (slug: string): Cart =>
    read<Cart>(K.last(slug)) ?? { [ALFACE.id]: 20, [COUVE.id]: 10 },
  setLastCart: (slug: string, cart: Cart) => write(K.last(slug), cart),
  getOrder: (token: string) => read<Record<string, PlacedOrder>>(K.orders)?.[token],
  saveOrder: (o: PlacedOrder) => {
    const all = read<Record<string, PlacedOrder>>(K.orders) ?? {};
    all[o.token] = o;
    write(K.orders, all);
  },
};

export function newToken(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
}
