---
name: catch-up-from-jira
description: >-
  Scan Jira for pings, assignments, and asks from the last 7 days that still
  await your reply. Out of scope for /sync-day. Read-only report in chat;
  optional create catch-up 1,2 via add-task. Use when the user runs
  /catch-up-from-jira, catch up from Jira, or asks what still needs a Jira
  reply outside sprint work.
disable-model-invocation: true
---

# Catch up from Jira

Check **communication debt** on Jira: tickets where someone **@mentioned you**, **assigned you**, or **asked you** in the last **7 days**, and you have **not replied since**.

This is **outside `/sync-day` scope**. Sprint ownership and grouped work tasks stay in [sync-day-from-jira](../sync-day-from-jira/SKILL.md). Catch-up is read-only unless the user confirms **create catch-up 1,2**.

## Before you start

1. Read [reference.md](reference.md) (JQL, response verdict, output format)
2. Reuse site constants from [sync-day jql-reference](../sync-day-from-jira/jql-reference.md) (cloud ID, team, user account ID)
3. Determine today's date in **Europe/Prague** (same as `todayDateString()`)
4. Read MCP tool schemas before calling **user-atlassian-mcp**

## Triggers

| User says | Action |
|-----------|--------|
| `/catch-up-from-jira` | Run scan, report in chat |
| `catch up from Jira` / `what awaits my reply` | Same |
| **create catch-up 1, 2** | Add selected rows to today via [add-task](../add-task/SKILL.md) |

## Step 1: Wide-net JQL (last 7 days)

Cloud ID: `cbcbb760-4084-4288-8885-d669c0e5f487`.

Use **user-atlassian-mcp** `searchJiraIssuesUsingJql` with the query in [reference.md](reference.md#wide-net-jql).

Fetch fields: `summary`, `status`, `updated`, `assignee`.

Cap review at **25** issues (newest first). Dedupe by key.

## Step 2: Response verdict (per issue)

For each candidate, call `getJiraIssue` with `fields: ["comment", "assignee", "status"]`.

Apply [response verdict](reference.md#response-verdict) from reference:

1. Find the latest **trigger** in the last 7 days (mention, assign ping, or direct ask)
2. **Awaiting reply** if trigger is from someone else and you have **no comment after** it
3. **Skip** if you already replied, issue is Done/Closed, or trigger was FYI-only

Track **skipped** reasons internally; only report awaiting-reply items (max **8** in chat; note if more exist).

## Step 3: Report in chat

Use the template in [reference.md](reference.md#output-template).

Always include:

- Date scanned
- Count: candidates → awaiting reply
- That this did **not** write to task.skarpa.dev
- Link to [task.skarpa.dev](https://task.skarpa.dev/) if user may want to add items

If nothing awaits reply, say so plainly. Do not invent items.

## Step 4 (optional): Add to today

Run only when the user says **create catch-up 1, 2** (or **create catch-up all**).

1. Read [add-task](../add-task/SKILL.md): day must be **open**
2. For each selected item, POST one task:

| Field | Value |
|-------|-------|
| `text` | `Reply **<short topic>**: <one-line ask summary>` |
| `source` | `manual` |

Use verb **Reply**. Topic label: 2–6 words from the ticket theme, not the key. No ticket keys in the visible line.

3. Report how many tasks were added and link to the site.

## Related skills

- Sprint work sync: [sync-day-from-jira](../sync-day-from-jira/SKILL.md)
- Single manual task: [add-task](../add-task/SKILL.md)
