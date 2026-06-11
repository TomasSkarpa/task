# task.skarpa.dev

Daily recyclable **tasks**. One day on the homepage. Open tasks spill to tomorrow when you close the day.

## Docs

- **Design directive:** [`design/DIRECTIVE.md`](design/DIRECTIVE.md)
- **Agent routing:** [`AGENTS.md`](AGENTS.md)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Sample day: `data/days/2026-06-11.json`.

## AI workflows

| Command | Skill |
|---------|-------|
| `/sync-day` | `.cursor/skills/sync-day-from-jira` |
| `/close-day` | `.cursor/skills/close-day` |

Skills edit `data/days/*.json`. The dev server API uses the same spillover logic in `src/lib/server/day-store.ts`.

## Data

```
data/days/YYYY-MM-DD.json   # one day, git-tracked
data/schema/day.schema.json # contract
```

## Deploy

Target: **task.skarpa.dev** on Vercel. v1 persistence is git JSON; API file writes work in local dev. Production may need KV/blob for live toggles later.
