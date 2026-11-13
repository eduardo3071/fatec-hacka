import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, X, Check, CalendarClock, Inbox, StickyNote } from "lucide-react";
import { toast } from "sonner";

import { PageTitle } from "@/components/producer/day-picker";
import { EmptyState } from "@/components/empty-state";
import { Chip } from "@/components/chip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePanel } from "@/lib/panel-context";
import { incomingOrder, orderTotal, type PanelOrder, type PanelProduct, type PanelStatus } from "@/lib/producer";
import { formatDate, formatMoney, formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtor/_painel/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos · Painel do produtor" },
      { name: "description", content: "Aceite ou recuse os pedidos novos." },
      { property: "og:title", content: "Pedidos · Colheita Certa" },
      { property: "og:description", content: "Pedidos novos, aceitos e entregues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Orders,
});

function summary(o: PanelOrder, products: PanelProduct[]) {
  return o.items
    .map((it) => {
      const p = products.find((x) => x.id === it.productId);
      return p ? `${formatQty(it.quantity, p.unit)} de ${p.name.toLowerCase()}` : null;
    })
    .filter(Boolean)
    .join(", ");
}

function OrderCard({ order, products, children }: { order: PanelOrder; products: PanelProduct[]; children?: React.ReactNode }) {
  return (
    <article
      className={cn(
        "rounded-3xl border-2 bg-paper p-5",
        order.status === "pendente" ? "border-amber shadow-card" : "border-line",
        order.isNew && "animate-fade-up",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-2xl font-bold text-ink">{order.buyerName}</h3>
          <p className="mt-1 inline-flex items-center gap-1.5 text-base text-muted-text">
            <CalendarClock className="size-5 shrink-0" />
            <span>
              <strong className="text-ink">{formatDate(order.date)}</strong> às <strong className="text-ink">{order.time}</strong>
            </span>
          </p>
        </div>
        {order.isNew ? (
          <span className="relative inline-flex">
            <span className="absolute inset-0 rounded-full bg-amber animate-wave" />
            <Badge variant="paid" className="relative">Novo</Badge>
          </span>
        ) : order.status === "entregue" ? (
          <Badge variant={order.paid ? "paid" : "pending"}>{order.paid ? "Pago" : "A receber"}</Badge>
        ) : null}
      </div>
      <p className="mt-3 text-lg text-ink">{summary(order, products)}</p>
      {order.notes ? (
        <p className="mt-2 inline-flex items-start gap-2 text-base text-muted-text">
          <StickyNote className="mt-0.5 size-4 shrink-0" /> {order.notes}
        </p>
      ) : null}
      <p className="mt-3 font-display text-3xl font-bold text-rust">{formatMoney(orderTotal(order, products))}</p>
      {children}
    </article>
  );
}

const TABS: { key: Exclude<PanelStatus, "pendente">; label: string; empty: string }[] = [
  { key: "aceito", label: "Aceitos", empty: "Nenhum pedido aceito por enquanto." },
  { key: "entregue", label: "Entregues", empty: "Nada entregue ainda." },
  { key: "recusado", label: "Recusados", empty: "Nenhum pedido recusado." },
];

function Orders() {
  const { state, update } = usePanel();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("aceito");
  const products = state.products;

  const fresh = state.orders.filter((o) => o.status === "pendente");
  const others = state.orders
    .filter((o) => o.status === tab)
    .sort((a, b) => (tab === "entregue" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date) || a.time.localeCompare(b.time)))
    .slice(0, 20);

  // Demo: one new order arrives a few seconds after opening, once per session.
  useEffect(() => {
    if (sessionStorage.getItem("cc:incoming")) return;
    const id = window.setTimeout(() => {
      sessionStorage.setItem("cc:incoming", "1");
      update((s) => ({ ...s, orders: [incomingOrder(), ...s.orders] }));
      toast("Pedido novo da Lanchonete C", { icon: "🌱" });
    }, 5000);
    return () => window.clearTimeout(id);
  }, [update]);

  function decide(id: string, status: "aceito" | "recusado") {
    update((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, status, isNew: false } : o)) }));
    toast.success(status === "aceito" ? "Pedido aceito. Já está na colheita." : "Pedido recusado. O comprador será avisado.");
  }

  async function askNotify() {
    if ("Notification" in window) {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
    update((s) => ({ ...s, notifyAsked: true }));
    toast.success("Pronto! Você será avisado de novo pedido.");
  }

  return (
    <div>
      <PageTitle sub={fresh.length ? `${fresh.length} esperando sua resposta` : "Tudo respondido"}>Pedidos</PageTitle>

      {!state.notifyAsked ? (
        <div className="mb-5 flex items-start gap-3 rounded-3xl bg-sand p-4">
          <Bell className="mt-1 size-6 shrink-0 text-leaf-dark" />
          <div className="flex-1">
            <p className="text-base text-ink">Quer saber na hora quando chegar pedido, mesmo com o app fechado?</p>
            <Button className="mt-3 h-auto min-h-12 whitespace-normal py-2 text-left" onClick={askNotify}>Quero ser avisado de novo pedido</Button>
          </div>
          <button
            type="button"
            aria-label="Agora não"
            onClick={() => update((s) => ({ ...s, notifyAsked: true }))}
            className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-text hover:bg-line"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : null}

      <section aria-labelledby="novos">
        <h2 id="novos" className="mb-3 font-display text-2xl font-bold text-forest">Novos</h2>
        {fresh.length === 0 ? (
          <EmptyState icon={Inbox} title="Nenhum pedido novo." description="Quando chegar, aparece aqui em cima." />
        ) : (
          <div className="flex flex-col gap-4">
            {fresh.map((o) => (
              <OrderCard key={o.id} order={o} products={products}>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" className="h-16 text-lg" onClick={() => decide(o.id, "recusado")}>
                    <X /> Recusar
                  </Button>
                  <Button size="lg" className="h-16 text-lg" onClick={() => decide(o.id, "aceito")}>
                    <Check /> Aceitar
                  </Button>
                </div>
              </OrderCard>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <Chip key={t.key} role="tab" aria-selected={tab === t.key} selected={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label} · {state.orders.filter((o) => o.status === t.key).length}
            </Chip>
          ))}
        </div>
        {others.length === 0 ? (
          <EmptyState icon={Inbox} title={TABS.find((t) => t.key === tab)?.empty ?? ""} />
        ) : (
          <div className="flex flex-col gap-4">
            {others.map((o) => (
              <OrderCard key={o.id} order={o} products={products} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
