<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All colors, fonts, radii and shadows come from the tokens in `src/styles.css`; components use semantic token classes, never raw hex or one-off color utilities. Why: the palette is a brand contract and must stay themeable in light and dark.
- Browser-only libraries (vaul/drawer, map/leaflet-style) are lazy-loaded and rendered only after hydration, never imported at module scope of an SSR route. Why: they touch `document` during server render and break the page.
- The buyer flow (`/p/$slug`, `/pedido/$token`) runs only on sample data plus browser storage via `src/lib/buyer.ts`; no network calls. Why: it is a visual prototype until the API exists, and swapping storage for API calls should touch one module.
- The producer panel (`/produtor/*`) keeps sample data in device storage through `src/lib/producer.ts` + `PanelProvider`, and its layout sets `ssr: false`. Why: no login or API yet; calculations (harvest, route, earnings) stay pure so they can move server-side unchanged.
- The service worker comes only from vite-plugin-pwa (generateSW, NetworkFirst pages) and is registered only by `src/lib/pwa.ts`, which refuses dev/preview/iframes; the manifest is hand-written in `public/`. Why: a stray worker in preview serves stale code.
