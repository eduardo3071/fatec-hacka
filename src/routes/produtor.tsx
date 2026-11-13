import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PanelProvider } from "@/lib/panel-context";

export const Route = createFileRoute("/produtor")({
  // Sample data lives on the device until real login exists, so these screens render in the browser only.
  ssr: false,
  component: () => (
    <PanelProvider>
      <Outlet />
    </PanelProvider>
  ),
});
