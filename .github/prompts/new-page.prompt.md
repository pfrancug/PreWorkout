---
description: 'Scaffold a new route page with correct imports, i18n, routing, and sidebar entry'
agent: 'agent'
argument-hint: "Page name and route path, e.g. 'StatsPage at /stats'"
---

Create a new page for this React SPA. Follow these steps:

1. **Create the page component** in `src/pages/` using this pattern:
   - Arrow function component (no default export — use named export)
   - `useTranslation()` hook for all user-facing strings
   - Path aliases and named imports only (no namespace/wildcard imports)
   - Wrap content in a container with consistent page padding
   - Keep the page file focused — extract sub-components into separate files, types into `src/types/` (use existing domain file or create a new one), hooks into `src/hooks/`, and constants into `src/constants/`

2. **Register the route** in [src/App.tsx](../../src/App.tsx):
   - Add a `<Route>` element in the authenticated routes section
   - Add the route to the `pageTitleKeys` map with the matching i18n key
   - Use `<TrainerRoute>` wrapper if the page is trainer-only

3. **Add sidebar navigation** in [src/components/AppSidebar.tsx](../../src/components/AppSidebar.tsx):
   - Add the page to the appropriate nav group
   - Use a lucide-react icon

4. **Add i18n keys** in both locale files:
   - [src/i18n/locales/en/](../../src/i18n/locales/en/) — add to the relevant JSON file
   - [src/i18n/locales/pl/](../../src/i18n/locales/pl/) — add matching Polish translations

Follow the code style in [.github/copilot-instructions.md](../copilot-instructions.md).
