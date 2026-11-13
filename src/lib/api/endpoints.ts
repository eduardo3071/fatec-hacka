import { apiRequest } from "./client";
import type * as T from "./types";

const enc = encodeURIComponent;

// ---------- Buyer (no login) ----------
export const publicApi = {
  catalog: (slug: string) => apiRequest<T.ApiCatalog>(`/public/${enc(slug)}/catalog`),
  createOrder: (slug: string, body: T.ApiOrderIn) =>
    apiRequest<T.ApiPublicOrder>(`/public/${enc(slug)}/orders`, { method: "POST", json: body }),
  order: (token: string) => apiRequest<T.ApiPublicOrder>(`/public/orders/${enc(token)}`),
  lastOrder: (slug: string, phone: string, deviceId: string) =>
    apiRequest<T.ApiLastOrder>(`/public/${enc(slug)}/last-order`, { query: { phone, device_id: deviceId } }),
  voiceOrder: (slug: string, audio: Blob, deviceId: string, durationSeconds: number) => {
    const form = new FormData();
    form.set("audio", audio, "pedido.webm");
    form.set("device_id", deviceId);
    form.set("duration_seconds", String(durationSeconds));
    return apiRequest<T.ApiVoiceDraft>(`/public/${enc(slug)}/voice-order`, { method: "POST", form });
  },
};

// ---------- Producer (Bearer) ----------
const a = { auth: true } as const;
export const producerApi = {
  me: () => apiRequest<T.ApiProducer>("/producer", a),
  create: (body: T.ApiProducerIn) => apiRequest<T.ApiProducer>("/producer", { ...a, method: "POST", json: body }),
  patch: (body: T.ApiProducerPatch) => apiRequest<T.ApiProducer>("/producer", { ...a, method: "PATCH", json: body }),
  products: () => apiRequest<T.ApiProduct[]>("/products", { ...a, query: { include_inactive: true } }),
  createProduct: (body: T.ApiProductIn) => apiRequest<T.ApiProduct>("/products", { ...a, method: "POST", json: body }),
  patchProduct: (id: string, body: T.ApiProductPatch) =>
    apiRequest<T.ApiProduct>(`/products/${enc(id)}`, { ...a, method: "PATCH", json: body }),
  deactivateProduct: (id: string) => apiRequest<unknown>(`/products/${enc(id)}`, { ...a, method: "DELETE" }),
  orders: (q: { status?: string; date?: string } = {}) => apiRequest<T.ApiOrder[]>("/orders", { ...a, query: q }),
  orderAction: (id: string, action: "accept" | "reject" | "deliver" | "cancel" | "pay") =>
    apiRequest<T.ApiOrder>(`/orders/${enc(id)}/${action}`, { ...a, method: "POST" }),
  harvest: (date: string) => apiRequest<T.ApiHarvest>("/harvest", { ...a, query: { date } }),
  earnings: (month: string) => apiRequest<T.ApiEarnings>("/earnings", { ...a, query: { month } }),
  catalogFromVoice: (audio: Blob, durationSeconds: number) => {
    const form = new FormData();
    form.set("audio", audio, "catalogo.webm");
    form.set("duration_seconds", String(durationSeconds));
    return apiRequest<T.ApiCatalogProposal>("/ai/catalog/voice", { ...a, method: "POST", form });
  },
  catalogFromPhoto: (image: File) => {
    const form = new FormData();
    form.set("image", image);
    return apiRequest<T.ApiCatalogProposal>("/ai/catalog/photo", { ...a, method: "POST", form });
  },
  pushPublicKey: () => apiRequest<{ public_key?: string; key?: string } | string>("/push/public-key", a),
  pushSubscribe: (body: T.ApiPushSubscribe) => apiRequest<unknown>("/push/subscribe", { ...a, method: "POST", json: body }),
};
