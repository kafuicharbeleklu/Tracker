# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Neemba Tracker — an internal equipment/fleet tracking SPA (React 19 + TypeScript + Vite 6, Tailwind v4 with Material Design 3 tokens). The UI is in French. There is no automated unit/integration test runner; verification is `build` + `lint` + manual smoke test, plus Playwright-driven MD3 QA scripts.

## Commands

```bash
npm run dev              # Vite dev server at http://localhost:3000 (host 0.0.0.0)
npm run build            # Production build to dist/ (base path becomes /Tracker/)
npm run preview          # Serve the production build
npm run backend:agent    # Run the separate Node backend (backend/server.mjs, port 8787)

npm run lint             # ESLint, zero-warnings policy (only lints src/)
npm run lint:fix         # ESLint autofix
npm run format           # Prettier (single quotes, 4-space indent, 100 cols)
npm run md3:check        # MD3 design-token compliance audit
npm run lint:md3         # lint + md3:check together

# Playwright-based QA (require Playwright browsers installed)
npm run qa:a11y:auto     # Accessibility audit  -> docs/md3-a11y-automation-results-*
npm run qa:devices:auto  # Multi-device/breakpoint audit
npm run qa:visual:auto   # Visual regression
npm run qa:visual:update # Refresh visual baselines
```

There is no test runner and no single-test command. To verify a change: `npm run build`, `npm run lint`, then smoke-test affected flows in `npm run dev`.

## Critical conventions

- **Path alias `@` maps to the project ROOT, not `src/`** (`vite.config.ts`, `tsconfig.json`). So `@/src/...` or `@/App`. Most intra-`src` imports are relative, though — match the surrounding file.
- **Prettier**: 4-space indentation, single quotes, semicolons, trailing commas, 100-col width. ESLint runs with `--max-warnings 0`.
- Entry HTML/TS (`index.html`, `index.tsx`, `App.tsx`) live at the repo root, not in `src/`.
- Production build uses `base: '/Tracker/'`; dev uses `/`. Keep asset references base-relative.
- `process.env.API_KEY` / `process.env.GEMINI_API_KEY` are injected at build time from `.env.local` (`GEMINI_API_KEY`). All other runtime config uses `import.meta.env.VITE_*`.

## Architecture

### Routing is custom — NOT React Router
Despite what README.md/AGENTS.md say, **react-router is not a dependency and is not used.** Navigation is a hand-rolled **hash router**:
- `src/hooks/useRouter.ts` reads/writes `window.location.hash` and exposes `routeSegments` + `navigate`.
- `src/hooks/useAppNavigation.ts` maps URL segments ⇆ a `ViewType` string union (defined in `src/types`), with `navigateToView`, `navigateToItem`, `goBack`, and document-title management.
- `src/components/layout/AppLayout.tsx` switches on `currentView` and lazy-loads the matching feature page. Adding a page means: add the `ViewType`, wire it in `useAppNavigation`'s parse + reverse maps, and add the lazy import + case in `AppLayout`.

### Provider tree (order matters — `App.tsx`)
`ToastProvider → AuthProvider → DataProvider → FinanceDataProvider → ConfirmationProvider`. Inner providers depend on outer ones (e.g. `DataContext`/`AuthContext` call `useToast`).

| Context | File | Role |
|---|---|---|
| `ToastContext` | `src/context/ToastContext.tsx` | Toast notifications |
| `AuthContext` | `src/context/AuthContext.tsx` | Session, MSAL + demo login (see Auth) |
| `DataContext` | `src/context/DataContext.tsx` | Core store: users, equipment, approvals, locations, categories/models, RBAC roles/groups/assignments/workflows, settings |
| `FinanceDataContext` | `src/context/FinanceDataContext.tsx` | Finance-domain data (budgets, expenses) |
| `ConfirmationContext` | `src/context/ConfirmationContext.tsx` | Imperative confirm dialogs |

`App.tsx` gates the whole app on auth state: `accessDenied` → AccessDeniedPage, `needsPasswordChange` → ChangePasswordPage, else unauthenticated → LoginPage, else lazy `AppLayout`.

### Data layer is mock + localStorage (no real DB)
`DataContext` seeds from `src/data/mockData.tsx` and persists via `src/lib/persistence.ts` (`getPersistedValue` migrates legacy localStorage keys). Mutations (`addUser`, `updateEquipment`, `deleteEquipment`, approval transitions, etc.) are **gated by business rules** and many return a `BusinessRuleDecision` (`src/lib/businessRules.ts`) rather than throwing — check `.allowed`/`.reason` at call sites.

### Authentication — two paths
`AuthContext` supports:
1. **Real**: Azure AD via MSAL (`@azure/msal-*`, config in `src/lib/authConfig.ts`). After MSAL sign-in it calls `authService.verifyUser(accessToken, email)` (`src/services/authService.ts`), which currently mocks a SharePoint "AppUsers" list but will hit a backend when `VITE_AUTH_API_BASE_URL` is set. Real verification **requires a genuine MSAL access token** (rejects `mock_token`).
2. **Demo/dev**: `login(email)` matches `mockAllUsersExtended`, gated by `DEMO_LOGIN_ENABLED` (`import.meta.env.DEV || VITE_ENABLE_DEMO_LOGIN === 'true'`).

`authService` admin methods (create/reset-password/reset-pin/status/delete) call the backend when `VITE_AUTH_API_BASE_URL` is set (header `x-admin-key`), else fall back to in-memory mocks; mock fallbacks are gated by `VITE_ENABLE_MOCK_AUTH_BACKEND` / DEV.

### Authorization — two layers
- **Fine-grained RBAC engine** (`src/lib/rbac.ts`): `resolveEffectiveAccess` expands roles (with parent/base closure), groups, temporary roles, and direct permissions into an `EffectiveAccessProfile`. Resolution priority is `user_direct > group > role`, **deny wins** over allow, then higher access level wins. Defaults live in `src/config/rbacDefaults.ts`. Consume via the `useAccessControl` hook → `permissions.*` booleans (used by `AppLayout` to gate nav/pages).
- **Coarse role gates** (`src/lib/businessRules.ts`): `canManageInventoryByRole`, `canTransitionApprovalStatus`, etc., used inside `DataContext` mutations.

### Feature modules
`src/features/<domain>/{pages,components}/` — domains: `auth`, `dashboard`, `inventory`, `users`, `approvals`, `finance`, `audit`, `locations`, `management` (categories/models/settings/RBAC), `admin`. Shared UI primitives are in `src/components/ui/` — **reuse these before creating new ones**. Layout/app-shell pieces (Sidebar, NavigationBar/Rail, TopAppBar, BottomAppBar) are in `src/components/layout/`; responsive shell selection is driven by `useMediaQuery` breakpoints in `AppLayout`.

### Heavy client-side document processing
Finance/audit flows run OCR and document parsing entirely in the browser: `tesseract.js` (OCR), `pdfjs-dist` (PDF text), `xlsx`, `jspdf` + `jspdf-autotable` (export). The extraction/business logic lives in `src/lib/` (`documentTextExtraction`, `budgetExtraction`, `expenseExtraction`, `financeExtractionRules`, `auditQr`, `csv`). Each heavy lib is split into its own Vite chunk (`vite.config.ts` `manualChunks`).

### Backend (separate, optional)
`backend/server.mjs` is a standalone lightweight Node HTTP server (no framework) for machine-agent check-ins and auth admin (`/api/agent/checkin`, `/api/auth/*`). It persists JSONL/JSON files under `backend/data/`. Defaults: port 8787, API keys `NEEMBA_AGENT_KEY` / `NEEMBA_ADMIN_KEY`. See `backend/README.md`. The SPA works fully without it (mock fallbacks).

## Design system (MD3)
Material Design 3 tokens are CSS custom properties defined in `index.css` via Tailwind v4's `@theme`. Use semantic token classes (`primary`, `on-surface`, `shadow-elevation-*`, MD3 easing) rather than raw colors. `npm run md3:check` enforces token compliance; `src/lib/md3Theme.ts` applies dynamic theming. Compliance/audit docs are under `docs/md3-*`.

## When editing
- Keep changes scoped to one feature/domain; keep domain types in `src/types` and update all call sites in the same change.
- Conventional Commits (`feat(inventory): ...`, `fix(auth): ...`).
- If you touch routing, update `useAppNavigation` parse + reverse maps **and** the `AppLayout` switch together.
- README.md and AGENTS.md are the human-facing docs but are partly stale (they list React Router and omit `FinanceDataContext`); trust the code.
