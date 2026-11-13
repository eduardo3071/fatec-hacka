import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mic, Smartphone } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { PRODUCTS, PRODUCER } from "@/lib/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colheita Certa — peça por toque, colha com a lista pronta" },
      {
        name: "description",
        content:
          "Pedidos por toque e por voz para horticultores do Alto Tietê (SP) e seus compradores.",
      },
      { property: "og:title", content: "Colheita Certa" },
      {
        property: "og:description",
        content: "Venda direto, colha com a lista pronta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-forest">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-6">
        <Logo variant="light" size={36} />
        <Badge variant="paid">demo visual</Badge>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 pb-10">
        <div className="animate-fade-up">
          <Logo variant="light" size={64} />
          <h1 className="mt-8 font-display text-4xl leading-tight font-bold text-cream">
            Venda direto, colha com a lista pronta.
          </h1>
          <p className="mt-4 text-lg text-cream/80">
            Pedidos por toque ou por voz para quem planta no Alto Tietê e para quem compra todo
            dia.
          </p>
        </div>

        <div className="animate-fade-up flex flex-col gap-4 [animation-delay:120ms]">
          <Button size="lg" className="w-full">
            <Smartphone />
            Entrar como produtor
          </Button>
          <Button variant="amber" size="lg" className="w-full">
            <Mic />
            Pedir falando
          </Button>
        </div>

        <div className="animate-fade-up rounded-3xl border-2 border-line/25 bg-card p-6 [animation-delay:220ms]">
          <p className="font-display text-xl font-bold text-cream">
            {PRODUCER.name}, {PRODUCER.city}
          </p>
          <p className="mt-1 text-base text-cream/75">Entrega amanhã</p>
          <ul className="mt-4 space-y-3">
            {PRODUCTS.slice(0, 3).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="inline-flex size-11 items-center justify-center rounded-xl bg-forest-2 text-xl"
                  >
                    {p.glyph}
                  </span>
                  <span className="text-base text-cream">{p.name}</span>
                </span>
                <span className="font-display text-lg font-bold text-amber">
                  {formatMoney(p.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md px-6 pb-8">
        <Link
          to="/design"
          className="inline-flex items-center gap-2 text-base font-semibold text-cream underline underline-offset-4"
        >
          Ver a base visual
          <ArrowRight className="size-4" />
        </Link>
      </footer>
    </div>
  );
}
