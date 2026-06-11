---
name: add-task
description: >-
  Add a manual task to today on task.skarpa.dev via POST /api/task/add. Formats
  chat text to match Jira-sync task lines. Use when the user runs /add-task,
  asks to add a task, or describes work to track for today.
disable-model-invocation: true
---

# Add task

Add one manual task to today (or a given date) via the live API. Do **not** edit JSON files.

## Before you start

1. Read `data/schema/day.schema.json` and `src/lib/server/day-store.ts` (`addTask`)
2. Date defaults to today (`Europe/Prague`, same as `todayDateString()`)
3. Base URL: `https://task.skarpa.dev` (or `http://localhost:5173` when testing locally)

## Task text format

Match Jira-sync rows on the homepage:

```
<Verb> **<short topic label>**: <purpose>; <purpose>; <purpose>
```

| Part | Rules |
|------|-------|
| **Verb** | Finish, Review, Unblock, Reply, Ship, or Debug |
| **Topic label** | 2–6 words, wrapped in `**` |
| **Purposes** | Short clauses, lowercase, separated by `;`. No ticket keys in the line |

Example: `Finish **Bata PE registration**: fix bata.com/eu domain block on signup and password reset`

Emphasis uses `**text**` only (rendered by `EmphasisText`). No em dashes in new copy.

## Triggers

| User says | Action |
|-----------|--------|
| `/add-task` (no text) | Ask what to add |
| `/add-task <text>` | Format if needed, POST add |
| `add task: <text>` | Same |
| Free-form description in chat after `/add-task` | Normalize to format, POST add |

When the user gives the task text in the same message, add immediately (no extra confirmation). One task per invocation unless they ask for several in one message (then POST once per task, in order).

## Step 1: Check the day is open

```bash
curl -sS 'https://task.skarpa.dev/api/day'
# or explicit date
curl -sS 'https://task.skarpa.dev/api/day?date=YYYY-MM-DD'
```

If `day.status === 'closed'`, stop and tell the user to open tomorrow or reopen the day first.

## Step 2: Normalize text

1. If the user already wrote a line in the correct format, use it verbatim (trim only).
2. If the input is raw (sentence, bullet list, ticket summary), rewrite to the format above.
3. Pick the verb from intent: dev work → Finish; analysis or PR → Review; waiting on QA → Unblock; investigation → Debug.
4. Keep one line; do not paste Jira keys unless the user explicitly wants a key in metadata (manual tasks do not set `jiraKey` via this API).

Show the final line in chat before or after POST (brief, one line).

## Step 3: POST to API

```bash
curl -sS -X POST https://task.skarpa.dev/api/task/add \
  -H 'content-type: application/json' \
  -d '{"date":"YYYY-MM-DD","text":"Finish **Bata PE registration**: fix bata.com/eu domain block on signup and password reset"}'
```

Response: `{ "day": { ... } }`

The server assigns `id` (`manual-<uuid>`), `source: manual`, `status: open`, and appends `sort` after existing tasks.

## After add

Report:

- Date
- The task line added (exact text)
- Position on the list if helpful (last row, or count of tasks)
- Link to [task.skarpa.dev](https://task.skarpa.dev/)

On non-2xx response, report the error body. If `400` (empty text), ask the user to rephrase.

## Related skills

- Split one task into smaller rows: [.cursor/skills/fragment-task/SKILL.md](../fragment-task/SKILL.md)
- Jira bulk sync: [.cursor/skills/sync-day-from-jira/SKILL.md](../sync-day-from-jira/SKILL.md)
- Remove: [.cursor/skills/remove-tasks/SKILL.md](../remove-tasks/SKILL.md)
