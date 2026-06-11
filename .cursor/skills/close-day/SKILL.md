---
name: close-day
description: >-
  Closes a calendar day for task.skarpa.dev, marks data/days/YYYY-MM-DD.json as
  closed, and spills open tasks to the next day. Mirrors closeDay() in
  day-store.ts. Use when the user runs /close-day, asks to close today, end the
  day, or roll tasks to tomorrow.
disable-model-invocation: true
---

# Close day

Close a day file and spill open tasks to the next calendar day.

## Before you start

1. Read `src/lib/server/day-store.ts` (`closeDay`, `upsertCarryoverTasks`, `nextDateString`)
2. Read `data/schema/day.schema.json`
3. Date defaults to today (`Europe/Prague`) unless user specifies `YYYY-MM-DD`

## Algorithm (must match day-store.ts)

1. Load `data/days/<date>.json`
2. If `status` is already `closed`, report and stop
3. Collect tasks where `status === 'open'`
4. Set on current day:
   - `status: "closed"`
   - `closedAt`: ISO timestamp (now)
   - `closedBy`: `"manual"` (or `"auto"` if user says auto/midnight/cron)
5. Save current day
6. If no open tasks, stop
7. Load or create `data/days/<next-date>.json` (next date = date + 1 day)
8. For each open task, add carryover row:
   - `id`: `jira-<key>` if jiraKey, else `carry-<date>-<original-id>`
   - `text`: same as source task
   - `status`: `open`
   - `source`: `carryover`
   - `jiraKey`: copied
   - `carriedFrom`: closed date
   - `sort`: 0..n in spill order
9. Merge by `jiraKey` or `id` on target day (no duplicates)
10. Save next day

## After close

Report:

- Closed date
- Count spilled
- Next date file updated
- Remind user closed homepage shows **Day is closed**

## Auto close (optional cron)

Same algorithm with `closedBy: "auto"`. Typically run at 00:00 `Europe/Prague` via CI or local cron calling this skill.
