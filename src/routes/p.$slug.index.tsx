import { createFileRoute, getRouteApi, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Mic, RotateCcw, ShoppingBasket, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { ProducerHeader } from "@/components/buyer/producer-header";
import { ProductGlyph } from "@/components/buyer/product-glyph";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { cartCount, cartTotal, itemsLabel, storage, type CartLine } from "@/lib/buyer";
import { PRODUCTS } from "@/lib/mock";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const VoiceSheet = lazy(() => import("@/components/buyer/voice-sheet"));
const parent = getRouteApi("/p/$slug");

export const Route = createFileRoute("/p/$slug/")({
  component: Storefront,
});

function Storefront() {
  const { producer } = parent.useLoaderData();
  const { slug } = parent.useParams();
  const { cart, setQty, replace } = useCart();
  const navigate = useNavigate();
  const [voiceOpen, setVoiceOpen] = useState(false);

  const count = cartCount(cart);
  const total = cartTotal(cart);

  function repeatLast() {
    replace(storage.getLastCart(slug));
    toast.success("Último pedido no carrinho. Ajuste se quiser.");
  }

  function fromVoice(lines: CartLine[], time: string) {
    replace(Object.fromEntries(lines.map((l) => [l.product.id, l.quantity])));
    storage.setPrefs(slug, { day: "amanha", time });
    setVoiceOpen(false);
    navigate({ to: "/p/$slug/pedido", params: { slug } });
  }

  return (
    <div className="pb-32">
      <ProducerHeader producer={producer}>
        <div className="flex items-center gap-3">
          <Button variant="amber" size="lg" className="flex-1" onClick={repeatLast}>
            <RotateCcw /> Repetir meu último pedido
          </Button>
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            aria-label="Pedir falando"
            className="inline-flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-cream bg-forest-2 text-cream transition-transform active:scale-95"
          >
            <Mic className="size-6" />
          </button>
        </div>
        <p className="mt-2 text-right text-[15px] text-cream/80">ou peça falando</p>
      </ProducerHeader>

      <main className="px-4 pt-6">
        <h2 className="px-2 font-display text-2xl font-bold text-forest">Colhido para amanhã</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {PRODUCTS.map((p, i) => {
            const qty = cart[p.id] ?? 0;
            return (
              <li
                key={p.id}
                style={{ animationDelay: `${i * 50}ms` }}
                className={cn(
                  "animate-fade-up rounded-3xl border-2 bg-paper p-4 transition-colors duration-200",
                  qty > 0 ? "border-leaf shadow-card" : "border-line",
                )}
              >
                <div className="flex items-center gap-4">
                  <ProductGlyph glyph={p.glyph} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xl font-bold text-ink">{p.name}</p>
                    <p className="text-[15px] text-muted-text">por {p.unit}</p>
                  </div>
                  <p className="font-display text-2xl font-bold text-rust">{formatMoney(p.price)}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <Stepper value={qty} onChange={(q) => setQty(p.id, q)} label={p.name} />
                  {qty > 0 ? (
                    <span className="text-right text-[15px] font-semibold text-leaf-dark">
                      {formatMoney(qty * p.price)}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {count === 0 ? (
          <p className="mt-6 flex items-center justify-center gap-2 px-4 text-center text-base text-muted-text">
            <ShoppingBasket className="size-5 shrink-0" aria-hidden="true" />
            Nada no carrinho ainda. Que tal começar pela alface?
          </p>
        ) : null}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto max-w-[480px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {count > 0 ? (
            <Button
              key="bar"
              size="lg"
              className="h-16 w-full animate-bar-in justify-between px-6 text-lg shadow-lift"
              onClick={() => navigate({ to: "/p/$slug/pedido", params: { slug } })}
            >
              <span>Ver pedido · {itemsLabel(count)}</span>
              <span className="inline-flex items-center gap-2">
                {formatMoney(total)} <ArrowRight />
              </span>
            </Button>
          ) : (
            <Button size="lg" disabled className="h-16 w-full text-lg">
              Ver pedido · carrinho vazio
            </Button>
          )}
        </div>
      </div>

      {voiceOpen ? (
        <Suspense fallback={null}>
          <VoiceSheet open={voiceOpen} onOpenChange={setVoiceOpen} onConfirm={fromVoice} />
        </Suspense>
      ) : null}
    </div>
  );
}
