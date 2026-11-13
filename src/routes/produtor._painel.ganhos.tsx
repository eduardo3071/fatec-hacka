import { ListSkeleton, RouteListError } from "@/components/list-states";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

import { PageTitle } from "@/components/producer/day-picker";
import { BigNumber } from "@/components/big-number";
import { usePanel } from "@/lib/panel-context";
import { producerApi, showApiError, type ApiEarnings } from "@/lib/api";
import { ListError } from "@/components/list-states";
import { earningsFor, MONTHLY_FEE } from "@/lib/producer";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/produtor/_painel/ganhos")({
  head: () => ({
    meta: [
      { title: "Ganhos · Painel do produtor" },
      { name: "description", content: "Quanto você ganhou a mais vendendo direto." },
      { property: "og:title", content: "Ganhos · Colheita Certa" },
      { property: "og:description", content: "Seu ganho a mais vendendo direto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Earnings,
  errorComponent: RouteListError,
  pendingComponent: () => <ListSkeleton />,
});

const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function shift(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y ?? 2026, (m ?? 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Earnings() {
  const { state, live } = usePanel();
  const now = new Date();
  const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(current);
  const local = earningsFor(month, state.orders, state.products);
  const [remote, setRemote] = useState<Record<string, ApiEarnings>>({});
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!live || remote[month]) return;
    let alive = true;
    setFailed(false);
    producerApi
      .earnings(month)
      .then((r) => alive && setRemote((m) => ({ ...m, [month]: r })))
      .catch((err) => {
        if (!alive) return;
        setFailed(true);
        showApiError(err);
      });
    return () => {
      alive = false;
    };
  }, [live, month, remote]);
  const r = remote[month];
  const e = !live
    ? local
    : r
      ? {
          revenue: r.revenue,
          delivered: r.orders_delivered,
          extraGain: r.extra_gain,
          coverage: r.coverage_pct > 1 ? r.coverage_pct / 100 : r.coverage_pct,
          feeTimes: Math.floor(r.extra_gain / MONTHLY_FEE),
        }
      : null;
  const [y, m] = month.split("-").map(Number);
  const raw = monthName.format(new Date(y ?? 2026, (m ?? 1) - 1, 1));
  const label = raw.charAt(0).toUpperCase() + raw.slice(1);
  const pct = e ? Math.round(e.coverage * 100) : 0;

  return (
    <div>
      <PageTitle>Ganhos</PageTitle>
      <div className="flex items-center justify-between gap-2 rounded-full border-2 border-line bg-paper p-1.5">
        <button type="button" aria-label="Mês anterior" onClick={() => setMonth(shift(month, -1))} className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-sand text-forest">
          <ChevronLeft className="size-6" />
        </button>
        <span className="font-display text-xl font-bold text-ink">{label}</span>
        <button type="button" aria-label="Próximo mês" disabled={month >= current} onClick={() => setMonth(shift(month, 1))} className="inline-flex size-12 cursor-pointer items-center justify-center rounded-full bg-sand text-forest disabled:opacity-40">
          <ChevronRight className="size-6" />
        </button>
      </div>

      {!e ? (
        <div className="mt-6">{failed ? <ListError onRetry={() => setRemote((m) => ({ ...m }))} /> : <ListSkeleton rows={2} />}</div>
      ) : (<>
      <section className="mt-6 animate-fade-up rounded-3xl border-2 border-line bg-paper p-6" key={month}>
        <BigNumber value={formatMoney(Math.round(e.extraGain))} />
        <p className="mt-1 text-xl font-semibold text-ink">a mais que com o intermediário</p>

        <div className="mt-6">
          <div className="h-4 overflow-hidden rounded-full bg-sand" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Cobertura do cálculo">
            <div className="h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-base text-muted-text">
            Calculado sobre <strong className="text-ink">{pct}%</strong> das suas vendas: os produtos em que você informou o preço do atravessador.
          </p>
          <p>
            <Link to="/produtor/produtos" className="mt-1 inline-flex min-h-12 items-center text-base font-semibold text-leaf-dark underline underline-offset-4">Informar mais preços</Link>
          </p>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border-2 border-line bg-paper p-5">
          <p className="text-[15px] font-semibold text-muted-text">Vendido no mês</p>
          <p className="mt-1 font-display text-3xl font-bold text-forest">{formatMoney(e.revenue)}</p>
        </div>
        <div className="rounded-3xl border-2 border-line bg-paper p-5">
          <p className="text-[15px] font-semibold text-muted-text">Pedidos entregues</p>
          <p className="mt-1 font-display text-3xl font-bold text-forest">{e.delivered}</p>
        </div>
      </div>

      {e.feeTimes >= 1 ? (
        <p className="mt-6 inline-flex items-start gap-2 text-base text-muted-text">
          <Info className="mt-0.5 size-5 shrink-0" />
          Sua mensalidade de {formatMoney(MONTHLY_FEE).replace(",00", "")} se pagou {e.feeTimes === 1 ? "1 vez" : `${e.feeTimes} vezes`} este mês.
        </p>
      ) : null}
      </>)}
    </div>
  );
}
