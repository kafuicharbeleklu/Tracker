# MD3 Visual Regression Results

Date: 2026-07-11
Base URL: http://127.0.0.1:4173
Mode: Update baseline

- Checkpoints: 6
- Match: 3
- Baseline created: 0
- Baseline updated: 3
- Changed (regressions): 0
- Pass: 6
- Fail: 0

| Device | Checkpoint | Route | Status | Baseline | Current |
| --- | --- | --- | --- | --- | --- |
| Compact (iPhone 14 Pro) | Login | `/` | match | `docs/md3-visual-baseline/compact/login.png` | - |
| Compact (iPhone 14 Pro) | Approvals | `/approvals` | updated | `docs/md3-visual-baseline/compact/approvals.png` | `docs/md3-visual-current/2026-07-11/compact/approvals.png` |
| Medium (iPad Mini) | Login | `/` | match | `docs/md3-visual-baseline/medium/login.png` | - |
| Medium (iPad Mini) | Approvals | `/approvals` | updated | `docs/md3-visual-baseline/medium/approvals.png` | `docs/md3-visual-current/2026-07-11/medium/approvals.png` |
| Expanded (Desktop 1440p) | Login | `/` | match | `docs/md3-visual-baseline/expanded/login.png` | - |
| Expanded (Desktop 1440p) | Approvals | `/approvals` | updated | `docs/md3-visual-baseline/expanded/approvals.png` | `docs/md3-visual-current/2026-07-11/expanded/approvals.png` |

Notes:
- Baselines are stored in `docs/md3-visual-baseline/`.
- Current run captures (new/updated/changed) are stored in `docs/md3-visual-current/<date>/`.
- Use `npm run qa:visual:update` to accept intentional UI changes.
