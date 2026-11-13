import { ListSkeleton, RouteListError } from "@/components/list-states";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Truck, Wallet, MapPinned, Check } from "lucide-react";
import { toast } from "sonner";

import { DayPicker, PageTitle } from "@/components/producer/day-picker";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePanel } from "@/lib/panel-context";
import { orderTotal, routeFor } from "@/lib/producer";
import { isoDay } from "@/lib/buyer";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtor/_painel/rota")({
  head: () => ({
    meta: [
      { title: "Rota · Painel do produtor" },
      { name: "description", content: "Paradas do dia por horário, com quem já pagou." },
      { property: "og:title", content: "Rota · Colheita Certa" },
      { property: "og:description", content: "As entregas do dia em ordem de horário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoutePage,
  errorComponent: RouteListError,
  pendingComponent: () => <ListSkeleton />,
});

function RoutePage() {
  const { state, update } = usePanel();
  const [date, setDate] = useState(isoDay(0));
  const stops = routeFor(date, state.orders);
  const toReceive = stops.filter((s) => !s.paid).reduce((t, s) => t + orderTotal(s, state.products), 0);

  function patch(id: string, p: { status?: "entregue"; paid?: boolean }, msg: string) {
    update((s) => ({ ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, ...p } : o)) }));
    toast.success(msg);
  }

  return (
    <div>
      <PageTitle sub={stops.length ? `${stops.length} paradas · ${formatMoney(toReceive)} a receber` : undefined}>Rota</PageTitle>
      <DayPicker value={date} onChange={setDate} />

      {stops.length === 0 ? (
        <EmptyState className="mt-6" icon={MapPinned} title="Nenhuma entrega neste dia." description="Pedidos aceitos aparecem aqui por horário." />
      ) : (
        <ol className="mt-6 flex flex-col">
          {stops.map((s, i) => {
            const delivered = s.status === "entregue";
            const items = s.items.reduce((t, it) => t + it.quantity, 0);
            return (
              <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                {i < stops.length - 1 ? (
                  <span aria-hidden="true" className={cn("absolute left-7 top-16 h-[calc(100%-4rem)] w-0.5 -translate-x-1/2", delivered ? "bg-leaf-dark" : "bg-line")} />
                ) : null}
                <div className={cn("relative z-10 flex size-14 shrink-0 flex-col items-center justify-center rounded-full border-2 font-display text-base font-bold tabular-nums", delivered ? "border-leaf-dark bg-leaf-dark text-cream" : "border-amber bg-amber text-forest")}>
                  {delivered ? <Check className="size-6" strokeWidth={3} /> : s.time}
                </div>
                <article className={cn("min-w-0 flex-1 rounded-3xl border-2 bg-paper p-5", delivered ? "border-line" : "border-amber")}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-semibold text-muted-text">Parada {i + 1} · {s.time}</p>
                      <h2 className="font-display text-2xl font-bold text-ink">{s.buyerName}</h2>
                    </div>
                    <Badge variant={s.paid ? "paid" : "pending"}>{s.paid ? "Pago" : "A receber"}</Badge>
                  </div>
                  <a
                    href={`tel:+55${s.buyerPhone.replace(/\D/g, "")}`}
                    className="mt-2 inline-flex min-h-12 items-center gap-2 text-lg font-semibold text-leaf-dark underline-offset-4 hover:underline"
                  >
                    <Phone className="size-5" /> {s.buyerPhone}
                  </a>
                  <p className="text-lg text-ink">
                    {items} itens · <strong className="font-display text-2xl text-rust">{formatMoney(orderTotal(s, state.products))}</strong>
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      size="lg"
                      className="h-14 text-lg"
                      disabled={delivered}
                      onClick={() => patch(s.id, { status: "entregue" }, `Entregue para ${s.buyerName}.`)}
                    >
                      <Truck /> {delivered ? "Entregue" : "Marcar entregue"}
                    </Button>
                    <Button
                      variant="amber"
                      size="lg"
                      className="h-14 text-lg"
                      disabled={s.paid}
                      onClick={() => patch(s.id, { paid: true }, `Pagamento de ${s.buyerName} anotado.`)}
                    >
                      <Wallet /> {s.paid ? "Pago" : "Marcar pago"}
                    </Button>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
