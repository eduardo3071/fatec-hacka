/**
 * Typed HTTP client for the Colheita Certa API (contract: docs/openapi.json → ./schema.ts).
 * When VITE_API_URL is empty the app keeps running on sample data.
 */
import { supabase } from "@/integrations/supabase/client";

export const API_URL = ((import.meta.env['VITE_API_URL'] as string | undefined) ?? "").replace(/\/+$/, "");
export const apiEnabled = API_URL.length > 0;

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public kind: "http" | "network" = "http",
  ) {
    super(detail);
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface Options {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Query | undefined;
  json?: unknown;
  form?: FormData | undefined;
  auth?: boolean;
  signal?: AbortSignal | undefined;
}

async function bearer(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function detailOf(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const d = (body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return "Confira os dados e tente de novo.";
  }
  return status >= 500 ? "O servidor não respondeu agora. Tente de novo em instantes." : "Não deu certo. Tente de novo.";
}

export async function apiRequest<T>(path: string, opts: Options = {}): Promise<T> {
  if (!apiEnabled) throw new ApiError(0, "API não configurada.", "network");
  const url = new URL(API_URL + path);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v != null && v !== "") url.searchParams.set(k, String(v));
  const headers = new Headers();
  let body: BodyInit | undefined;
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(opts.json);
  } else if (opts.form) body = opts.form;
  if (opts.auth) {
    const token = await bearer();
    if (!token) throw new ApiError(401, "Entre de novo para continuar.");
    headers.set("Authorization", `Bearer ${token}`);
  }
  let res: Response;
  try {
    res = await fetch(url, { method: opts.method ?? "GET", headers, body: body ?? null, signal: opts.signal ?? null });
  } catch {
    throw new ApiError(0, "Sem conexão agora. Mostrando o que estava salvo.", "network");
  }
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!res.ok) throw new ApiError(res.status, detailOf(parsed, res.status));
  return parsed as T;
}
