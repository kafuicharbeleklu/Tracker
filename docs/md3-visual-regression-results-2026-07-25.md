# MD3 Visual Regression Results

Date: 2026-07-25
Base URL: http://127.0.0.1:4173
Mode: Check baseline

- Checkpoints: 39
- Match: 36
- Baseline created: 0
- Baseline updated: 0
- Changed (regressions): 3
- Pass: 36
- Fail: 3

| Device | Checkpoint | Route | Status | Baseline | Current |
| --- | --- | --- | --- | --- | --- |
| Compact (iPhone 14 Pro) | Login | `/` | match | `docs/md3-visual-baseline/compact/login.png` | - |
| Compact (iPhone 14 Pro) | Dashboard | `/dashboard` | changed | `docs/md3-visual-baseline/compact/dashboard.png` | `docs/md3-visual-current/2026-07-25/compact/dashboard.png` |
| Compact (iPhone 14 Pro) | Approvals | `/approvals` | match | `docs/md3-visual-baseline/compact/approvals.png` | - |
| Compact (iPhone 14 Pro) | Locations | `/locations` | match | `docs/md3-visual-baseline/compact/locations.png` | - |
| Compact (iPhone 14 Pro) | Management catalog | `/management` | match | `docs/md3-visual-baseline/compact/management.png` | - |
| Compact (iPhone 14 Pro) | Reports | `/reports` | match | `docs/md3-visual-baseline/compact/reports.png` | - |
| Compact (iPhone 14 Pro) | Settings | `/settings` | match | `docs/md3-visual-baseline/compact/settings.png` | - |
| Compact (iPhone 14 Pro) | Assignment wizard | `/wizards/assignment` | match | `docs/md3-visual-baseline/compact/assignment_wizard.png` | - |
| Compact (iPhone 14 Pro) | Return wizard | `/wizards/return` | match | `docs/md3-visual-baseline/compact/return_wizard.png` | - |
| Compact (iPhone 14 Pro) | Add equipment | `/inventory/add` | match | `docs/md3-visual-baseline/compact/add_equipment.png` | - |
| Compact (iPhone 14 Pro) | User details | `/users/1` | match | `docs/md3-visual-baseline/compact/user_details.png` | - |
| Compact (iPhone 14 Pro) | Audit details | `/audit/details` | match | `docs/md3-visual-baseline/compact/audit_details.png` | - |
| Compact (iPhone 14 Pro) | Finance | `/finance` | match | `docs/md3-visual-baseline/compact/finance.png` | - |
| Medium (iPad Mini) | Login | `/` | match | `docs/md3-visual-baseline/medium/login.png` | - |
| Medium (iPad Mini) | Dashboard | `/dashboard` | changed | `docs/md3-visual-baseline/medium/dashboard.png` | `docs/md3-visual-current/2026-07-25/medium/dashboard.png` |
| Medium (iPad Mini) | Approvals | `/approvals` | match | `docs/md3-visual-baseline/medium/approvals.png` | - |
| Medium (iPad Mini) | Locations | `/locations` | match | `docs/md3-visual-baseline/medium/locations.png` | - |
| Medium (iPad Mini) | Management catalog | `/management` | match | `docs/md3-visual-baseline/medium/management.png` | - |
| Medium (iPad Mini) | Reports | `/reports` | match | `docs/md3-visual-baseline/medium/reports.png` | - |
| Medium (iPad Mini) | Settings | `/settings` | match | `docs/md3-visual-baseline/medium/settings.png` | - |
| Medium (iPad Mini) | Assignment wizard | `/wizards/assignment` | match | `docs/md3-visual-baseline/medium/assignment_wizard.png` | - |
| Medium (iPad Mini) | Return wizard | `/wizards/return` | match | `docs/md3-visual-baseline/medium/return_wizard.png` | - |
| Medium (iPad Mini) | Add equipment | `/inventory/add` | match | `docs/md3-visual-baseline/medium/add_equipment.png` | - |
| Medium (iPad Mini) | User details | `/users/1` | match | `docs/md3-visual-baseline/medium/user_details.png` | - |
| Medium (iPad Mini) | Audit details | `/audit/details` | match | `docs/md3-visual-baseline/medium/audit_details.png` | - |
| Medium (iPad Mini) | Finance | `/finance` | match | `docs/md3-visual-baseline/medium/finance.png` | - |
| Expanded (Desktop 1440p) | Login | `/` | match | `docs/md3-visual-baseline/expanded/login.png` | - |
| Expanded (Desktop 1440p) | Dashboard | `/dashboard` | changed | `docs/md3-visual-baseline/expanded/dashboard.png` | `docs/md3-visual-current/2026-07-25/expanded/dashboard.png` |
| Expanded (Desktop 1440p) | Approvals | `/approvals` | match | `docs/md3-visual-baseline/expanded/approvals.png` | - |
| Expanded (Desktop 1440p) | Locations | `/locations` | match | `docs/md3-visual-baseline/expanded/locations.png` | - |
| Expanded (Desktop 1440p) | Management catalog | `/management` | match | `docs/md3-visual-baseline/expanded/management.png` | - |
| Expanded (Desktop 1440p) | Reports | `/reports` | match | `docs/md3-visual-baseline/expanded/reports.png` | - |
| Expanded (Desktop 1440p) | Settings | `/settings` | match | `docs/md3-visual-baseline/expanded/settings.png` | - |
| Expanded (Desktop 1440p) | Assignment wizard | `/wizards/assignment` | match | `docs/md3-visual-baseline/expanded/assignment_wizard.png` | - |
| Expanded (Desktop 1440p) | Return wizard | `/wizards/return` | match | `docs/md3-visual-baseline/expanded/return_wizard.png` | - |
| Expanded (Desktop 1440p) | Add equipment | `/inventory/add` | match | `docs/md3-visual-baseline/expanded/add_equipment.png` | - |
| Expanded (Desktop 1440p) | User details | `/users/1` | match | `docs/md3-visual-baseline/expanded/user_details.png` | - |
| Expanded (Desktop 1440p) | Audit details | `/audit/details` | match | `docs/md3-visual-baseline/expanded/audit_details.png` | - |
| Expanded (Desktop 1440p) | Finance | `/finance` | match | `docs/md3-visual-baseline/expanded/finance.png` | - |

Notes:
- Baselines are stored in `docs/md3-visual-baseline/`.
- Current run captures (new/updated/changed) are stored in `docs/md3-visual-current/<date>/`.
- Use `npm run qa:visual:update` to accept intentional UI changes.
