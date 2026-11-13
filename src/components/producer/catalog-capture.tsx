import * as React from "react";
import { Mic, Camera, Plus, Square, Loader2, Trash2, AlertCircle, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/chip";
import { PHOTO_PROPOSAL, UNITS, VOICE_PROPOSAL, parseMoney, type Proposal } from "@/lib/producer";
import { cn } from "@/lib/utils";
import { apiEnabled, glyphFor, producerApi, showApiError, unitFromApi, type ApiCatalogProposal } from "@/lib/api";
import { useRecorder } from "@/lib/use-recorder";

function fromApi(p: ApiCatalogProposal): Proposal[] {
  return p.products.map((x) => ({ name: x.name, unit: unitFromApi(x.unit), price: x.price_missing ? null : x.price, intermediaryPrice: null, glyph: glyphFor(x.name) }));
}

type Mode = "choose" | "recording" | "thinking" | "review";

const field = "h-13 rounded-2xl border-2 border-line bg-cream text-lg";

export function MiddlemanHint() {
  return (
    <p className="text-[15px] text-muted-text">
      Só para calcular quanto você ganha a mais vendendo direto. Ninguém vê.
    </p>
  );
}

function MoneyInput({
  value,
  onChange,
  label,
  missing,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  missing?: boolean;
}) {
  const [text, setText] = React.useState(value == null ? "" : value.toFixed(2).replace(".", ","));
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-text">R$</span>
      <Input
        aria-label={label}
        inputMode="decimal"
        value={text}
        placeholder="0,00"
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseMoney(e.target.value));
        }}
        className={cn(field, "pl-12 tabular-nums", missing && "border-amber bg-amber/15")}
      />
    </div>
  );
}

export function ProposalEditor({ items, onChange }: { items: Proposal[]; onChange: (items: Proposal[]) => void }) {
  const set = (i: number, p: Partial<Proposal>) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <ul className="flex flex-col gap-4">
      {items.map((p, i) => (
        <li key={i} className={cn("flex flex-col gap-3 rounded-3xl border-2 bg-paper p-4", p.price == null ? "border-amber" : "border-line")}>
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-3xl">{p.glyph}</span>
            <Input aria-label="Nome do produto" value={p.name} onChange={(e) => set(i, { name: e.target.value })} className={cn(field, "flex-1 font-semibold")} />
            <button
              type="button"
              aria-label={`Tirar ${p.name}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-rust hover:bg-sand"
            >
              <Trash2 className="size-5" />
            </button>
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Unidade">
            {UNITS.map((u) => (
              <Chip key={u} selected={p.unit === u} onClick={() => set(i, { unit: u })} className="shrink-0">{u}</Chip>
            ))}
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] font-semibold text-ink">Seu preço por {p.unit}</span>
            <MoneyInput label={`Preço de ${p.name}`} value={p.price} missing={p.price == null} onChange={(v) => set(i, { price: v })} />
            {p.price == null ? (
              <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-rust">
                <AlertCircle className="size-4" /> Falta o preço
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[15px] font-semibold text-ink">
              Quanto o atravessador paga por esta unidade? <span className="font-normal text-muted-text">(opcional)</span>
            </span>
            <MoneyInput label={`Preço do atravessador para ${p.name}`} value={p.intermediaryPrice} onChange={(v) => set(i, { intermediaryPrice: v })} />
            <MiddlemanHint />
          </label>
        </li>
      ))}
    </ul>
  );
}

/** Three ways to add products: voice / photo / one by one. Uses the API's AI when configured. */
export function CatalogCapture({ onConfirm, confirmLabel = "Confirmar produtos" }: { onConfirm: (items: Proposal[]) => void; confirmLabel?: string }) {
  const [mode, setMode] = React.useState<Mode>("choose");
  const [items, setItems] = React.useState<Proposal[]>([]);
  const [secs, setSecs] = React.useState(0);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const recorder = useRecorder();

  async function startVoice() {
    if (apiEnabled) {
      try {
        await recorder.start();
      } catch {
        showApiError(new Error("mic"));
        return;
      }
    }
    setMode("recording");
  }

  async function stopVoice() {
    if (!apiEnabled) return think(VOICE_PROPOSAL);
    setMode("thinking");
    const rec = await recorder.stop();
    if (!rec || rec.seconds < 1) {
      setMode(items.length ? "review" : "choose");
      return;
    }
    try {
      const r = await producerApi.catalogFromVoice(rec.blob, Math.round(rec.seconds));
      setItems((cur) => [...cur, ...fromApi(r)]);
      setMode("review");
    } catch (e) {
      showApiError(e, { ai: true });
      setMode(items.length ? "review" : "choose");
    }
  }

  async function fromPhoto(file: File) {
    if (!apiEnabled) return think(PHOTO_PROPOSAL);
    setMode("thinking");
    try {
      const r = await producerApi.catalogFromPhoto(file);
      setItems((cur) => [...cur, ...fromApi(r)]);
      setMode("review");
    } catch (e) {
      showApiError(e, { ai: true });
      setMode(items.length ? "review" : "choose");
    }
  }

  React.useEffect(() => {
    if (mode !== "recording") return;
    const t0 = Date.now();
    const id = window.setInterval(() => setSecs(Math.floor((Date.now() - t0) / 1000)), 250);
    return () => window.clearInterval(id);
  }, [mode]);

  function think(result: Proposal[]) {
    setMode("thinking");
    window.setTimeout(() => {
      setItems((cur) => [...cur, ...result.map((r) => ({ ...r }))]);
      setMode("review");
    }, 1300);
  }

  const missing = items.filter((i) => i.price == null || !i.name.trim()).length;

  if (mode === "recording") {
    return (
      <div className="flex flex-col items-center gap-5 rounded-3xl border-2 border-line bg-paper p-6 text-center">
        <div className="relative flex size-40 items-center justify-center">
          <span className="absolute inset-4 rounded-full bg-amber animate-wave" />
          <span className="absolute inset-4 rounded-full bg-amber animate-wave [animation-delay:0.8s]" />
          <button type="button" aria-label="Parar gravação" onClick={() => void stopVoice()} className="relative inline-flex size-28 cursor-pointer items-center justify-center rounded-full bg-amber text-forest shadow-lift">
            <Square className="size-10" fill="currentColor" />
          </button>
        </div>
        <p className="font-display text-3xl font-bold tabular-nums text-ink">00:{String(secs).padStart(2, "0")}</p>
        <p className="max-w-xs rounded-3xl bg-sand px-5 py-4 text-base text-ink">
          Fale seus produtos: <em>“alface crespa, maço, três e cinquenta; couve, maço, três reais; cenoura no quilo”</em>
        </p>
      </div>
    );
  }

  if (mode === "thinking") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-line bg-paper py-12 text-center" aria-live="polite">
        <Loader2 className="size-12 animate-spin text-leaf-dark" />
        <p className="font-display text-xl font-bold text-ink">Montando sua lista…</p>
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-base text-muted-text">Confira e corrija. O que estiver em âmbar precisa de preço.</p>
        <ProposalEditor items={items} onChange={setItems} />
        <Button variant="outline" size="lg" onClick={() => setMode("choose")}>
          <Plus /> Adicionar mais
        </Button>
        <Button size="lg" className="h-16 text-lg" disabled={items.length === 0 || missing > 0} onClick={() => onConfirm(items)}>
          <Check /> {missing > 0 ? `Falta preço em ${missing}` : confirmLabel}
        </Button>
      </div>
    );
  }

  const cards = [
    { icon: Mic, title: "Cadastrar falando", text: "Diga os produtos e os preços.", tone: "bg-amber text-forest", on: () => void startVoice() },
    { icon: Camera, title: "Cadastrar por foto", text: "Foto da lousa ou da lista de preços.", tone: "bg-leaf-dark text-cream", on: () => fileRef.current?.click() },
    {
      icon: Plus,
      title: "Adicionar um a um",
      text: "Digite nome, unidade e preço.",
      tone: "bg-sand text-forest",
      on: () => {
        setItems((c) => [...c, { name: "", unit: "maço", price: null, intermediaryPrice: null, glyph: "🌱" }]);
        setMode("review");
      },
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void fromPhoto(f); e.target.value = ""; }} />
      {cards.map((c) => (
        <button key={c.title} type="button" onClick={c.on} className="flex min-h-24 cursor-pointer items-center gap-4 rounded-3xl border-2 border-line bg-paper p-5 text-left transition-transform hover:border-forest active:scale-[0.99]">
          <span className={cn("inline-flex size-16 shrink-0 items-center justify-center rounded-full", c.tone)}>
            <c.icon className="size-8" />
          </span>
          <span>
            <span className="block font-display text-xl font-bold text-ink">{c.title}</span>
            <span className="block text-base text-muted-text">{c.text}</span>
          </span>
        </button>
      ))}
      {items.length > 0 ? (
        <Button variant="ghost" onClick={() => setMode("review")}>Voltar à lista ({items.length})</Button>
      ) : null}
    </div>
  );
}
