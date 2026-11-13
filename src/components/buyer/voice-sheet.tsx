import * as React from "react";
import { Mic, Square, RotateCcw, Check, Loader2, MicOff } from "lucide-react";

import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/chip";
import { Stepper } from "@/components/stepper";
import { ProductGlyph } from "@/components/buyer/product-glyph";
import { SAMPLE_VOICE_RESULT, type CartLine } from "@/lib/buyer";
import { PRODUCTS } from "@/lib/mock";
import { formatMoney } from "@/lib/format";

type Phase = "idle" | "recording" | "thinking" | "result" | "error";

/**
 * "Pedir falando" — fully simulated: no microphone, no network.
 * A recording shorter than 1s simulates "couldn't hear"; otherwise returns the sample result.
 */
export default function VoiceSheet({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lines: CartLine[], time: string) => void;
}) {
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [seconds, setSeconds] = React.useState(0);
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [unmatched, setUnmatched] = React.useState<string[]>([]);
  const startedAt = React.useRef(0);

  React.useEffect(() => {
    if (phase !== "recording") return;
    const id = window.setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 250);
    return () => window.clearInterval(id);
  }, [phase]);

  React.useEffect(() => {
    if (!open) {
      setPhase("idle");
      setSeconds(0);
    }
  }, [open]);

  function start() {
    startedAt.current = Date.now();
    setSeconds(0);
    setPhase("recording");
  }

  function stop() {
    const elapsed = Date.now() - startedAt.current;
    setPhase("thinking");
    window.setTimeout(() => {
      if (elapsed < 1000) {
        setPhase("error");
        return;
      }
      setLines(SAMPLE_VOICE_RESULT.items.map((l) => ({ ...l })));
      setUnmatched([...SAMPLE_VOICE_RESULT.unmatched]);
      setPhase("result");
    }, 1400);
  }

  function setQty(id: string, quantity: number) {
    setLines((ls) => ls.map((l) => (l.product.id === id ? { ...l, quantity } : l)));
  }

  function addProduct(id: string) {
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) return;
    setLines((ls) => (ls.some((l) => l.product.id === id) ? ls : [...ls, { product, quantity: 1 }]));
    setUnmatched((u) => u.slice(1));
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const valid = lines.filter((l) => l.quantity > 0);

  const footer =
    phase === "result" ? (
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full"
          disabled={valid.length === 0}
          onClick={() => onConfirm(valid, SAMPLE_VOICE_RESULT.deliveryTime)}
        >
          <Check /> Está certo, ir para o pedido
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={start}>
          <RotateCcw /> Gravar de novo
        </Button>
      </div>
    ) : phase === "error" ? (
      <div className="flex flex-col gap-3">
        <Button variant="amber" size="lg" className="w-full" onClick={start}>
          <Mic /> Tentar de novo
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
          Escolher no catálogo
        </Button>
      </div>
    ) : undefined;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={phase === "result" ? "Entendi isto" : "Pedir falando"}
      description={phase === "result" ? "Confira e ajuste antes de seguir." : undefined}
      footer={footer}
    >
      {phase === "idle" || phase === "recording" ? (
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div className="relative flex size-44 items-center justify-center">
            {phase === "recording" ? (
              <>
                <span className="absolute inset-4 rounded-full bg-amber animate-wave" />
                <span className="absolute inset-4 rounded-full bg-amber animate-wave [animation-delay:0.8s]" />
              </>
            ) : null}
            <button
              type="button"
              onClick={phase === "recording" ? stop : start}
              aria-label={phase === "recording" ? "Parar gravação" : "Começar a gravar"}
              className="relative inline-flex size-32 cursor-pointer items-center justify-center rounded-full bg-amber text-forest shadow-lift transition-transform active:scale-95"
            >
              {phase === "recording" ? (
                <Square className="size-11" fill="currentColor" />
              ) : (
                <Mic className="size-14" strokeWidth={2.25} />
              )}
            </button>
          </div>
          {phase === "recording" ? (
            <div aria-live="polite">
              <p className="font-display text-4xl font-bold tabular-nums text-ink">
                {mm}:{ss}
              </p>
              <p className="text-base text-muted-text">Ouvindo… toque para terminar</p>
            </div>
          ) : (
            <p className="text-base font-semibold text-ink">Toque e fale</p>
          )}
          <p className="max-w-xs rounded-3xl bg-sand px-5 py-4 text-base text-ink">
            Fale o pedido: <em>“vinte maços de alface e dez de couve, amanhã às sete”</em>
          </p>
        </div>
      ) : null}

      {phase === "thinking" ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center" aria-live="polite">
          <Loader2 className="size-12 animate-spin text-leaf-dark" />
          <p className="font-display text-xl font-bold text-ink">Anotando seu pedido…</p>
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center" role="alert">
          <span className="inline-flex size-20 items-center justify-center rounded-full bg-sand text-rust">
            <MicOff className="size-10" />
          </span>
          <p className="max-w-xs font-display text-xl font-bold text-ink">Não consegui ouvir.</p>
          <p className="max-w-xs text-base text-muted-text">Tente de novo ou escolha no catálogo.</p>
        </div>
      ) : null}

      {phase === "result" ? (
        <div className="flex flex-col gap-5">
          <blockquote className="rounded-3xl bg-sand px-5 py-4 text-base italic text-ink">
            “{SAMPLE_VOICE_RESULT.transcript}”
          </blockquote>
          <ul className="flex flex-col gap-3">
            {lines.map((l) => (
              <li key={l.product.id} className="flex flex-col gap-3 rounded-3xl border-2 border-leaf bg-paper p-4">
                <div className="flex items-center gap-3">
                  <ProductGlyph glyph={l.product.glyph} className="size-12 text-3xl" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold text-ink">{l.product.name}</p>
                    <p className="text-[15px] text-muted-text">
                      {formatMoney(l.product.price)} o {l.product.unit}
                    </p>
                  </div>
                </div>
                <Stepper value={l.quantity} onChange={(q) => setQty(l.product.id, q)} label={l.product.name} className="self-start" />
              </li>
            ))}
          </ul>
          {unmatched.length > 0 ? (
            <section className="rounded-3xl border-2 border-dashed border-line p-4">
              <h3 className="font-display text-lg font-bold text-ink">Não entendi</h3>
              <p className="text-base text-muted-text">
                “{unmatched[0]}” não está na lista do Marcos. Quer trocar por algum destes?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRODUCTS.filter((p) => !lines.some((l) => l.product.id === p.id)).map((p) => (
                  <Chip key={p.id} onClick={() => addProduct(p.id)}>
                    {p.glyph} {p.name}
                  </Chip>
                ))}
                <Chip onClick={() => setUnmatched((u) => u.slice(1))}>Deixar sem</Chip>
              </div>
            </section>
          ) : null}
          <p className="text-base text-muted-text">
            Entrega: <strong className="text-ink">amanhã, às {SAMPLE_VOICE_RESULT.deliveryTime}</strong>
          </p>
        </div>
      ) : null}
    </BottomSheet>
  );
}
