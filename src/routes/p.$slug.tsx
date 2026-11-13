import { createFileRoute, notFound, Outlet, Link } from "@tanstack/react-router";

import { CartProvider } from "@/lib/cart-context";
import { findProducer } from "@/lib/buyer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/p/$slug")({
  loader: ({ params }) => {
    const producer = findProducer(params.slug);
    if (!producer) throw notFound();
    return { producer };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.producer.name ?? "Produtor";
    const title = `Horta do ${name} · Colheita Certa`;
    const description = loaderData
      ? `Peça verduras direto do ${name}, de ${loaderData.producer.city}. Entrega amanhã.`
      : "Peça verduras direto do produtor.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-forest">Produtor não encontrado</h1>
      <p className="max-w-xs text-base text-muted-text">Confira o link que o produtor te mandou.</p>
      <Button asChild variant="outline">
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  ),
  component: BuyerLayout,
});

function BuyerLayout() {
  const { slug } = Route.useParams();
  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto min-h-screen max-w-[480px] bg-cream shadow-card">
        <CartProvider slug={slug}>
          <Outlet />
        </CartProvider>
      </div>
    </div>
  );
}
