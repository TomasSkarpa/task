---
name: sync-day-from-jira
description: >-
  Two-step Jira sync for task.skarpa.dev. Step 1 (/sync-day): query Jira,
  group tickets into topic lines, show numbered proposals in chat for
  confirmation only (no file write, no API). Step 2 (user says create all or
  create 1,3,4): POST selected tasks to https://task.skarpa.dev/api/task/sync-jira
  (Vercel Blob persistence). Uses Atlassian MCP with Developer + Aftersales
  Avengers JQL (not assignee).
disable-model-invocation: true
---

# Sync day from Jira

Two phases. **Phase 1 never writes data.** **Phase 2 writes live tasks** to [task.skarpa.dev](https://task.skarpa.dev/) via API (no git commit).

## Before you start

1. Read `AGENTS.md` and `data/schema/day.schema.json`
2. Read [jql-reference.md](jql-reference.md) (site constants, JQL, statuses)
3. Determine today's date in **Europe/Prague** (same as `todayDateString()` in `src/lib/server/day-store.ts`)
4. Read MCP tool schemas under the MCP descriptors folder before calling **user-atlassian-mcp**

## What counts as "needs your attention"

Include an issue only when **all** of these are true:

1. **Developer** is you (`Developer = currentUser()`). Do **not** use `assignee`.
2. **Team** is Aftersales Avengers (`"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"`).
3. **Status** is a pending-action status (dev, PR review, or test/ping QA). See [jql-reference.md](jql-reference.md).
4. **Sprint scope:** in the **current open sprint**, **or** out of sprint with **recent activity** (recency window in jql-reference).

Do **not** sync stale out-of-sprint backlog. Skip Done/Completed/Closed and statuses with no action on you.

For **out of sprint**, deprioritize stale `[AUTOMATED TEST]` tickets unless they match bucket 2 recency rules.

---

## Phase 1: Propose (trigger: `/sync-day`, sync from Jira)

**Do not** edit `data/days/*.json`. **Do not** call the task API. **Do not** offer a commit.

### Step 1: Check today's day is open

`GET` is not required; optionally note if the user already has open tasks on site. If you know the day is `closed`, stop and tell the user to open tomorrow or reopen the day first.

### Step 2: Query Jira (two buckets)

Use **user-atlassian-mcp** `searchJiraIssuesUsingJql`. Cloud ID: `cbcbb760-4084-4288-8885-d669c0e5f487`.

Run **bucket 1** and **bucket 2** JQL from [jql-reference.md](jql-reference.md). For bucket 2, compute the `updated >= -Nd` window from Europe/Prague weekday rules before calling MCP.

Fetch fields: `summary`, `status`, `updated`, `Sprint`, `Team`, `assignee`.

Resolve the active sprint name (e.g. `AA - Sprint 44` via `customfield_10021` on any bucket 1 issue).

### Step 3: Group issues into topics

Union bucket **1** and bucket **2**, dedupe by issue key, then **group**.

#### Grouping rules

Merge issues into **one task row** when they share a work theme, for example:

- Same country/market (`BATA CZ`, `Bata IN`, `Bata PE`, …)
- Same feature stream (Czech easy return, store locator / ProManage, registration journey)
- Same bracket tag (`[SFCC]`, `[MULE]`, `[AW EN]`) **and** clearly related summaries
- Same email/transactional template area for one brand

Keep **separate** tasks when markets, features, or actions are unrelated even if the tag matches.

#### Task text format (grouped)

One line per topic. Do **not** paste full Jira summaries or list every key in the proposal line.

```
<Verb> **<short topic label>**: <purpose>; <purpose>; <purpose>
```

- **Verb:** Finish, Review, Unblock, Reply, Ship, or Debug (pick from dominant status in the group; see jql-reference).
- **Topic label:** 2–6 words, emphasized with `**`.
- **Purposes:** short clauses, separated by `;`. Lowercase, no ticket keys in the visible line.

### Step 4: Report proposals in chat (numbered topics only)

Present **grouped topic lines** as a numbered list for user confirmation. This is what the user reviews, not raw tickets.

```markdown
**Proposed tasks for YYYY-MM-DD** (AA - Sprint N · <ticket count> tickets → <topic count> topics)

1) <grouped task line>
2) <grouped task line>
...

**Covers (traceability):** optional short mapping of topic number → issue keys, only if helpful. Keep tickets out of the main numbered list.

Reply **create all** or **create 1, 3, 4** to add selected tasks to task.skarpa.dev.
```

Also tell the user:

- Date and sprint name
- Topic count vs ticket count
- Phase 1 did not write anything; tasks appear only after they confirm

### Prepare stable task payloads (internal, for Phase 2)

For each numbered proposal, keep this ready (do not write to disk):

| Field | Value |
|-------|-------|
| `id` | `jira-group-<slug>` e.g. `jira-group-cz-withdrawal` |
| `text` | grouped line |
| `status` | `open` |
| `source` | `jira` |
| `jiraKey` | `null` when multiple issues; single-issue groups may set the key |
| `carriedFrom` | `null` |

---

## Phase 2: Create (trigger: user confirms)

Run only after explicit confirmation, e.g. **create all**, **create 1,3,4**, **add 2 and 5**.

### Step 1: Select proposals

- **create all** → every numbered topic from the latest Phase 1 in this chat
- **create 1, 3, 4** → only those indices
- If no prior Phase 1 in this chat, run Phase 1 first or ask the user to re-run `/sync-day`

### Step 2: POST to production API

Base URL: `https://task.skarpa.dev`

```bash
curl -sS -X POST https://task.skarpa.dev/api/task/sync-jira \
  -H 'content-type: application/json' \
  -d @- <<'EOF'
{
  "date": "YYYY-MM-DD",
  "replaceAll": true,
  "tasks": [
    {
      "id": "jira-group-cz-withdrawal",
      "text": "Follow up on **Czech contract withdrawal & easy return**: withdrawal on order detail and track order; SFCC resources and Resource Manager config; order return email content asset; footer translation for track and return",
      "status": "open",
      "source": "jira",
      "jiraKey": null,
      "carriedFrom": null
    }
  ]
}
EOF
```

| Selection | `replaceAll` |
|-----------|--------------|
| **create all** (full refresh of Jira topics) | `true` (removes prior `jira-*` / `jira-group-*` on that day, keeps manual and carryover) |
| **create 1, 3, 4** (partial) | `false` (merge by `id`; keep other existing Jira tasks) |

Use the Shell tool for the curl call. On non-2xx response, report the error body; do not fall back to editing `data/days/*.json` unless the user asks for local-only dev.

### Step 3: Confirm to user

- How many tasks were created
- Link to [task.skarpa.dev](https://task.skarpa.dev/)
- No commit step

---

## Example grouped proposal (what the user sees)

```
1) Follow up on **Czech contract withdrawal & easy return**: withdrawal on order detail and track order; SFCC resources and Resource Manager config; order return email content asset; footer translation for track and return
```

## Example API task row (Phase 2 payload)

```json
{
  "id": "jira-group-cz-withdrawal",
  "text": "Follow up on **Czech contract withdrawal & easy return**: withdrawal on order detail and track order; SFCC resources and Resource Manager config; order return email content asset; footer translation for track and return",
  "status": "open",
  "source": "jira",
  "jiraKey": null,
  "carriedFrom": null
}
```

## Additional reference

- JQL and constants: [jql-reference.md](jql-reference.md)
- Persistence: Vercel Blob via `BLOB_READ_WRITE_TOKEN` on production; local `data/days/` when token is unset
