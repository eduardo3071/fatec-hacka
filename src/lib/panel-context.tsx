import * as React from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  apiEnabled,
  isNoProfile,
  producerApi,
  showApiError,
  unitToApi,
  ApiError,
} from "@/lib/api";
import { mapOrder, mapProduct, mapProfile } from "@/lib/panel-sync";
import { loadState, saveState, type PanelProduct, type PanelState, type Profile, type Proposal } from "@/lib/producer";

export type PanelPhase = "ready" | "loading" | "signed-out" | "no-profile";
type OrderAction = "accept" | "reject" | "deliver" | "cancel" | "pay";

interface PanelActions {
  refresh: () => Promise<void>;
  orderAction: (id: string, action: OrderAction) => Promise<boolean>;
  patchProduct: (id: string, patch: Partial<PanelProduct>) => Promise<boolean>;
  addProducts: (items: Proposal[]) => Promise<boolean>;
  createProfile: (profile: Profile, items: Proposal[]) => Promise<boolean>;
}

interface PanelCtx {
  state: PanelState;
  update: (fn: (s: PanelState) => PanelState) => void;
  /** true when talking to the real API (VITE_API_URL set). */
  live: boolean;
  phase: PanelPhase;
  offline: boolean;
  actions: PanelActions;
}

const Ctx = React.createContext<PanelCtx | null>(null);
const CACHE = "cc:panel:api:v1";

function emptyState(): PanelState {
  return { profile: null, products: [], orders: [], harvested: {}, notifyAsked: false };
}

function readCache(): PanelState {
  try {
    const raw = localStorage.getItem(CACHE);
    if (raw) return JSON.parse(raw) as PanelState;
  } catch {
    /* ignore */
  }
  return emptyState();
}

/** Client-only (routes using it set ssr: false), so reading storage in the initializer is safe. */
export function PanelProvider({ children }: { children: React.ReactNode }) {
  const live = apiEnabled;
  const [state, setState] = React.useState<PanelState>(() => (live ? readCache() : loadState()));
  const [phase, setPhase] = React.useState<PanelPhase>(live ? "loading" : "ready");
  const [offline, setOffline] = React.useState(false);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  React.useEffect(() => {
    if (live) {
      try {
        localStorage.setItem(CACHE, JSON.stringify(state));
      } catch {
        /* ignore */
      }
    } else saveState(state);
  }, [state, live]);

  const loadOrders = React.useCallback(async (products: PanelProduct[]) => {
    const orders = await producerApi.orders();
    return orders.map((o) => mapOrder(o, products));
  }, []);

  const refresh = React.useCallback(async () => {
    if (!live) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setPhase("signed-out");
      return;
    }
    try {
      const me = await producerApi.me();
      const products = (await producerApi.products()).map(mapProduct);
      const orders = await loadOrders(products);
      setState((s) => ({ ...s, profile: mapProfile(me), products, orders }));
      setOffline(false);
      setPhase("ready");
    } catch (e) {
      if (isNoProfile(e)) return setPhase("no-profile");
      if (e instanceof ApiError && e.status === 401) return setPhase("signed-out");
      if (e instanceof ApiError && e.kind === "network") {
        setOffline(true);
        // Keep showing the last saved state.
        setPhase(stateRef.current.profile ? "ready" : "loading");
        return;
      }
      showApiError(e);
      setPhase(stateRef.current.profile ? "ready" : "loading");
    }
  }, [live, loadOrders]);

  // Initial load + react to sign-in/out.
  React.useEffect(() => {
    if (!live) return;
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void refresh();
      if (event === "SIGNED_OUT") {
        setState(emptyState());
        setPhase("signed-out");
      }
    });
    const onOnline = () => void refresh();
    window.addEventListener("online", onOnline);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
    };
  }, [live, refresh]);

  // New orders in real time (RLS limits rows to the signed-in producer).
  React.useEffect(() => {
    if (!live || phase !== "ready") return;
    const channel = supabase
      .channel("orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async (payload) => {
        try {
          const before = new Set(stateRef.current.orders.map((o) => o.id));
          const orders = await loadOrders(stateRef.current.products);
          const fresh = orders.filter((o) => !before.has(o.id));
          setState((s) => ({
            ...s,
            orders: [...fresh.map((o) => ({ ...o, isNew: true })), ...orders.filter((o) => before.has(o.id))],
          }));
          if (payload.eventType === "INSERT" && fresh[0]) toast(`Pedido novo de ${fresh[0].buyerName}`, { icon: "🌱" });
        } catch {
          /* next change or reconnect will catch up */
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [live, phase, loadOrders]);

  const actions = React.useMemo<PanelActions>(
    () => ({
      refresh,
      async orderAction(id, action) {
        try {
          const o = await producerApi.orderAction(id, action);
          const mapped = mapOrder(o, stateRef.current.products);
          setState((s) => ({ ...s, orders: s.orders.map((x) => (x.id === id ? mapped : x)) }));
          return true;
        } catch (e) {
          showApiError(e);
          return false;
        }
      },
      async patchProduct(id, p) {
        try {
          const out =
            p.active === false && Object.keys(p).length === 1
              ? (await producerApi.deactivateProduct(id), { ...stateRef.current.products.find((x) => x.id === id)!, active: false })
              : mapProduct(
                  await producerApi.patchProduct(id, {
                    ...(p.name !== undefined ? { name: p.name } : {}),
                    ...(p.unit !== undefined ? { unit: unitToApi(p.unit) } : {}),
                    ...(p.price !== undefined ? { price: p.price } : {}),
                    ...(p.intermediaryPrice !== undefined ? { intermediary_price: p.intermediaryPrice } : {}),
                    ...(p.active !== undefined ? { active: p.active } : {}),
                  }),
                );
          setState((s) => ({ ...s, products: s.products.map((x) => (x.id === id ? out : x)) }));
          return true;
        } catch (e) {
          showApiError(e);
          return false;
        }
      },
      async addProducts(items) {
        try {
          const created: PanelProduct[] = [];
          for (const it of items) {
            created.push(
              mapProduct(
                await producerApi.createProduct({
                  name: it.name.trim(),
                  unit: unitToApi(it.unit),
                  price: it.price ?? 0,
                  intermediary_price: it.intermediaryPrice,
                }),
              ),
            );
          }
          setState((s) => ({ ...s, products: [...s.products, ...created] }));
          return true;
        } catch (e) {
          showApiError(e);
          void refresh();
          return false;
        }
      },
      async createProfile(profile, items) {
        try {
          const me = await producerApi.create({
            slug: profile.slug,
            name: profile.name,
            municipality: profile.city || null,
            pix_key: profile.pixKey || null,
          });
          setState((s) => ({ ...s, profile: mapProfile(me) }));
          setPhase("ready");
        } catch (e) {
          showApiError(e);
          return false;
        }
        if (items.length) await actions.addProducts(items);
        return true;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refresh],
  );

  const value = React.useMemo(
    () => ({ state, update: setState, live, phase, offline, actions }),
    [state, live, phase, offline, actions],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePanel(): PanelCtx {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("usePanel must be used inside PanelProvider");
  return v;
}
