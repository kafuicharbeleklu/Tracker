# MD3 A11Y Automation Results

Date: 2026-07-22
Base URL: http://127.0.0.1:4173

- Flows checked: 16
- Pass: 16
- Fail: 0

| Flow | Route | Interactive controls | Icon-only buttons missing label | Unique focus targets (Tab probe) | Visible focus detected | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Login | `/#/` | 9 | 0 | 10 | Yes | Pass |
| Dashboard | `/dashboard` | 26 | 0 | 12 | Yes | Pass |
| Approvals | `/approvals` | 20 | 0 | 12 | Yes | Pass |
| Locations | `/locations` | 42 | 0 | 12 | Yes | Pass |
| Management catalog | `/management` | 37 | 0 | 9 | Yes | Pass |
| Reports | `/reports` | 21 | 0 | 6 | Yes | Pass |
| Settings | `/settings` | 17 | 0 | 12 | Yes | Pass |
| Assignment wizard | `/wizards/assignment` | 20 | 0 | 12 | Yes | Pass |
| Return wizard | `/wizards/return` | 24 | 0 | 12 | Yes | Pass |
| User details | `/users/1` | 22 | 0 | 12 | Yes | Pass |
| Add equipment | `/inventory/add` | 31 | 0 | 12 | Yes | Pass |
| Audit details | `/audit/details` | 26 | 0 | 12 | Yes | Pass |
| Category details | `/management/categories/1` | 15 | 0 | 12 | Yes | Pass |
| Import locations | `/locations/import` | 16 | 0 | 12 | Yes | Pass |
| Import models | `/management/models/import` | 16 | 0 | 12 | Yes | Pass |
| Finance | `/finance` | 15 | 0 | 12 | Yes | Pass |

Notes:
- This run validates keyboard/focus smoke and accessible naming heuristics.
- Screen-reader narration quality and business-rule error semantics still require human manual sign-off.
