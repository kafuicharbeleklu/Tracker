# Neemba Tracker — Repository Guidelines

> Internal equipment & fleet tracking SPA for Neemba.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 (functional components) |
| Language | TypeScript 5.8 |
| Bundler | Vite 6 (`vite.config.ts`) |
| Styling | Tailwind CSS v4 + Material Design 3 tokens in `index.css` |
| Auth | Azure AD via MSAL (`@azure/msal-browser`, `@azure/msal-react`) |
| Routing | React Router v7 |
| PDF Export | jsPDF + jspdf-autotable |
| Linting | ESLint 10 (flat config) + Prettier |

## Project Structure

```
neemba-tracker-login/
├── index.html              # HTML entry point
├── index.tsx               # React root mount
├── index.css               # Global styles & MD3 design tokens
├── App.tsx                 # Router & auth provider shell
├── vite.config.ts          # Vite config (port 3000, path aliases, chunk splitting)
├── tailwind.config.js      # Tailwind v4 config
├── eslint.config.js        # ESLint flat config
├── .prettierrc             # Prettier config
├── .env.local              # Environment variables (GEMINI_API_KEY)
├── backend/                # Backend utilities (if applicable)
├── docs/                   # MD3 audit reports, checklists, and QA results
├── scripts/                # QA automation scripts (a11y, visual regression, multi-device)
└── src/
    ├── assets/             # Static assets (images, icons)
    ├── components/
    │   ├── layout/         # App shell: Sidebar, Header, MainContent, etc.
    │   ├── modals/         # Shared modal components
    │   ├── security/       # Auth guards, protected routes
    │   └── ui/             # Reusable UI primitives (buttons, cards, inputs, badges, etc.)
    ├── config/             # App-level configuration
    ├── constants/          # Enums, magic strings, lookup tables
    ├── context/            # React Contexts (see State Management below)
    ├── data/               # Mock data for development
    ├── features/           # Feature modules (see Feature Domains below)
    ├── hooks/              # Custom React hooks (useDebounce, etc.)
    ├── lib/                # Utility libraries (authConfig, helpers, formatters)
    ├── routes/             # Route definitions
    ├── services/           # API service layer
    └── types/              # Shared TypeScript type definitions
```

## Feature Domains

Each domain lives in `src/features/<domain>/` and contains `pages/` and optionally `components/`:

| Domain | Description |
|---|---|
| `auth` | Login page, SSO flow |
| `dashboard` | Main dashboard with KPIs, charts, and analytics |
| `inventory` | Equipment list, details, assignment management |
| `users` | User directory and profile pages |
| `reports` | Report generation and export |
| `finance` | Financial tracking and cost analysis |
| `audit` | Audit trail and activity logs |
| `approvals` | Approval workflows |
| `locations` | Site/location management |
| `management` | Admin management views |

## State Management

Four React Contexts power the application state:

| Context | File | Purpose |
|---|---|---|
| `AuthContext` | `src/context/AuthContext.tsx` | MSAL authentication state, user session |
| `DataContext` | `src/context/DataContext.tsx` | Core data store (equipment, users, locations) |
| `ConfirmationContext` | `src/context/ConfirmationContext.tsx` | Confirmation dialogs |
| `ToastContext` | `src/context/ToastContext.tsx` | Toast notifications |

## Authentication

- **Provider**: Azure Active Directory via MSAL.
- **Config file**: `src/lib/authConfig.ts`.
- **Client ID**: `4ba52933-88c9-43df-beb3-10d361730df1`.
- **Authority**: `https://login.microsoftonline.com/common` (multi-tenant).
- **Scopes**: `User.Read` (Microsoft Graph).
- **Cache**: `sessionStorage`.

## Design System (Material Design 3)

- MD3 design tokens are defined as CSS custom properties inside `index.css` via the `@theme` directive.
- Color palette: primary (green), secondary, tertiary, error, surface, and on-* variants.
- Elevation tokens use `shadow-elevation-*` classes.
- Easing defaults to MD3 emphasized curves.
- Full MD3 compliance docs live in `docs/md3-*.md`.

## Build, Dev & QA Commands

```bash
# Development
npm install                  # Install dependencies (use --legacy-peer-deps if needed)
npm run dev                  # Start Vite dev server at http://localhost:3000

# Production
npm run build                # Build production bundle to dist/
npm run preview              # Serve production build locally

# Code Quality
npm run lint                 # ESLint check (zero warnings policy)
npm run lint:fix             # Auto-fix lint issues
npm run format               # Prettier formatting

# Tracker DS Quality Assurance
npm run ds:check             # Check Tracker DS compliance (whole of src/**)
npm run lint:ds              # Lint + all Tracker DS guards
npm run qa:a11y:auto         # Run automated accessibility audit
npm run qa:devices:auto      # Run multi-device breakpoint audit
npm run qa:visual:auto       # Run visual regression tests
npm run qa:visual:update     # Update visual regression baselines
```

## Environment Variables

Create a `.env.local` file at the project root:

```
GEMINI_API_KEY=your_api_key_here
```

Vite exposes this as `process.env.GEMINI_API_KEY` at build time (see `vite.config.ts`).

## Coding Conventions

- **Components**: PascalCase files and names (e.g., `LoginPage.tsx`).
- **Hooks**: camelCase with `use` prefix (e.g., `useDebounce.ts`).
- **Path alias**: `@/*` maps to the project root (configured in `tsconfig.json` and `vite.config.ts`).
- **Formatting**: Prettier enforces single quotes, 4-space indentation, trailing commas, 100-char line width.
- **Imports**: Use relative imports within `src/`. Keep imports explicit and grouped.

## Change Workflow

1. **Scope** changes to the relevant feature/module; avoid broad refactors unless required.
2. **Reuse** existing shared UI components from `src/components/ui` before creating new ones.
3. **Keep types** close to their domain and update dependent call sites in the same change.
4. **Run verification** before handoff (`npm run build` + manual smoke test via `npm run dev`).

## Commit & PR Guidelines

Use **Conventional Commits**:

```
feat(auth): add SSO loading state
fix(inventory): prevent empty assignment submission
docs(agents): update project structure section
style(dashboard): align KPI cards to MD3 spacing
```

Pull requests should include:

- What changed and why.
- Linked issue or task ID.
- Screenshots or a short recording for UI updates.
- Verification notes (`npm run build` + manual test scenarios).

## Testing & Verification

- No automated test runner is currently configured.
- **Minimum verification for each change**:
  1. `npm run build` succeeds without errors.
  2. `npm run lint` passes (zero warnings).
  3. Smoke-test affected flows with `npm run dev` (login, navigation, changed screens).
- If adding tests, place them near feature code as `*.test.tsx` with deterministic mock data.
