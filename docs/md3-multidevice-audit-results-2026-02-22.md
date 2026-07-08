# MD3 Multi-Device Audit Results

Date: 2026-02-22
Base URL: http://127.0.0.1:4173

- Devices checked: 6
- Flows checked: 60
- Pass: 60
- Fail: 0
- Touch spacing issue flows (warning): 2
- Touch spacing failure flows (critical): 0

## Device Summary

| Device | Viewport | Touch | Pass | Fail | Overflow issues | Touch target issues | Touch spacing issue flows | Touch spacing failure flows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| iPhone SE | 375x667 | Yes | 10 | 0 | 0 | 0 | 1 | 0 |
| iPhone 14 Pro | 393x852 | Yes | 10 | 0 | 0 | 0 | 0 | 0 |
| iPad Mini | 768x1024 | Yes | 10 | 0 | 0 | 0 | 0 | 0 |
| iPad Pro | 1024x1366 | Yes | 10 | 0 | 0 | 0 | 1 | 0 |
| Desktop 1440p | 1440x900 | No | 10 | 0 | 0 | 0 | 0 | 0 |
| Desktop 4K | 3840x2160 | No | 10 | 0 | 0 | 0 | 0 | 0 |

## Failures

| Device | Flow | Route | Overflow | Small touch targets | Touch spacing violations | Icon-only buttons missing label | Focus targets |
| --- | --- | --- | --- | --- | --- | --- | --- |
| None | - | - | - | - | - | - | - |

Notes:
- Touch target checks use a 48x48 CSS px minimum for visible interactive controls.
- Touch spacing checks use a 8px minimum gap. Flows warn when violations exceed 0 and fail touch-device gating only when violations exceed 12.
- Manual visual verification remains required for nuanced readability and UX quality.
