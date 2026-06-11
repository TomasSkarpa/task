---
name: sync-day-from-jira
description: >-
  Syncs open Jira issues into today's task list at data/days/YYYY-MM-DD.json
  for task.skarpa.dev. Uses Atlassian MCP to query assigned work, merges by
  jiraKey, formats task text with **KEY** emphasis. Use when the user runs
  /sync-day, asks to sync from Jira, fill today from Jira, or pull open tickets
  into daily tasks.
disable-model-invocation: true
---

# Sync day from Jira

Populate today's `data/days/<date>.json` from open Jira issues.

## Before you start

1. Read `AGENTS.md` and `data/schema/day.schema.json`
2. Read `design/DIRECTIVE.md` section 11 (AI workflow)
3. Determine today's date with `Europe/Prague` (same as `todayDateString()` in `src/lib/server/day-store.ts`)

## Step 1: Load today's day file

- Path: `data/days/YYYY-MM-DD.json`
- If missing, create:

```json
{
  "date": "YYYY-MM-DD",
  "status": "open",
  "closedAt": null,
  "closedBy": null,
  "tasks": []
}
```

- If `status` is `closed`, stop and tell the user to open tomorrow's file or reopen the day first.

## Step 2: Query Jira (Atlassian MCP)

Use the **user-atlassian-mcp** server. Read tool schemas under the MCP descriptors folder before calling.

Default JQL (adjust if user gives criteria):

```
assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC
```

Fetch for each issue:

- `key` (e.g. `ECOM-4821`)
- `summary`
- `status`

Optional: user may specify project, sprint, or custom JQL in the prompt.

## Step 3: Map issues to tasks

For each Jira issue not already present (match on `jiraKey`):

| Field | Value |
|-------|-------|
| `id` | `jira-<key-lowercase>` e.g. `jira-ecom-4821` |
| `text` | `<verb> **<KEY>** <short summary>` |
| `status` | `open` |
| `source` | `jira` |
| `jiraKey` | issue key |
| `carriedFrom` | `null` |
| `sort` | append after existing max sort |

**Verb pick:** Review, Finish, Unblock, Reply, Ship, Debug (pick one that fits the summary).

**Emphasis:** Jira key must be wrapped in `**` in `text`.

Do not remove existing tasks. Update summary text only if the user asks to refresh copy.

Preserve tasks with `source: carryover` or `manual` unless user asks to remove them.

## Step 4: Write file

- Pretty-print JSON with tabs (match existing files)
- Trailing newline
- Validate against `data/schema/day.schema.json`

## Step 5: Report

Tell the user:

- Date synced
- Count added vs already present
- Suggest `npm run dev` to preview
- Offer commit if they want

## Example task row

```json
{
  "id": "jira-ecom-4821",
  "text": "Review **ECOM-4821** checkout hook for Constructor facet",
  "status": "open",
  "source": "jira",
  "jiraKey": "ECOM-4821",
  "carriedFrom": null,
  "sort": 0
}
```

## Additional reference

- JQL examples: [jql-reference.md](jql-reference.md)
