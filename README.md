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

`/sync-day` proposes grouped tasks in chat; after you confirm, the skill posts to `POST /api/task/sync-jira` on production. Spillover logic lives in `src/lib/server/day-store.ts`.

## Data

```
data/days/YYYY-MM-DD.json   # one day, git-tracked
data/schema/day.schema.json # contract
```

## Deploy

Target: **task.skarpa.dev** on Vercel.

| Environment | Storage |
|-------------|---------|
| Local dev (no token) | `data/days/*.json` on disk |
| Production | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) when `BLOB_READ_WRITE_TOKEN` is set |

1. In the Vercel project: **Storage → Create Blob store → Connect to project**
2. Copy `BLOB_READ_WRITE_TOKEN` into project env vars (and `.env` for local Blob testing)
3. Redeploy

API routes: `POST /api/task/add`, `POST /api/task/toggle`, `POST /api/task/sync-jira`, `POST /api/day/close`
