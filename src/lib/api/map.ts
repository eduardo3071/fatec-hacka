import type { Unit } from "@/lib/mock";
import type { ApiUnit } from "./types";

const TO_API: Record<Unit, ApiUnit> = { maço: "maco", dúzia: "duzia", kg: "kg", unidade: "unidade", caixa: "caixa", engradado: "engradado" };
const FROM_API: Record<string, Unit> = { maco: "maço", duzia: "dúzia", kg: "kg", unidade: "unidade", caixa: "caixa", engradado: "engradado" };

export const unitToApi = (u: Unit): ApiUnit => TO_API[u];
export const unitFromApi = (u: string): Unit => FROM_API[u] ?? "unidade";

const GLYPHS: [RegExp, string][] = [
  [/alface/i, "🥬"], [/couve/i, "🥗"], [/br[oó]colis/i, "🥦"], [/cenoura/i, "🥕"], [/r[uú]cula|espinafre|salsa|cheiro/i, "🌿"],
  [/tomate/i, "🍅"], [/ovo/i, "🥚"], [/batata/i, "🥔"], [/cebola/i, "🧅"], [/piment/i, "🫑"], [/milho/i, "🌽"], [/abobrinha|pepino/i, "🥒"],
];
export function glyphFor(name: string): string {
  return GLYPHS.find(([re]) => re.test(name))?.[1] ?? "🌱";
}

/** "HH:MM:SS" → "HH:MM". */
export const hhmm = (t: string) => t.slice(0, 5);

export function getDeviceId(): string {
  const KEY = "cc:device";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
