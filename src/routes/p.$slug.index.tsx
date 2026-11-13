import { EmptyState } from "@/components/empty-state";
import { ListSkeleton, RouteListError } from "@/components/list-states";
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
import { apiEnabled, getDeviceId, publicApi, showApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const VoiceSheet = lazy(() => import("@/components/buyer/voice-sheet"));
const parent = getRouteApi("/p/$slug");

export const Route = createFileRoute("/p/$slug/")({
  component: Storefront,
  errorComponent: RouteListError,
  pendingComponent: () => <ListSkeleton />,
});

function Storefront() {
  const { producer } = parent.useLoaderData();
  const { slug } = parent.useParams();
  const { cart, setQty, replace, products: PRODUCTS } = useCart();
  const navigate = useNavigate();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);

  const count = cartCount(cart, PRODUCTS);
  const total = cartTotal(cart, PRODUCTS);

  async function repeatLast() {
    if (!apiEnabled) {
      replace(storage.getLastCart(slug));
      toast.success("Último pedido no carrinho. Ajuste se quiser.");
      return;
    }
    const buyer = storage.getBuyer();
    if (!buyer) {
      toast("Ainda não achei pedido seu neste celular. Escolha no catálogo abaixo.");
      return;
    }
    setRepeating(true);
    try {
      const last = await publicApi.lastOrder(slug, buyer.phone, getDeviceId());
      const ok = last.items.filter((i) => i.still_available);
      setUnavailable(last.items.filter((i) => !i.still_available).map((i) => i.product_name));
      if (ok.length === 0) {
        toast("Nada do último pedido está disponível agora. Escolha no catálogo.");
        return;
      }
      replace(Object.fromEntries(ok.map((i) => [i.product_id, i.quantity])));
      toast.success("Último pedido no carrinho. Ajuste se quiser.");
    } catch (e) {
      showApiError(e);
    } finally {
      setRepeating(false);
    }
  }

  function fromVoice(lines: CartLine[], time: string, date?: string) {
    replace(Object.fromEntries(lines.map((l) => [l.product.id, l.quantity])));
    storage.setPrefs(slug, date ? { day: "data", date, time, source: "voz" } : { day: "amanha", time, source: "voz" });
    setVoiceOpen(false);
    navigate({ to: "/p/$slug/pedido", params: { slug } });
  }

  return (
    <div className="pb-32">
      <ProducerHeader producer={producer}>
        <div className="flex items-center gap-3">
          <Button variant="amber" size="lg" className="h-auto min-h-14 min-w-0 flex-1 whitespace-normal px-4 py-2 leading-tight" onClick={repeatLast} isLoading={repeating}>
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
        {unavailable.length > 0 ? (
          <div className="mb-4 rounded-3xl border-2 border-dashed border-line p-4">
            <p className="text-base font-semibold text-muted-text">Do último pedido, sem colheita agora:</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {unavailable.map((n) => (
                <li key={n}>
                  <button type="button" disabled aria-disabled="true" className="inline-flex min-h-12 cursor-not-allowed items-center rounded-full border-2 border-line bg-sand px-4 text-base text-muted-text line-through">
                    {n}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <h2 className="px-2 font-display text-2xl font-bold text-forest">Colhido para amanhã</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {PRODUCTS.length === 0 ? (
            <li>
              <EmptyState icon={ShoppingBasket} title="Nada colhido para amanhã." description="Volte mais tarde ou fale com o produtor." />
            </li>
          ) : null}
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
