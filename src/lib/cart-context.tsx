import * as React from "react";

import { storage, type Cart } from "@/lib/buyer";

interface CartCtx {
  cart: Cart;
  hydrated: boolean;
  setQty: (productId: string, qty: number) => void;
  replace: (cart: Cart) => void;
  clear: () => void;
}

const Ctx = React.createContext<CartCtx | null>(null);

/** Cart for one producer's storefront; kept in sessionStorage so it survives page changes. */
export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [cart, setCart] = React.useState<Cart>({});
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setCart(storage.getCart(slug));
    setHydrated(true);
  }, [slug]);

  React.useEffect(() => {
    if (hydrated) storage.setCart(slug, cart);
  }, [cart, hydrated, slug]);

  const value = React.useMemo<CartCtx>(
    () => ({
      cart,
      hydrated,
      setQty: (id, qty) =>
        setCart((c) => {
          const next = { ...c };
          if (qty <= 0) delete next[id];
          else next[id] = qty;
          return next;
        }),
      replace: (c) => setCart({ ...c }),
      clear: () => setCart({}),
    }),
    [cart, hydrated],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}
