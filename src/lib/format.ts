import { parseISO } from "date-fns";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const clock = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

/** "R$ 1.234,56" */
export function formatMoney(value: number): string {
  return money.format(value);
}

const PLURALS: Record<string, string> = {
  maço: "maços",
  unidade: "unidades",
  kg: "kg",
  dúzia: "dúzias",
};

/** "1 maço", "35 maços", "3 kg" */
export function formatQty(quantity: number, unit: string): string {
  const label = quantity === 1 ? unit : (PLURALS[unit] ?? `${unit}s`);
  return `${quantity} ${label}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "hoje, 14/11", "amanhã, 14/11", "sáb, 15/11" */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const day = startOfDay(d);
  const diffDays = Math.round((day.getTime() - startOfDay(new Date()).getTime()) / 86_400_000);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const short = `${dd}/${mm}`;

  if (diffDays === 0) return `hoje, ${short}`;
  if (diffDays === 1) return `amanhã, ${short}`;
  return `${weekday.format(d).replace(".", "")}, ${short}`;
}

/** "07:00" */
export function formatTime(time: Date | string): string {
  if (typeof time === "string") return time.slice(0, 5);
  return clock.format(time);
}
