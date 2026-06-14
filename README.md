# task.skarpa.dev

Daily recyclable **tasks**. One day on the homepage. Open tasks spill to tomorrow when you close the day.

## Docs

- **Design directive:** [`design/DIRECTIVE.md`](design/DIRECTIVE.md)
- **Agent routing:** [`AGENTS.md`](AGENTS.md)

## Quick start

```bash
npm install
vercel env pull   # Blob credentials from linked Vercel project
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Day data lives in **Vercel Blob**, not in this repo.

## AI workflows

| Command | Skill |
|---------|-------|
| `/sync-day` | `.cursor/skills/sync-day-from-jira` |
| `/add-task` | `.cursor/skills/add-task` |
| `/fragment-task` | `.cursor/skills/fragment-task` |
| `/close-day` | `.cursor/skills/close-day` |
| `/remove-tasks` | `.cursor/skills/remove-tasks` |
| `/catch-up-from-jira` | `.cursor/skills/catch-up-from-jira` |

Skills mutate data via `https://task.skarpa.dev/api/*` (or localhost when developing).

## Data

```
data/schema/day.schema.json   # JSON shape contract only
```

Runtime storage: `days/YYYY-MM-DD.json` in Vercel Blob.

## Deploy

Target: **task.skarpa.dev** on Vercel.

1. **Storage → Blob store → Connect to project** (adds `BLOB_STORE_ID`)
2. Optional: enable read-write token for local dev, then `vercel env pull`
3. Deploy

| API | Body |
|-----|------|
| `GET /api/day` | optional `?date=YYYY-MM-DD` |
| `GET /api/days` | day summaries for history |
| `POST /api/task/add` | `{ date, text }` |
| `POST /api/task/toggle` | `{ date, taskId }` |
| `POST /api/task/remove` | `{ date, taskId }` or `{ date, taskIds: [] }` |
| `POST /api/task/sync-jira` | `{ date, tasks, replaceAll? }` |
| `POST /api/day/close` | `{ date }` |
