# Neemba Tracker

Internal equipment and fleet tracking single-page application for Neemba.

## Overview

Neemba Tracker is a React + TypeScript web app used to:

- Track equipment and fleet inventory
- Manage assignments, approvals, audits, and locations
- Generate operational and financial reports
- Authenticate users through Azure AD (MSAL SSO)

The UI follows Material Design 3 tokens and patterns, with supporting automated QA scripts for accessibility, visual regression, and multi-device checks.

## Tech Stack

- React 19 (functional components)
- TypeScript 5.8
- Vite 6
- Tailwind CSS v4 + Material Design 3 tokens
- Azure AD auth via `@azure/msal-browser` and `@azure/msal-react`
- React Router v7
- jsPDF + `jspdf-autotable` for export workflows
- ESLint 10 (flat config) + Prettier

## Getting Started

### 1. Install dependencies

```bash
npm install
```

If you hit peer dependency resolution issues:

```bash
npm install --legacy-peer-deps
```

### 2. Configure environment variables

Create `.env.local` at the project root:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the app

```bash
npm run dev
```

Vite serves the app at `http://localhost:3000`.

## Available Scripts

### Development

```bash
npm run dev
npm run backend:agent
```

- `dev`: Start frontend dev server
- `backend:agent`: Run backend helper server (`backend/server.mjs`)

### Build and Preview

```bash
npm run build
npm run preview
```

- `build`: Create production output in `dist/`
- `preview`: Serve the production build locally

### Code Quality

```bash
npm run lint
npm run lint:fix
npm run format
```

- `lint`: ESLint check (zero warnings policy)
- `lint:fix`: Autofix lint issues
- `format`: Prettier formatting

### MD3 and QA Automation

```bash
npm run md3:check
npm run lint:md3
npm run qa:a11y:auto
npm run qa:devices:auto
npm run qa:visual:auto
npm run qa:visual:update
```

- `md3:check`: Material Design 3 token compliance audit
- `lint:md3`: Lint + MD3 compliance check
- `qa:a11y:auto`: Accessibility automation
- `qa:devices:auto`: Breakpoint/device coverage automation
- `qa:visual:auto`: Visual regression checks
- `qa:visual:update`: Refresh visual baselines

## Project Structure

```text
neemba-tracker-login/
├── App.tsx
├── index.tsx
├── index.css
├── vite.config.ts
├── backend/
├── docs/
├── scripts/
└── src/
    ├── components/
    ├── config/
    ├── constants/
    ├── context/
    ├── data/
    ├── features/
    ├── hooks/
    ├── lib/
    ├── routes/
    ├── services/
    └── types/
```

Feature modules are organized under `src/features/<domain>/` (auth, dashboard, inventory, users, reports, finance, audit, approvals, locations, management).

## State and Auth

Primary app state is split across:

- `src/context/AuthContext.tsx`
- `src/context/DataContext.tsx`
- `src/context/ConfirmationContext.tsx`
- `src/context/ToastContext.tsx`

Authentication uses Azure AD with MSAL configuration in `src/lib/authConfig.ts`.

## Design System

Material Design 3 tokens are defined globally in `index.css` (`@theme` + CSS custom properties), including:

- Color roles (`primary`, `secondary`, `tertiary`, `error`, `surface`, `on-*`)
- Elevation/shadow tokens
- Motion/easing defaults

Compliance and audits are documented in `docs/md3-*.md`.

## Verification Workflow

Minimum verification for each change:

1. `npm run build`
2. `npm run lint`
3. Smoke-test affected flows with `npm run dev` (login, navigation, changed pages)

No automated unit/integration test runner is currently configured.

## Contributing Notes

- Keep changes scoped to a feature/domain
- Reuse shared UI components from `src/components/ui` before creating new ones
- Keep domain types close to domain code and update all dependents in the same change
- Use conventional commit messages (for example: `fix(inventory): prevent empty assignment submission`)
