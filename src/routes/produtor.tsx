import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PanelPending } from "@/components/list-states";
import { PanelProvider } from "@/lib/panel-context";

export const Route = createFileRoute("/produtor")({
  // Sample data lives on the device until real login exists, so these screens render in the browser only.
  ssr: false,
  pendingComponent: PanelPending,
  component: () => (
    <PanelProvider>
      <Outlet />
    </PanelProvider>
  ),
});
