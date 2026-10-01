# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

"Mis Finanzas" is a Spanish-language personal income/expense tracker. It uses React 19 + Vite (plain JSX, no TypeScript), Tailwind CSS v4, Recharts, and Supabase (Postgres + Auth) as the backend. There is no custom server: the browser talks to Supabase directly, and security is enforced in the database. UI text, code comments and the README are in Spanish; keep new user-facing strings in Spanish.

## Commands

- `npm run dev` — starts the Vite dev server on http://localhost:5173. That URL is configured as the Supabase auth Site/Redirect URL. Add `-- --host` to reach it from other devices on the LAN.
- `npm run build` — production build to `dist/`
- `npm run lint` — oxlint (config in `.oxlintrc.json`)

There is no test suite. Verification so far has been done ad hoc:
- puppeteer-core driving the locally installed Chrome against the dev server;
- scripts that call `@supabase/supabase-js` directly to check RLS.

Environment: `.env.local` (gitignored via `*.local`) must define two variables. The template is `.env.example`.
- `VITE_SUPABASE_URL` — the project base URL, without `/rest/v1/`.
- `VITE_SUPABASE_PUBLISHABLE_KEY`.

If either is missing, the app renders `SetupScreen` instead of crashing.

## Database (Supabase)

The schema lives only in `supabase/migrations/*.sql`. The hosted project was set up by pasting the migration into the dashboard SQL Editor; `npx supabase link` + `db push` also works, since the CLI is a devDependency. `supabase/config.toml` is only for an optional local Docker stack.

Rules enforced in SQL that the frontend relies on:
- **RLS** on `categories` and `transactions`: each user only sees rows where `user_id = auth.uid()`. `user_id` defaults to `auth.uid()`.
- **Column-level grants**: clients may only insert/update the business columns. They cannot set `user_id` or `system_key`, and they cannot change a category's `type` after creation. Inserts and updates must send only those columns.
- **Composite FK** `(category_id, user_id, type)` → `categories(id, user_id, type)`: a transaction's category must belong to the same user and have the same type.
- **Default categories**: every new `auth.users` row gets 12 categories from the `seed_default_categories` trigger. Two of them carry a `system_key` (`other-expense` / `other-income`) and are protected.
- **Category deletion**: a `BEFORE DELETE` trigger on `categories` moves that category's transactions to the matching protected "Otros" category. It refuses to delete a protected category, except during cascading deletes when a user is removed (detected with `pg_trigger_depth()`).
- **Migrations**: put schema changes in a **new** migration file. Never edit the one already applied.

## Frontend architecture

Provider chain (`src/main.jsx` → `src/Root.jsx`):
1. `Root` shows `SetupScreen` if the env vars are missing; otherwise it wraps everything in `AuthProvider`.
2. `Gate` then picks the screen, in this order:
   - a splash while auth is loading;
   - `NewPasswordScreen` after a `PASSWORD_RECOVERY` event;
   - `AuthScreen` when there is no session;
   - otherwise `<FinanceProvider key={user.id}>` around `<App/>`. The `key` resets all data state when the user changes.

Contexts are split so Fast Refresh works (lint rule `only-export-components`):
- `context/auth.js` and `context/finance.js` hold the context object, the `use…` hook and pure helpers.
- `AuthContext.jsx` and `FinanceContext.jsx` hold only the provider component.
- Follow the same split for any new context. Put shared constants in `.js` files, not next to components (e.g. `components/layout/tabs.js`, `utils/filters.js`).

Data flow (`FinanceContext.jsx` + `finance.js`):
- **Writes go to Supabase first.** The state is a local copy of the DB, held in `useReducer`. Every mutation (`addTransaction`, `deleteCategory`, …) is async: it writes to Supabase, `.select()`s the row back, and only then dispatches to the reducer.
- **Errors are already in Spanish.** Failed mutations throw an `Error` whose message comes from `describeError` in `lib/supabase.js`. The UI shows it inline: forms use React 19 `useActionState`, and `ConfirmDialog` accepts an async `onConfirm`.
- **Convert row shapes.** DB rows are snake_case and app objects are camelCase. Always convert with `fromTransactionRow` / `toTransactionRow` / `fromCategoryRow`. Identify protected categories by `category.systemKey`, never by id.
- **Cross-device sync.** There is no realtime subscription. `FinanceProvider` re-runs `load()` on `visibilitychange` and `online`.
- **localStorage holds only the theme** (`finanzas:theme`). An inline script in `index.html` also reads it, to avoid a flash of the wrong theme. The old local-data key `finanzas:v1` is deliberately removed on startup.

UI (`src/App.jsx`):
- It is a single component with tab state instead of a router. The tabs are Resumen / Movimientos / Estadísticas / Categorías.
- Navigation is a top bar from `md` up. Below `md` it is a fixed bottom bar plus a floating "+" button.
- The Movimientos tab has its own `filters` state. The Estadísticas tab has a separate `statsRange` with dates only. Both apply `utils/stats.js#filterTransactions`.
- `StatsView` is loaded with `React.lazy`, so Recharts is only downloaded when that tab opens.

Styling and formatting:
- **Tailwind v4** is configured in CSS (`src/index.css`); there is no JS config file. Dark mode is class-based (`@custom-variant dark`). Reusable `.card`, `.input` and `.label` classes are defined there.
- **Modals** use the native `<dialog>` element (`components/ui/Modal.jsx`).
- **Colors** are validated as color-blind safe:
  - Income is blue and expense is red/rose, everywhere.
  - Category colors come from the fixed palette in `data/defaultCategories.js`, and `themedColor()` maps each one to its dark-mode variant.
- **Money** is formatted with `utils/format.js#formatCurrency` (es-ES, EUR, `useGrouping: 'always'`).
- **Dates** are stored as `YYYY-MM-DD` strings in local time. Use `toISODate` / `parseISODate`, never `new Date(str)`.
