import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CatalogCapture } from "@/components/producer/catalog-capture";
import { usePanel } from "@/lib/panel-context";
import { slugStatus, slugify, type PanelProduct, type Proposal } from "@/lib/producer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produtor/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro · Colheita Certa" },
      { name: "description", content: "Três passos curtos para começar a vender direto." },
      { property: "og:title", content: "Cadastro · Colheita Certa" },
      { property: "og:description", content: "Comece a vender direto em três passos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Signup,
});

const field = "h-14 rounded-2xl border-2 border-line bg-paper text-lg";
const label = "text-[15px] font-semibold text-ink";

function Signup() {
  const { update, live, actions } = usePanel();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [pix, setPix] = useState("");

  const autoSlug = slugify(`${name} ${city}`);
  const finalSlug = slugTouched ? slug : autoSlug;
  const status = slugStatus(finalSlug);

  async function finish(items: Proposal[]) {
    if (live) {
      const ok = await actions.createProfile({ name: name.trim(), city: city.trim(), slug: finalSlug, pixKey: pix.trim() }, items);
      if (ok) navigate({ to: "/produtor/pedidos" });
      return;
    }
    const products: PanelProduct[] = items.map((p, i) => ({
      id: `u${Date.now()}${i}`,
      name: p.name.trim(),
      unit: p.unit,
      price: p.price ?? 0,
      intermediaryPrice: p.intermediaryPrice,
      active: true,
      glyph: p.glyph,
    }));
    update((s) => ({
      ...s,
      profile: { name: name.trim(), city: city.trim(), slug: finalSlug, pixKey: pix.trim() },
      // Keep the sample products too, so the sample orders still add up.
      products: [...s.products, ...products],
    }));
    navigate({ to: "/produtor/pedidos" });
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-6">
        <div className="flex items-center justify-between">
          <Logo size={32} />
          <span className="text-[15px] font-semibold text-muted-text">Passo {step} de 3</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={cn("h-2 rounded-full transition-colors", n <= step ? "bg-leaf-dark" : "bg-sand")} />
          ))}
        </div>

        <div key={step} className="mt-8 flex flex-1 animate-fade-up flex-col">
          {step === 1 ? (
            <>
              <h1 className="font-display text-4xl font-bold text-forest">Quem é você?</h1>
              <p className="mt-2 text-lg text-muted-text">É assim que os compradores vão te ver.</p>
              <label className="mt-8 flex flex-col gap-1.5">
                <span className={label}>Seu nome</span>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Marcos" className={field} autoComplete="name" />
              </label>
              <label className="mt-5 flex flex-col gap-1.5">
                <span className={label}>Município</span>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Biritiba-Mirim" className={field} />
              </label>
              <Button size="lg" className="mt-auto h-16 text-lg" disabled={name.trim().length < 2 || city.trim().length < 2} onClick={() => setStep(2)}>
                Continuar <ArrowRight />
              </Button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <h1 className="font-display text-4xl font-bold text-forest">Seu link e seu Pix</h1>
              <p className="mt-2 text-lg text-muted-text">Os compradores pedem por este link e pagam direto para você.</p>
              <label className="mt-8 flex flex-col gap-1.5">
                <span className={label}>Endereço do seu link</span>
                <div className="flex items-center overflow-hidden rounded-2xl border-2 border-line bg-paper focus-within:ring-2 focus-within:ring-ring">
                  <span className="shrink-0 pl-4 text-base text-muted-text">colheitacerta.app/p/</span>
                  <input
                    value={finalSlug}
                    onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                    className="h-14 min-w-0 flex-1 bg-transparent pr-4 text-lg font-semibold text-ink outline-none"
                    aria-describedby="slug-status"
                  />
                </div>
                <span id="slug-status" aria-live="polite" className={cn("inline-flex items-center gap-1.5 text-[15px] font-bold", status === "free" ? "text-leaf-dark" : "text-rust")}>
                  {status === "free" ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  {status === "free" ? "Livre! É seu." : status === "taken" ? "Já tem alguém com esse. Tente outro." : "Use só letras, números e traço (mínimo 3)."}
                </span>
              </label>
              <label className="mt-6 flex flex-col gap-1.5">
                <span className={label}>Chave Pix</span>
                <Input value={pix} onChange={(e) => setPix(e.target.value)} placeholder="CPF, celular, e-mail ou chave aleatória" className={field} />
              </label>
              <div className="mt-auto grid grid-cols-[auto_1fr] gap-3 pt-8">
                <Button variant="outline" size="lg" className="h-16" onClick={() => setStep(1)} aria-label="Voltar"><ArrowLeft /></Button>
                <Button size="lg" className="h-16 text-lg" disabled={status !== "free" || pix.trim().length < 5} onClick={() => setStep(3)}>
                  Continuar <ArrowRight />
                </Button>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <h1 className="font-display text-4xl font-bold text-forest">Seus produtos</h1>
              <p className="mt-2 mb-6 text-lg text-muted-text">Escolha o jeito mais fácil para você.</p>
              <CatalogCapture onConfirm={finish} confirmLabel="Pronto, abrir meu painel" />
              <Button variant="ghost" className="mt-4" onClick={() => setStep(2)}><ArrowLeft /> Voltar</Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
