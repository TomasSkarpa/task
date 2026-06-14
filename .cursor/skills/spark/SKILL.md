---
name: spark
description: >-
  Add one random Spark task to today on task.skarpa.dev via POST /api/task/add-spark.
  Abstract kindness nudges; max one per day. Use when the user runs /spark or asks
  for a Spark task.
disable-model-invocation: true
---

# Spark

Add one random **Spark** task to today (or a given date) via the live API. Do **not** edit JSON files.

Sparks are abstract, person-agnostic nudges. The user chooses who to act on, if anyone.

## Before you start

1. Read `data/schema/day.schema.json` and `src/lib/server/day-store.ts` (`addSparkTask`)
2. Prompt pool: `content/spark/prompts.md` / `src/lib/data/spark-prompts.ts`
3. Date defaults to today (`Europe/Prague`, same as `todayDateString()`)
4. Base URL: `https://task.skarpa.dev` (or `http://localhost:5173` when testing locally)

## Rules

| Rule | Detail |
|------|--------|
| **One per day** | One Spark generation per calendar day (`day.sparkUsed`). Removing the task does not allow another. Second add returns `409`. |
| **No spillover** | Open Sparks do not move to the next day on close. |
| **Abstract only** | Prompts never name a specific person. |

## Triggers

| User says | Action |
|-----------|--------|
| `/spark` | Check day, POST add-spark |
| `add spark` / `spark task` | Same |

When triggered, add immediately (no extra confirmation).

## Step 1: Check the day is open

```bash
curl -sS 'https://task.skarpa.dev/api/day'
```

If `day.status === 'closed'`, stop and tell the user the day is closed.

If `day.sparkUsed === true` (or any task has `source === 'spark'` on older days without the flag), stop and tell the user today's Spark was already used.

## Step 2: POST to API

```bash
curl -sS -X POST https://task.skarpa.dev/api/task/add-spark \
  -H 'content-type: application/json' \
  -d '{"date":"YYYY-MM-DD"}'
```

Response: `{ "day": { ... } }`. The server picks the prompt at random.

## After add

Report:

- Date
- The Spark task line added (read `text` from the new `source: spark` task)
- Link to [task.skarpa.dev](https://task.skarpa.dev/)

On `409`, say today's Spark was already used. On non-2xx, report the error body.

## Related skills

- Manual work task: [.cursor/skills/add-task/SKILL.md](../add-task/SKILL.md)
- Close day: [.cursor/skills/close-day/SKILL.md](../close-day/SKILL.md)
