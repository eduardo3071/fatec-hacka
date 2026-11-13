import { ListSkeleton, RouteListError } from "@/components/list-states";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Check, ChevronDown, Share2, Sprout } from "lucide-react";
import { toast } from "sonner";

import { DayPicker, PageTitle } from "@/components/producer/day-picker";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { usePanel } from "@/lib/panel-context";
import { harvestFor, pendingOn } from "@/lib/producer";
import { isoDay } from "@/lib/buyer";
import { formatDate, formatQty } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtor/_painel/colheita")({
  head: () => ({
    meta: [
      { title: "Colheita · Painel do produtor" },
      { name: "description", content: "Quanto colher de cada produto, já somado." },
      { property: "og:title", content: "Colheita · Colheita Certa" },
      { property: "og:description", content: "A lista de colheita do dia, somada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Harvest,
  errorComponent: RouteListError,
  pendingComponent: () => <ListSkeleton />,
});

function Harvest() {
  const { state, update } = usePanel();
  const [date, setDate] = useState(isoDay(1));
  const [open, setOpen] = useState<string | null>(null);
  const rows = harvestFor(date, state.orders, state.products);
  const pending = pendingOn(date, state.orders);
  const done = rows.filter((r) => state.harvested[`${date}:${r.product.id}`]).length;

  function toggle(id: string) {
    const k = `${date}:${id}`;
    update((s) => ({ ...s, harvested: { ...s.harvested, [k]: !s.harvested[k] } }));
  }

  async function share() {
    const text =
      `Colheita de ${formatDate(date)}:\n` +
      rows.map((r) => `• ${formatQty(r.total, r.product.unit)} · ${r.product.name}`).join("\n");
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("Lista copiada. Cole no WhatsApp.");
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div>
      <PageTitle sub={rows.length ? `${done} de ${rows.length} colhidos` : undefined}>Colheita</PageTitle>
      <DayPicker value={date} onChange={setDate} />

      {pending > 0 ? (
        <Link
          to="/produtor/pedidos"
          className="mt-5 flex min-h-14 items-center gap-3 rounded-3xl bg-amber px-5 py-3 text-lg font-bold text-forest"
        >
          <AlertTriangle className="size-6 shrink-0" />
          {pending === 1 ? "1 pedido esperando sua resposta" : `${pending} pedidos esperando sua resposta`}
        </Link>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState className="mt-6" icon={Sprout} title="Sem colheita marcada para este dia." description="Quando você aceitar pedidos, a lista aparece aqui, já somada." />
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-3">
            {rows.map((r, i) => {
              const k = `${date}:${r.product.id}`;
              const checked = !!state.harvested[k];
              const expanded = open === r.product.id;
              return (
                <li
                  key={r.product.id}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={cn("animate-fade-up rounded-3xl border-2 bg-paper", checked ? "border-leaf" : "border-line")}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={`Marcar ${r.product.name} como colhido`}
                      onClick={() => toggle(r.product.id)}
                      className={cn(
                        "inline-flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-[3px] transition-colors active:scale-95",
                        checked ? "border-leaf-dark bg-leaf-dark text-cream" : "border-line bg-cream text-transparent",
                      )}
                    >
                      <Check className="size-8" strokeWidth={3} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : r.product.id)}
                      aria-expanded={expanded}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cn("block font-display text-5xl font-bold leading-none tabular-nums", checked ? "text-muted-text line-through decoration-2" : "text-forest")}>
                          {r.total}
                        </span>
                        <span className="mt-1 block text-lg text-ink">
                          {formatQty(r.total, r.product.unit).replace(/^\S+\s/, "")} · <strong>{r.product.name}</strong>
                        </span>
                      </span>
                      <ChevronDown className={cn("size-6 shrink-0 text-muted-text transition-transform", expanded && "rotate-180")} />
                    </button>
                  </div>
                  {expanded ? (
                    <ul className="animate-fade-up border-t-2 border-line px-5 py-3">
                      {r.buyers.map((b) => (
                        <li key={b.name} className="flex min-h-11 items-center justify-between text-lg text-ink">
                          <span>{b.name}</span>
                          <strong className="tabular-nums">{formatQty(b.quantity, r.product.unit)}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-[15px] text-muted-text">A marcação de colhido fica só neste celular.</p>
          <Button variant="outline" size="lg" className="mt-5 h-14 w-full text-lg" onClick={share}>
            <Share2 /> Compartilhar a lista
          </Button>
        </>
      )}
    </div>
  );
}
