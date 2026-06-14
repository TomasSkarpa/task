# E2E state-bug diagnostics

Playwright suite that records UI timeline, network timing, and API state to diagnose task list state bugs (rapid toggle, rapid remove, reappear flicker, checkbox vs strikethrough mismatch).

## Run against production

```bash
npm install
npx playwright install chromium
npm run test:e2e:state
```

Default base URL: `https://task.skarpa.dev`

Override:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:5173 npm run test:e2e:state
```

Requires `vercel env pull` for local API/Blob access when using localhost.

## What it does

1. Seeds 6 temporary tasks prefixed with `e2e-state` via API
2. Runs scenarios:
   - rapid toggle (5 clicks)
   - rapid remove (5 clicks)
   - add during toggle
   - single toggle visual alignment
   - toggle then remove
3. Polls UI every 200ms during settle window
4. Writes JSON report to `tests/e2e/reports/state-bug-<scenario>-<timestamp>.json`
5. Cleans up e2e tasks in `afterAll`

## Report fields

| Field | Meaning |
|-------|---------|
| `uiTimeline` | Task count, checkbox, strikethrough per snapshot |
| `network` | Request/response timing for `/api/task/*` |
| `reappearEvents` | Task count increased after a decrease (remove flicker) |
| `checkboxMismatchEvents` | Checked state differs from `line-through` class |
| `analysis.uiApiTaskCountMatch` | E2E tasks in UI vs API |
| `analysis.uiApiDoneStateMatch` | Done checkbox matches API `status: done` |

## Notes

- Skips if today is closed
- Only touches tasks containing `e2e-state` in the text
- Reports are gitignored; attach to issues manually
