import { RotateCcw, CloudOff } from "lucide-react";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/** Placeholder rows while a list loads. */
export function ListSkeleton({ rows = 3 }: { rows?: number | undefined }) {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-3xl border-2 border-line bg-paper p-4">
          <Skeleton className="size-16 shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Short, blame-free error card with a retry. */
export function ListError({ onRetry }: { onRetry?: (() => void) | undefined }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-3xl border-2 border-line bg-paper px-6 py-8 text-center">
      <CloudOff className="size-10 text-rust" aria-hidden />
      <div>
        <p className="font-display text-xl font-bold text-forest">Não deu para mostrar agora.</p>
        <p className="mt-1 text-base text-muted-text">Foi um problema do nosso lado. Tente de novo.</p>
      </div>
      <Button variant="outline" onClick={onRetry ?? (() => window.location.reload())}>
        <RotateCcw /> Tentar de novo
      </Button>
    </div>
  );
}

/** Route-level error that keeps the surrounding layout. */
export function RouteListError({ reset }: ErrorComponentProps) {
  return <ListError onRetry={reset} />;
}

export function PanelPending() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="h-[72px] bg-forest" />
      <div className="mx-auto max-w-2xl px-4 pt-6">
        <Skeleton className="mb-6 h-10 w-1/2" />
        <ListSkeleton />
      </div>
    </div>
  );
}
