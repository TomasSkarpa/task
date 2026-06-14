---
name: close-day
description: >-
  Closes a calendar day on task.skarpa.dev via POST /api/day/close (Vercel Blob).
  Open tasks spill to the next day. Use when the user runs /close-day, asks to
  close today, end the day, or roll tasks to tomorrow.
disable-model-invocation: true
---

# Close day

Close today (or a given date) via the live API. Do **not** edit JSON files.

## Before you start

1. Read `src/lib/server/day-store.ts` (`closeDay`, spillover rules)
2. Read `data/schema/day.schema.json`
3. Date defaults to today (`Europe/Prague`) unless user specifies `YYYY-MM-DD`

## Close via API

Base URL: `https://task.skarpa.dev` (or `http://localhost:5173` when testing locally with `vercel env pull`)

```bash
curl -sS -X POST https://task.skarpa.dev/api/day/close \
  -H 'content-type: application/json' \
  -d '{"date":"YYYY-MM-DD"}'
```

Response shape:

```json
{
  "closed": { "date": "...", "status": "closed", "tasks": [] },
  "next": { "date": "...", "tasks": [] }
}
```

`next` is `null` when there were no open tasks to spill.

## Algorithm (implemented in day-store.ts)

1. Load day from Blob
2. If already `closed`, report and stop
3. Collect tasks where `status === 'open'`
4. Set `status: closed`, `closedAt` (ISO now), `closedBy: manual` (or `auto` if user says auto/cron)
5. Save closed day to Blob
6. If no open tasks, stop
7. Copy each open task to next calendar day as carryover (`source: carryover`, `carriedFrom: closed date`)
8. Merge by `jiraKey` or `id` on target day (no duplicates)
9. Save next day to Blob

## After close

Report:

- Closed date
- Count spilled (from `next.tasks` length or diff)
- Next date if spillover happened
- Link to [task.skarpa.dev](https://task.skarpa.dev/)

## Auto close

On the first request after the calendar day changes (`Europe/Prague`), the server closes any still-open days before today (oldest first) with `closedBy: auto` and the same spillover rules. Triggered from `loadDay(today)` and `loadDaySummaries()` in `day-store.ts`.

Manual close via API still uses `closedBy: manual`.
