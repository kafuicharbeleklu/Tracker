# MD3 Breakpoint Smoke Results

Date: 2026-02-16
Base URL: http://127.0.0.1:4177
Scope: dashboard, inventory, users

| Viewport | Route | Bottom nav | Navigation rail | Drawer | Horizontal overflow | Touch targets < 48px |
| --- | --- | --- | --- | --- | --- | --- |
| Compact (393x852) | dashboard | Yes | No | No | No | 0 |
| Compact (393x852) | inventory | Yes | No | No | No | 0 |
| Compact (393x852) | users | Yes | No | No | No | 0 |
| Medium (768x1024) | dashboard | No | Yes | No | No | 0 |
| Medium (768x1024) | inventory | No | Yes | No | No | 0 |
| Medium (768x1024) | users | No | Yes | No | No | 0 |
| Expanded (1024x1366) | dashboard | No | No | Yes | No | 0 |
| Expanded (1024x1366) | inventory | No | No | Yes | No | 0 |
| Expanded (1024x1366) | users | No | No | Yes | No | 0 |

Notes:
- Navigation pattern aligns with MD3 adaptive guidance across tested breakpoints.
- This smoke check validates visible states and target sizes only.
- Full screen-reader narrative quality still needs manual sign-off (NVDA/VoiceOver).
