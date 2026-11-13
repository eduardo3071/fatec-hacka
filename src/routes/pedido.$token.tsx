import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, PackageSearch, CalendarClock, XCircle, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Logo } from "@/components/logo";
import { TimelineStatus, type TimelineStep } from "@/components/timeline-status";
import { BigNumber } from "@/components/big-number";
import { EmptyState } from "@/components/empty-state";
import { Chip } from "@/components/chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { localTrackView, storage, trackStatus, type TrackStatus, type TrackView } from "@/lib/buyer";
import { ApiError, apiEnabled, apiMessage, glyphFor, hhmm, publicApi, unitFromApi } from "@/lib/api";
import { formatDate, formatMoney, formatQty } from "@/lib/format";

export const Route = createFileRoute("/pedido/$token")({
  head: () => ({
    meta: [
      { title: "Acompanhar pedido · Colheita Certa" },
      { name: "description", content: "Veja o andamento do seu pedido e pague direto ao produtor por Pix." },
      { property: "og:title", content: "Acompanhar pedido · Colheita Certa" },
      { property: "og:description", content: "Andamento do pedido e pagamento por Pix." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Tracking,
});

const STATUS_TEXT: Record<TrackStatus, string> = {
  pending: "aguardando o produtor aceitar",
  accepted: "aceito, a colheita está sendo separada",
  rejected: "não pôde ser atendido",
  delivered: "entregue",
  paid: "entregue e pago",
};

const STATUS_BADGE: Record<TrackStatus, { variant: "pending" | "accepted" | "rejected" | "delivered" | "paid"; label: string }> = {
  pending: { variant: "pending", label: "Aguardando" },
  accepted: { variant: "accepted", label: "Aceito" },
  rejected: { variant: "rejected", label: "Recusado" },
  delivered: { variant: "delivered", label: "Entregue" },
  paid: { variant: "paid", label: "Pago" },
};

function steps(status: TrackStatus, producerName: string): TimelineStep[] {
  const order = ["pending", "accepted", "delivered"] as const;
  const reached = status === "paid" ? 3 : status === "delivered" ? 2 : status === "accepted" ? 1 : 0;
  const labels = ["Pedido enviado", `${producerName} aceitou`, "Entregue"];
  const desc = [
    status === "pending" ? `Esperando o ${producerName} ver o pedido.` : undefined,
    status === "accepted" ? "Colhendo e separando para você." : undefined,
    status === "delivered" || status === "paid" ? "Chegou! Bom proveito." : undefined,
  ];
  return order.map((_, i) => ({
    label: labels[i] ?? "",
    description: desc[i],
    state: i < reached || (i === 2 && reached >= 2) ? "done" : i === reached ? "current" : "todo",
  }));
}

function Tracking() {
  const { token } = Route.useParams();
  const [order, setOrder] = useState<TrackView | null | undefined>(undefined);
  const [stale, setStale] = useState<string | null>(null);

  useEffect(() => {
    if (!apiEnabled) {
      const local = storage.getOrder(token);
      setOrder(local ? localTrackView(local) : null);
      return;
    }
    let alive = true;
    async function load() {
      try {
        const o = await publicApi.order(token);
        if (!alive) return;
        setStale(null);
        setOrder({
          status: trackStatus(o.status, o.payment_status),
          producerName: o.producer_name,
          producerSlug: null,
          pixKey: o.pix_key ?? "",
          total: o.total,
          deliveryDate: o.delivery_date,
          deliveryTime: hhmm(o.delivery_time),
          items: o.items.map((it, i) => ({
            key: `${i}-${it.product_name}`,
            label: `${glyphFor(it.product_name)} ${it.product_name}`,
            quantity: it.quantity,
            unit: unitFromApi(it.unit),
            subtotal: it.subtotal,
          })),
          cart: null,
        });
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) setOrder(null);
        else {
          setStale(apiMessage(e));
          setOrder((prev) => (prev === undefined ? null : prev));
        }
      }
    }
    void load();
    const id = window.setInterval(load, 20000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [token]);

  function setStatus(status: TrackStatus) {
    const local = storage.getOrder(token);
    if (!local) return;
    storage.saveOrder({ ...local, status });
    setOrder(localTrackView({ ...local, status }));
  }

  const producer = order ? { name: order.producerName, slug: order.producerSlug, pixKey: order.pixKey } : undefined;

  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col gap-5 bg-cream px-4 pb-12 pt-6 shadow-card">
        <Logo size={36} />
        {stale && order ? (
          <p role="status" className="rounded-3xl bg-sand px-4 py-3 text-base text-ink">{stale}</p>
        ) : null}

        {order === undefined ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        ) : order === null || !producer ? (
          <EmptyState
            icon={PackageSearch}
            title="Não achei esse pedido aqui."
            description={apiEnabled ? "Confira o link que você recebeu ao fazer o pedido." : "Abra o link no mesmo celular em que você fez o pedido."}
            action={
              <Button asChild>
                <Link to="/p/$slug" params={{ slug: "marcos-biritiba" }}>Fazer um pedido</Link>
              </Button>
            }
          />
        ) : (
          <>
            <section className="animate-fade-up rounded-3xl border-2 border-line bg-paper p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15px] text-muted-text">Pedido para {producer.name}</p>
                  <h1 className="font-display text-2xl font-bold text-forest">
                    {order.status === "rejected" ? "Não deu desta vez" : "Seu pedido está"}
                  </h1>
                </div>
                <Badge variant={STATUS_BADGE[order.status].variant}>{STATUS_BADGE[order.status].label}</Badge>
              </div>
              <p className="mt-1 text-base text-ink">{STATUS_TEXT[order.status]}.</p>
              <p className="mt-3 inline-flex items-center gap-2 text-base text-muted-text">
                <CalendarClock className="size-5 shrink-0" aria-hidden="true" />
                <span>
                  Entrega <strong className="text-ink">{formatDate(order.deliveryDate)}</strong>, às{" "}
                  <strong className="text-ink">{order.deliveryTime}</strong>
                </span>
              </p>

              {order.status === "rejected" ? (
                <div className="mt-5 flex flex-col gap-3 rounded-3xl bg-sand p-4" role="alert">
                  <p className="inline-flex items-start gap-2 text-base text-ink">
                    <XCircle className="mt-0.5 size-5 shrink-0 text-rust" aria-hidden="true" />
                    {producer.slug && order.cart
                      ? `O ${producer.name} não conseguiu atender. Veja outros horários.`
                      : `O ${producer.name} não conseguiu atender desta vez. Fale com ele para combinar outro dia.`}
                  </p>
                  {producer.slug && order.cart ? (
                    <Button asChild variant="outline">
                      <Link
                        to="/p/$slug/pedido"
                        params={{ slug: producer.slug }}
                        onClick={() => producer.slug && order.cart && storage.setCart(producer.slug, order.cart)}
                      >
                        Escolher outro horário
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : (
                <TimelineStatus className="mt-6" steps={steps(order.status, producer.name)} />
              )}
            </section>

            {order.status !== "rejected" ? (
              <section className="animate-fade-up rounded-3xl border-2 border-line bg-paper p-5 [animation-delay:80ms]">
                <h2 className="font-display text-2xl font-bold text-forest">Pagar</h2>
                {order.status === "paid" ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-leaf-dark">
                    <CheckCircle2 className="size-6" /> Pagamento recebido. Obrigado!
                  </p>
                ) : null}
                <BigNumber className="mt-2" value={formatMoney(order.total)} label="valor do pedido" />
                <p className="mt-4 text-base text-ink">
                  O pagamento vai direto para o <strong>{producer.name}</strong>. Pague por Pix quando quiser.
                </p>
                <div className="mt-4 flex flex-col gap-3 rounded-3xl bg-sand p-4">
                  <span className="text-[15px] font-semibold text-muted-text">Chave Pix</span>
                  <span className="break-all font-display text-lg font-bold text-ink">{producer.pixKey}</span>
                  <Button
                    variant="amber"
                    onClick={() => {
                      void navigator.clipboard?.writeText(producer.pixKey).catch(() => undefined);
                      toast.success("Chave Pix copiada. É só colar no app do banco.");
                    }}
                  >
                    <Copy /> Copiar chave
                  </Button>
                </div>
                <div className="mt-4 flex justify-center rounded-3xl border-2 border-line bg-paper p-4">
                  <QRCodeSVG
                    value={producer.pixKey}
                    size={176}
                    bgColor="transparent"
                    fgColor="var(--color-forest)"
                    title={`QR code da chave Pix de ${producer.name}`}
                  />
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border-2 border-line bg-paper p-5">
              <h2 className="font-display text-xl font-bold text-forest">Itens</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {order.items.map((it) => (
                  <li key={it.key} className="flex justify-between gap-3 text-base text-ink">
                    <span>{it.label} · {formatQty(it.quantity, it.unit)}</span>
                    <span className="font-semibold">{formatMoney(it.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {apiEnabled ? null : <section className="rounded-3xl border-2 border-dashed border-line p-4">
              <p className="text-[15px] font-semibold text-muted-text">Só no exemplo: ver como fica cada etapa</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(STATUS_BADGE) as TrackStatus[]).map((s) => (
                  <Chip key={s} selected={order.status === s} onClick={() => setStatus(s)}>
                    {STATUS_BADGE[s].label}
                  </Chip>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
