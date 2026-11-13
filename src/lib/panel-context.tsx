import * as React from "react";

import { loadState, saveState, type PanelState } from "@/lib/producer";

interface PanelCtx {
  state: PanelState;
  update: (fn: (s: PanelState) => PanelState) => void;
}

const Ctx = React.createContext<PanelCtx | null>(null);

/** Client-only (routes using it set ssr: false), so reading storage in the initializer is safe. */
export function PanelProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<PanelState>(() => loadState());
  React.useEffect(() => saveState(state), [state]);
  const value = React.useMemo(() => ({ state, update: setState }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePanel(): PanelCtx {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("usePanel must be used inside PanelProvider");
  return v;
}
