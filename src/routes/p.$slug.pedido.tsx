import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingBasket, Send } from "lucide-react";

import { ProducerHeader } from "@/components/buyer/producer-header";
import { ProductGlyph } from "@/components/buyer/product-glyph";
import { EmptyState } from "@/components/empty-state";
import { BigNumber } from "@/components/big-number";
import { Chip } from "@/components/chip";
import { Stepper } from "@/components/stepper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart-context";
import {
  TIME_SLOTS,
  cartLines,
  cartTotal,
  isValidPhone,
  isoDay,
  itemsLabel,
  maskPhone,
  newToken,
  storage,
  type DeliveryPrefs,
} from "@/lib/buyer";
import { formatDate, formatMoney, formatQty } from "@/lib/format";
import { apiEnabled, getDeviceId, publicApi, showApiError } from "@/lib/api";

const parent = getRouteApi("/p/$slug");

export const Route = createFileRoute("/p/$slug/pedido")({
  head: () => ({
    meta: [
      { title: "Seu pedido · Colheita Certa" },
      { name: "description", content: "Confira os itens, escolha o dia e o horário da entrega e confirme." },
      { property: "og:title", content: "Seu pedido · Colheita Certa" },
      { property: "og:description", content: "Confira os itens e confirme a entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const label = "text-[15px] font-semibold text-ink";

function Checkout() {
  const { producer } = parent.useLoaderData();
  const { slug } = parent.useParams();
  const { cart, hydrated, setQty, clear, products } = useCart();
  const [source, setSource] = useState<"toque" | "voz">("toque");
  const navigate = useNavigate();

  const [day, setDay] = useState<DeliveryPrefs["day"]>("amanha");
  const [customDate, setCustomDate] = useState(isoDay(2));
  const [time, setTime] = useState("07:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    const b = storage.getBuyer();
    if (b) {
      setName(b.name);
      setPhone(b.phone);
    }
    const p = storage.getPrefs(slug);
    if (p) {
      setDay(p.day);
      if (p.date) setCustomDate(p.date);
      if (p.time) setTime(p.time);
      if (p.source) setSource(p.source);
    }
  }, [slug]);

  const lines = cartLines(cart, products);
  const total = cartTotal(cart, products);
  const date = day === "hoje" ? isoDay(0) : day === "amanha" ? isoDay(1) : customDate;
  const nameOk = name.trim().length >= 2;
  const phoneOk = isValidPhone(phone);

  function celebrateThen(token: string) {
    storage.setLastCart(slug, cart);
    setCelebrate(true);
    window.setTimeout(() => {
      clear();
      navigate({ to: "/pedido/$token", params: { token } });
    }, 1600);
  }

  async function confirm() {
    setTried(true);
    if (!nameOk || !phoneOk || lines.length === 0) return;
    setSending(true);
    storage.setBuyer({ name: name.trim(), phone });
    storage.setPrefs(slug, { day, date: customDate, time });
    if (apiEnabled) {
      try {
        const res = await publicApi.createOrder(slug, {
          buyer_name: name.trim(),
          buyer_phone: phone,
          device_id: getDeviceId(),
          delivery_date: date,
          delivery_time: time,
          items: lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })),
          notes: notes.trim() || null,
          source,
        });
        celebrateThen(res.tracking_token);
      } catch (e) {
        showApiError(e);
        setSending(false);
      }
      return;
    }
    const token = newToken();
    window.setTimeout(() => {
      storage.saveOrder({
        token,
        producerSlug: slug,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        total,
        deliveryDate: date,
        deliveryTime: time,
        buyerName: name.trim(),
        buyerPhone: phone,
        notes: notes.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      celebrateThen(token);
    }, 900);
  }

  if (celebrate) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-forest px-6 text-center" role="status">
        <svg viewBox="0 0 200 140" className="w-56" aria-hidden="true">
          <g className="animate-sun-rise" style={{ transformOrigin: "100px 120px" }}>
            <circle cx="100" cy="90" r="46" fill="var(--color-amber)" />
          </g>
          <g className="animate-grow-leaf [animation-delay:350ms]" style={{ transformOrigin: "100px 130px" }}>
            <path d="M100 130 C 70 110, 70 80, 100 62 C 130 80, 130 110, 100 130 Z" fill="var(--color-leaf)" />
            <path d="M100 128 L100 72" stroke="var(--color-forest)" strokeWidth="3" strokeLinecap="round" />
          </g>
          <rect x="0" y="128" width="200" height="12" fill="var(--color-forest)" />
        </svg>
        <h1 className="animate-fade-up font-display text-3xl font-bold text-cream [animation-delay:500ms]">
          Pedido enviado!
        </h1>
        <p className="animate-fade-up text-lg text-cream/85 [animation-delay:650ms]">
          Agora é com o {producer.name}. Já te mostro o andamento.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <ProducerHeader producer={producer} compact>
        <Link
          to="/p/$slug"
          params={{ slug }}
          className="inline-flex min-h-12 items-center gap-2 text-base font-semibold text-cream underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-5" /> Voltar à vitrine
        </Link>
      </ProducerHeader>

      <main className="flex flex-col gap-6 px-4 pt-6">
        {hydrated && lines.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="Nada no carrinho ainda."
            description="Que tal começar pela alface?"
            action={
              <Button asChild>
                <Link to="/p/$slug" params={{ slug }}>Ver a vitrine</Link>
              </Button>
            }
          />
        ) : (
          <>
            <section className="rounded-3xl border-2 border-line bg-paper p-5">
              <h2 className="font-display text-2xl font-bold text-forest">Seu pedido</h2>
              <ul className="mt-4 flex flex-col divide-y-2 divide-line">
                {lines.map((l) => (
                  <li key={l.product.id} className="flex flex-col gap-3 py-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <ProductGlyph glyph={l.product.glyph} className="size-12 text-3xl" />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-bold text-ink">{l.product.name}</p>
                        <p className="text-[15px] text-muted-text">
                          {formatQty(l.quantity, l.product.unit)} × {formatMoney(l.product.price)}
                        </p>
                      </div>
                      <p className="font-display text-lg font-bold text-ink">
                        {formatMoney(l.quantity * l.product.price)}
                      </p>
                    </div>
                    <Stepper value={l.quantity} onChange={(q) => setQty(l.product.id, q)} label={l.product.name} className="self-start" />
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t-2 border-line pt-4">
                <BigNumber value={formatMoney(total)} label={`Total · ${itemsLabel(lines.length)}`} />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-bold text-forest">Quando entregar?</h2>
              <div className="flex flex-wrap gap-2">
                <Chip selected={day === "hoje"} onClick={() => setDay("hoje")}>Hoje</Chip>
                <Chip selected={day === "amanha"} onClick={() => setDay("amanha")}>Amanhã</Chip>
                <Chip selected={day === "data"} onClick={() => setDay("data")}>Escolher data</Chip>
              </div>
              {day === "data" ? (
                <Input
                  type="date"
                  aria-label="Data da entrega"
                  min={isoDay(0)}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="h-13 rounded-2xl border-2 border-line bg-paper text-lg"
                />
              ) : null}
              <p className="text-base text-muted-text">
                Entrega <strong className="text-ink">{formatDate(date)}</strong>, às{" "}
                <strong className="text-ink">{time}</strong>
              </p>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Horário">
                {TIME_SLOTS.map((t) => (
                  <Chip key={t} selected={time === t} onClick={() => setTime(t)} className="shrink-0 tabular-nums">
                    {t}
                  </Chip>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4 rounded-3xl border-2 border-line bg-paper p-5">
              <h2 className="font-display text-xl font-bold text-forest">Quem está pedindo?</h2>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Nome ou estabelecimento</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="organization"
                  placeholder="Ex.: Restaurante A"
                  aria-invalid={tried && !nameOk}
                  className="h-13 rounded-2xl border-2 border-line bg-cream text-lg"
                />
                {tried && !nameOk ? <span className="text-[15px] font-semibold text-rust">Diga seu nome para o {producer.name}.</span> : null}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Telefone (WhatsApp)</span>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 98888-1010"
                  aria-invalid={tried && !phoneOk}
                  className="h-13 rounded-2xl border-2 border-line bg-cream text-lg tabular-nums"
                />
                {tried && !phoneOk ? <span className="text-[15px] font-semibold text-rust">Confira o telefone, com DDD.</span> : null}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>
                  Observação <span className="font-normal text-muted-text">(opcional)</span>
                </span>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={300}
                  placeholder="Ex.: deixar na porta dos fundos"
                  className="min-h-24 rounded-2xl border-2 border-line bg-cream text-lg"
                />
              </label>
              <p className="text-[15px] text-muted-text">Guardamos seu nome e telefone neste celular para a próxima vez.</p>
            </section>

            <Button size="lg" className="h-16 w-full text-lg" isLoading={sending} onClick={confirm}>
              {sending ? "Enviando…" : (<><Send /> Confirmar pedido · {formatMoney(total)}</>)}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
