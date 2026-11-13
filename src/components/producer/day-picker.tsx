import { useState } from "react";

import { Chip } from "@/components/chip";
import { Input } from "@/components/ui/input";
import { isoDay } from "@/lib/buyer";

export function DayPicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const today = isoDay(0);
  const tomorrow = isoDay(1);
  const [custom, setCustom] = useState(value !== today && value !== tomorrow);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Chip selected={!custom && value === today} onClick={() => { setCustom(false); onChange(today); }}>Hoje</Chip>
        <Chip selected={!custom && value === tomorrow} onClick={() => { setCustom(false); onChange(tomorrow); }}>Amanhã</Chip>
        <Chip selected={custom} onClick={() => setCustom(true)}>Escolher</Chip>
      </div>
      {custom ? (
        <Input
          type="date"
          aria-label="Escolher dia"
          value={value}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          className="h-13 max-w-xs rounded-2xl border-2 border-line bg-paper text-lg"
        />
      ) : null}
    </div>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-3xl font-bold text-forest md:text-4xl">{children}</h1>
      {sub ? <p className="mt-1 text-base text-muted-text">{sub}</p> : null}
    </div>
  );
}
