import { MapPin, Truck } from "lucide-react";

import type { Producer } from "@/lib/mock";
import { cn } from "@/lib/utils";

/** Forest header with the two brand circles as a decorative sunrise. */
export function ProducerHeader({
  producer,
  compact = false,
  children,
}: {
  producer: Producer;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <header className={cn("relative overflow-hidden bg-forest px-6 text-cream", compact ? "pb-6 pt-6" : "pb-10 pt-10")}>
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="pointer-events-none absolute -right-14 -top-10 size-56 opacity-90"
      >
        <circle cx="80" cy="85" r="58" fill="var(--color-amber)" fillOpacity="0.9" />
        <circle cx="128" cy="125" r="58" fill="var(--color-leaf)" fillOpacity="0.75" />
      </svg>
      <div className="relative max-w-[70%]">
        <p className="text-base font-medium text-cream/80">Horta do</p>
        <h1 className={cn("font-display font-bold text-cream", compact ? "text-3xl" : "text-4xl")}>
          {producer.name}
        </h1>
        <p className="mt-1 inline-flex items-center gap-1.5 text-base text-cream/85">
          <MapPin className="size-4" aria-hidden="true" />
          {producer.city}
        </p>
        {!compact ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber px-4 py-1.5 text-[15px] font-bold text-forest">
            <Truck className="size-4" aria-hidden="true" />
            Entrega amanhã
          </p>
        ) : null}
      </div>
      {children ? <div className="relative mt-6">{children}</div> : null}
    </header>
  );
}
