import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShoppingBasket, Sprout } from "lucide-react";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiEnabled } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Colheita Certa — entrar como produtor ou comprador" },
      {
        name: "description",
        content:
          "Escolha: vender e colher com a lista pronta, ou pedir por toque e por voz.",
      },
      { property: "og:title", content: "Colheita Certa" },
      {
        property: "og:description",
        content: "Venda direto, colha com a lista pronta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: "https://fatec-hacka.lovable.app/og.png" },
      { name: "twitter:image", content: "https://fatec-hacka.lovable.app/og.png" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-forest">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-6 py-6">
        <Logo variant="light" size={36} />
        {!apiEnabled ? <Badge variant="paid">dados de exemplo</Badge> : null}
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 pb-10">
        <div className="animate-fade-up">
          <Logo variant="light" size={64} showWord={false} />
          <h1 className="mt-6 font-display text-4xl leading-tight font-bold text-cream">
            Como você quer entrar?
          </h1>
          <p className="mt-3 text-lg text-cream/80">
            Toque em uma opção para continuar.
          </p>
        </div>

        <div className="animate-fade-up flex flex-col gap-4 [animation-delay:120ms]">
          <Button
            asChild
            variant="amber"
            size="lg"
            className="h-20 min-h-20 w-full justify-between rounded-3xl px-6 text-left whitespace-normal"
          >
            <Link to="/produtor">
              <span className="flex min-w-0 items-center gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest/15"
                >
                  <Sprout className="size-7 text-forest" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-display text-xl leading-tight font-bold">
                    Sou produtor
                  </span>
                  <span className="text-[15px] font-medium text-forest">
                    Pedidos, colheita, rota e ganhos
                  </span>
                </span>
              </span>
              <ArrowRight className="size-6 shrink-0 text-forest" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            className="h-20 min-h-20 w-full justify-between rounded-3xl border-2 border-cream/45 bg-cream/10 px-6 text-left whitespace-normal text-cream hover:border-cream/70 hover:bg-cream/15"
          >
            <Link to="/p/$slug" params={{ slug: "marcos-biritiba" }}>
              <span className="flex min-w-0 items-center gap-4">
                <span
                  aria-hidden="true"
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-cream/10"
                >
                  <ShoppingBasket className="size-7 text-cream" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-display text-xl leading-tight font-bold">
                    Sou comprador
                  </span>
                  <span className="text-[15px] font-medium text-cream/75">
                    Pedir por toque ou por voz
                  </span>
                </span>
              </span>
              <ArrowRight className="size-6 shrink-0 text-cream" />
            </Link>
          </Button>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-md px-6 pb-8">
        <Link
          to="/design"
          className="inline-flex min-h-12 items-center gap-2 text-[15px] font-semibold text-cream/70 underline underline-offset-4 hover:text-cream"
        >
          Ver a base visual
          <ArrowRight className="size-4" />
        </Link>
      </footer>
    </div>
  );
}
