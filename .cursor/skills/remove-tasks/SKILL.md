---
name: remove-tasks
description: >-
  Remove tasks from today's day on task.skarpa.dev. Step 1 (/remove-tasks):
  list numbered tasks from GET /api/day. Step 2 (user picks numbers, ids, or
  keywords): POST /api/task/remove. Use when the user runs /remove-tasks, asks
  to drop or delete tasks, or says remove 1,3 after a task list.
disable-model-invocation: true
---

# Remove tasks

Remove tasks from today (or a given date) via the live API. Do **not** edit JSON files.

## Before you start

1. Read `data/schema/day.schema.json` and `src/lib/server/day-store.ts` (`removeTasks`)
2. Date defaults to today (`Europe/Prague`, same as `todayDateString()`)
3. Base URL: `https://task.skarpa.dev` (or `http://localhost:5173` when testing locally)

## List today's tasks

```bash
curl -sS 'https://task.skarpa.dev/api/day'
# or explicit date
curl -sS 'https://task.skarpa.dev/api/day?date=YYYY-MM-DD'
```

Sort tasks by `sort` (same as homepage). Use **1-based** numbers in chat.

If `day.status === 'closed'`, stop and tell the user the day is closed (removals are blocked server-side).

## Triggers

| User says | Action |
|-----------|--------|
| `/remove-tasks` (no targets) | List tasks, ask what to remove |
| `/remove-tasks 1,3` | Remove list positions 1 and 3 |
| `/remove-tasks jira-group-cz` | Remove by stable `id` |
| `remove 2 and 4` (after a list) | Map numbers to `id`, then POST remove |
| `drop the Czech withdrawal task` | Match task text, confirm if ambiguous, then POST |

When the user gives targets in the same message as `/remove-tasks`, remove immediately (no extra confirmation).

## Resolve targets to task ids

1. **Numbers:** map to sorted task list (`1` = first row on site)
2. **Ids:** use exact `task.id` when the string matches an id on the day
3. **Keywords:** case-insensitive substring on `task.text`; if multiple match, show options and wait for a number or id

Ignore numbers or ids that do not exist; report skipped targets.

## Remove via API

```bash
# one task
curl -sS -X POST https://task.skarpa.dev/api/task/remove \
  -H 'content-type: application/json' \
  -d '{"date":"YYYY-MM-DD","taskId":"jira-group-cz-withdrawal"}'

# several tasks
curl -sS -X POST https://task.skarpa.dev/api/task/remove \
  -H 'content-type: application/json' \
  -d '{"date":"YYYY-MM-DD","taskIds":["jira-group-test","manual-abc"]}'
```

Response: `{ "day": { ... }, "removed": <count> }`

## After remove

Report:

- Date
- Removed count and short labels (truncate long text)
- Remaining open task count
- Link to [task.skarpa.dev](https://task.skarpa.dev/)

If `removed` is 0, say nothing matched and show the current list again.

## Related skills

- Split one task into smaller rows (add + remove parent): [.cursor/skills/fragment-task/SKILL.md](../fragment-task/SKILL.md)
