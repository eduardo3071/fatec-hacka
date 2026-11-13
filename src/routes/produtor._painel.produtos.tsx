import { Package } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton, RouteListError } from "@/components/list-states";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { PageTitle } from "@/components/producer/day-picker";
import { CatalogCapture, MiddlemanHint } from "@/components/producer/catalog-capture";
import { Chip } from "@/components/chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { usePanel } from "@/lib/panel-context";
import { UNITS, parseMoney, type PanelProduct, type Proposal } from "@/lib/producer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtor/_painel/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos · Painel do produtor" },
      { name: "description", content: "Preços, unidades e o que está à venda." },
      { property: "og:title", content: "Produtos · Colheita Certa" },
      { property: "og:description", content: "Edite preços e unidades." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Products,
  errorComponent: RouteListError,
  pendingComponent: () => <ListSkeleton />,
});

const field = "h-13 rounded-2xl border-2 border-line bg-cream text-lg tabular-nums pl-12";

function Money({ value, onCommit, label }: { value: number | null; onCommit: (v: number | null) => void; label: string }) {
  const [text, setText] = useState(value == null ? "" : value.toFixed(2).replace(".", ","));
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-text">R$</span>
      <Input aria-label={label} inputMode="decimal" value={text} placeholder="0,00" onChange={(e) => setText(e.target.value)} onBlur={() => onCommit(parseMoney(text))} className={field} />
    </div>
  );
}

function Products() {
  const { state, update } = usePanel();
  const [adding, setAdding] = useState(false);

  function patch(id: string, p: Partial<PanelProduct>) {
    update((s) => ({ ...s, products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
  }

  function add(items: Proposal[]) {
    update((s) => ({
      ...s,
      products: [
        ...s.products,
        ...items.map((p, i) => ({ id: `u${Date.now()}${i}`, name: p.name.trim(), unit: p.unit, price: p.price ?? 0, intermediaryPrice: p.intermediaryPrice, active: true, glyph: p.glyph })),
      ],
    }));
    setAdding(false);
    toast.success(items.length === 1 ? "Produto adicionado." : `${items.length} produtos adicionados.`);
  }

  return (
    <div>
      <PageTitle sub="Desative o que acabou. Nada é apagado.">Produtos</PageTitle>
      {adding ? (
        <section className="mb-6 rounded-3xl border-2 border-dashed border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-forest">Adicionar produtos</h2>
            <button type="button" aria-label="Fechar" onClick={() => setAdding(false)} className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full hover:bg-sand">
              <X className="size-5" />
            </button>
          </div>
          <CatalogCapture onConfirm={add} confirmLabel="Adicionar à minha lista" />
        </section>
      ) : (
        <Button size="lg" className="mb-6 h-14 w-full text-lg" onClick={() => setAdding(true)}>
          <Plus /> Adicionar falando ou por foto
        </Button>
      )}

      <ul className="flex flex-col gap-4">
        {state.products.length === 0 ? (
          <li><EmptyState icon={Package} title="Nenhum produto ainda." description="Adicione falando, por foto ou um a um." /></li>
        ) : null}
        {state.products.map((p) => (
          <li key={p.id} className={cn("flex flex-col gap-4 rounded-3xl border-2 bg-paper p-5 transition-opacity", p.active ? "border-line" : "border-dashed border-line opacity-70")}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-4xl">{p.glyph}</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-bold text-ink">{p.name}</p>
                <p className="text-base font-semibold text-muted-text">{p.active ? "À venda" : "Fora da vitrine"}</p>
              </div>
              <Switch checked={p.active} onCheckedChange={(v) => patch(p.id, { active: v })} aria-label={`${p.name} à venda`} className="relative scale-125 after:absolute after:-inset-3 after:content-['']" />
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Unidade">
              {UNITS.map((u) => (
                <Chip key={u} selected={p.unit === u} onClick={() => patch(p.id, { unit: u })} className="shrink-0">{u}</Chip>
              ))}
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[15px] font-semibold text-ink">Seu preço por {p.unit}</span>
              <Money label={`Preço de ${p.name}`} value={p.price} onCommit={(v) => v != null && patch(p.id, { price: v })} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[15px] font-semibold text-ink">
                Quanto o atravessador paga? <span className="font-normal text-muted-text">(opcional)</span>
              </span>
              <Money label={`Preço do atravessador para ${p.name}`} value={p.intermediaryPrice} onCommit={(v) => patch(p.id, { intermediaryPrice: v })} />
              <MiddlemanHint />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
