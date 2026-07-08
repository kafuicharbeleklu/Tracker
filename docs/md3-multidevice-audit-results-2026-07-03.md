# MD3 Multi-Device Audit Results

Date: 2026-07-03
Base URL: http://127.0.0.1:4173

- Devices checked: 6
- Flows checked: 90
- Pass: 30
- Fail: 60
- Touch spacing issue flows (warning): 67
- Touch spacing failure flows (critical): 12

## Device Summary

| Device | Viewport | Touch | Pass | Fail | Overflow issues | Touch target issues | Touch spacing issue flows | Touch spacing failure flows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | 375x667 | Yes | 0 | 15 | 0 | 15 | 7 | 0 |
| iPhone 14 Pro | 393x852 | Yes | 0 | 15 | 0 | 15 | 7 | 0 |
| iPad Mini | 768x1024 | Yes | 0 | 15 | 0 | 15 | 8 | 0 |
| iPad Pro | 1024x1366 | Yes | 0 | 15 | 0 | 15 | 15 | 4 |
| Desktop 1440p | 1440x900 | No | 15 | 0 | 0 | 15 | 15 | 4 |
| Desktop 4K | 3840x2160 | No | 15 | 0 | 0 | 15 | 15 | 4 |

## Failures

| Device | Flow | Route | Overflow | Small touch targets | Touch spacing violations | Icon-only buttons missing label | Focus targets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | Dashboard | `/dashboard` | No | 2 | 0 | 0 | 10 |
| iPhone SE | Approvals | `/approvals` | No | 7 | 1 | 0 | 9 |
| iPhone SE | Locations | `/locations` | No | 15 | 10 | 0 | 10 |
| iPhone SE | Management catalog | `/management` | No | 9 | 5 | 0 | 5 |
| iPhone SE | Reports | `/reports` | No | 4 | 0 | 0 | 4 |
| iPhone SE | Settings | `/settings` | No | 3 | 0 | 0 | 10 |
| iPhone SE | Assignment wizard | `/wizards/assignment` | No | 3 | 0 | 0 | 9 |
| iPhone SE | Return wizard | `/wizards/return` | No | 3 | 0 | 0 | 10 |
| iPhone SE | User details | `/users/1` | No | 7 | 1 | 0 | 10 |
| iPhone SE | Add equipment | `/inventory/add` | No | 7 | 0 | 0 | 10 |
| iPhone SE | Audit details | `/audit/details` | No | 12 | 3 | 0 | 10 |
| iPhone SE | Category details | `/management/categories/1` | No | 4 | 1 | 0 | 10 |
| iPhone SE | Import locations | `/locations/import` | No | 2 | 0 | 0 | 9 |
| iPhone SE | Import models | `/management/models/import` | No | 2 | 0 | 0 | 10 |
| iPhone SE | Finance | `/finance` | No | 3 | 2 | 0 | 10 |
| iPhone 14 Pro | Dashboard | `/dashboard` | No | 3 | 0 | 0 | 10 |
| iPhone 14 Pro | Approvals | `/approvals` | No | 7 | 1 | 0 | 9 |
| iPhone 14 Pro | Locations | `/locations` | No | 15 | 8 | 0 | 10 |
| iPhone 14 Pro | Management catalog | `/management` | No | 11 | 6 | 0 | 5 |
| iPhone 14 Pro | Reports | `/reports` | No | 6 | 0 | 0 | 4 |
| iPhone 14 Pro | Settings | `/settings` | No | 3 | 0 | 0 | 10 |
| iPhone 14 Pro | Assignment wizard | `/wizards/assignment` | No | 3 | 0 | 0 | 9 |
| iPhone 14 Pro | Return wizard | `/wizards/return` | No | 7 | 0 | 0 | 10 |
| iPhone 14 Pro | User details | `/users/1` | No | 7 | 1 | 0 | 10 |
| iPhone 14 Pro | Add equipment | `/inventory/add` | No | 8 | 0 | 0 | 10 |
| iPhone 14 Pro | Audit details | `/audit/details` | No | 12 | 3 | 0 | 10 |
| iPhone 14 Pro | Category details | `/management/categories/1` | No | 4 | 1 | 0 | 10 |
| iPhone 14 Pro | Import locations | `/locations/import` | No | 2 | 0 | 0 | 9 |
| iPhone 14 Pro | Import models | `/management/models/import` | No | 2 | 0 | 0 | 10 |
| iPhone 14 Pro | Finance | `/finance` | No | 3 | 2 | 0 | 10 |
| iPad Mini | Dashboard | `/dashboard` | No | 2 | 3 | 0 | 10 |
| iPad Mini | Approvals | `/approvals` | No | 9 | 2 | 0 | 10 |
| iPad Mini | Locations | `/locations` | No | 25 | 9 | 0 | 8 |
| iPad Mini | Management catalog | `/management` | No | 20 | 8 | 0 | 9 |
| iPad Mini | Reports | `/reports` | No | 9 | 0 | 0 | 4 |
| iPad Mini | Settings | `/settings` | No | 6 | 0 | 0 | 10 |
| iPad Mini | Assignment wizard | `/wizards/assignment` | No | 3 | 0 | 0 | 10 |
| iPad Mini | Return wizard | `/wizards/return` | No | 7 | 0 | 0 | 10 |
| iPad Mini | User details | `/users/1` | No | 8 | 2 | 0 | 10 |
| iPad Mini | Add equipment | `/inventory/add` | No | 14 | 0 | 0 | 10 |
| iPad Mini | Audit details | `/audit/details` | No | 13 | 4 | 0 | 10 |
| iPad Mini | Category details | `/management/categories/1` | No | 4 | 1 | 0 | 10 |
| iPad Mini | Import locations | `/locations/import` | No | 2 | 0 | 0 | 9 |
| iPad Mini | Import models | `/management/models/import` | No | 2 | 0 | 0 | 10 |
| iPad Mini | Finance | `/finance` | No | 5 | 3 | 0 | 10 |
| iPad Pro | Dashboard | `/dashboard` | No | 15 | 13 | 0 | 10 |
| iPad Pro | Approvals | `/approvals` | No | 20 | 10 | 0 | 9 |
| iPad Pro | Locations | `/locations` | No | 42 | 22 | 0 | 8 |
| iPad Pro | Management catalog | `/management` | No | 35 | 18 | 0 | 9 |
| iPad Pro | Reports | `/reports` | No | 20 | 9 | 0 | 4 |
| iPad Pro | Settings | `/settings` | No | 17 | 9 | 0 | 10 |
| iPad Pro | Assignment wizard | `/wizards/assignment` | No | 14 | 11 | 0 | 10 |
| iPad Pro | Return wizard | `/wizards/return` | No | 18 | 12 | 0 | 10 |
| iPad Pro | User details | `/users/1` | No | 21 | 10 | 0 | 9 |
| iPad Pro | Add equipment | `/inventory/add` | No | 28 | 9 | 0 | 9 |
| iPad Pro | Audit details | `/audit/details` | No | 24 | 13 | 0 | 10 |
| iPad Pro | Category details | `/management/categories/1` | No | 15 | 10 | 0 | 10 |
| iPad Pro | Import locations | `/locations/import` | No | 13 | 9 | 0 | 10 |
| iPad Pro | Import models | `/management/models/import` | No | 13 | 9 | 0 | 10 |
| iPad Pro | Finance | `/finance` | No | 16 | 11 | 0 | 10 |

Notes:
- Touch target checks use a 48x48 CSS px minimum for visible interactive controls.
- Touch spacing checks use a 8px minimum gap. Flows warn when violations exceed 0 and fail touch-device gating only when violations exceed 12.
- Manual visual verification remains required for nuanced readability and UX quality.
