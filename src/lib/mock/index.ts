/**
 * Sample data only — no API, no tables. Types mirror what the real API will return.
 */

export type Unit = "maço" | "kg" | "unidade";

export interface Product {
  id: string;
  name: string;
  unit: Unit;
  price: number;
  glyph: string;
}

export interface Producer {
  name: string;
  city: string;
  slug: string;
  pixKey: string;
}

export interface Buyer {
  id: string;
  name: string;
  phone: string;
}

export type OrderStatus = "pending" | "accepted" | "delivered" | "rejected" | "paid";

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  buyer: Buyer;
  items: OrderItem[];
  deliveryDate: string;
  deliveryTime: string;
  status: OrderStatus;
}

export const PRODUCER: Producer = {
  name: "Marcos",
  city: "Biritiba-Mirim",
  slug: "marcos-biritiba",
  pixKey: "marcos@hortifruti.com.br",
};

export const RESTAURANTE_A: Buyer = { id: "b1", name: "Restaurante A", phone: "(11) 98888-1010" };
export const MERCADINHO_B: Buyer = { id: "b2", name: "Mercadinho B", phone: "(11) 97777-2020" };

export const BUYERS: Buyer[] = [RESTAURANTE_A, MERCADINHO_B];

export const ALFACE: Product = {
  id: "p1",
  name: "Alface crespa",
  unit: "maço",
  price: 3.5,
  glyph: "🥬",
};
export const COUVE: Product = { id: "p2", name: "Couve", unit: "maço", price: 3.0, glyph: "🥗" };
export const BROCOLIS: Product = {
  id: "p3",
  name: "Brócolis",
  unit: "maço",
  price: 6.0,
  glyph: "🥦",
};
export const CENOURA: Product = { id: "p4", name: "Cenoura", unit: "kg", price: 4.0, glyph: "🥕" };
export const RUCULA: Product = { id: "p5", name: "Rúcula", unit: "maço", price: 3.5, glyph: "🌿" };

export const PRODUCTS: Product[] = [ALFACE, COUVE, BROCOLIS, CENOURA, RUCULA];

function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export const SAMPLE_ORDER: Order = {
  id: "o1",
  buyer: RESTAURANTE_A,
  items: [
    { product: ALFACE, quantity: 20 },
    { product: COUVE, quantity: 10 },
  ],
  deliveryDate: inDays(1),
  deliveryTime: "07:00",
  status: "pending",
};

export const SAMPLE_ORDERS: Order[] = [
  SAMPLE_ORDER,
  {
    id: "o2",
    buyer: MERCADINHO_B,
    items: [
      { product: BROCOLIS, quantity: 6 },
      { product: CENOURA, quantity: 4 },
    ],
    deliveryDate: inDays(1),
    deliveryTime: "08:30",
    status: "accepted",
  },
  {
    id: "o3",
    buyer: RESTAURANTE_A,
    items: [{ product: RUCULA, quantity: 12 }],
    deliveryDate: inDays(0),
    deliveryTime: "06:30",
    status: "delivered",
  },
];

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function orderItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.quantity, 0);
}
