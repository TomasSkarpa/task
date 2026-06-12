---
name: sync-day-from-jira
description: >-
  Two-step Jira sync for task.skarpa.dev. Step 1 (/sync-day): wide-net Jira
  query, ownership verdict per ticket (Developer, Tester, assignee, comments),
  group included tickets into topic lines, show proposals + Excluded list in
  chat (no API write). Step 2 (create all / create 1,3,4): POST to
  https://task.skarpa.dev/api/task/sync-jira (Vercel Blob).
disable-model-invocation: true
---

# Sync day from Jira

Two phases. **Phase 1 never writes data.** **Phase 2 writes live tasks** to [task.skarpa.dev](https://task.skarpa.dev/) via API (no git commit).

## Before you start

1. Read `AGENTS.md` and `data/schema/day.schema.json`
2. Read [jql-reference.md](jql-reference.md) (JQL, ownership verdict, statuses)
3. Determine today's date in **Europe/Prague** (same as `todayDateString()` in `src/lib/server/day-store.ts`)
4. Read MCP tool schemas under the MCP descriptors folder before calling **user-atlassian-mcp**

## Pipeline overview

1. **Wide-net JQL** (bucket 1 + 2): AA squad, pending status, sprint scope, and (`Developer` OR `assignee` OR `Tester` = you)
2. **Ownership verdict** per candidate: status-aware primary actor + comment handoff checks
3. **Group** included tickets only into topic lines
4. **Propose** numbered tasks + **Excluded** audit list

Do **not** sync stale out-of-sprint backlog. Skip Done/Completed/Closed. For out of sprint, deprioritize stale `[AUTOMATED TEST]` unless bucket 2 recency matches.

---

## Phase 1: Propose (trigger: `/sync-day`, sync from Jira)

**Do not** call the task API in Phase 1. **Do not** offer a commit.

### Step 1: Check today's day is open

`GET` is not required; optionally note if the user already has open tasks on site. If you know the day is `closed`, stop and tell the user to open tomorrow or reopen the day first.

### Step 2: Query Jira (two buckets, wide net)

Use **user-atlassian-mcp** `searchJiraIssuesUsingJql`. Cloud ID: `cbcbb760-4084-4288-8885-d669c0e5f487`.

Run **bucket 1** and **bucket 2** JQL from [jql-reference.md](jql-reference.md). For bucket 2, compute the `updated >= -Nd` window from Europe/Prague weekday rules before calling MCP.

Fetch fields: `summary`, `status`, `updated`, `Sprint`, `Team`, `Developer`, `Tester`, `assignee`.

Union and dedupe by issue key. Count = **candidates** (not yet on your day).

Resolve the active sprint name (e.g. `AA - Sprint 44` via `customfield_10021` on any bucket 1 issue).

### Step 3: Ownership verdict (per candidate)

For **each** deduped issue, apply [ownership verdict](jql-reference.md#ownership-verdict-per-ticket) from jql-reference:

1. Map status to **dev**, **review**, or **test** bucket
2. Check if you match the **primary actor** for that bucket
3. If **borderline**, call `getJiraIssue` with `fields: ["comment"]` and read the last 3 comments
4. Apply **exclude** rules for handoffs (your comment delegating to assignee, stale Developer after reassignment, etc.)
5. Label ticket **include** or **exclude** with a one-line reason

Only **include** tickets proceed to grouping. Track **exclude** reasons for Step 5.

### Step 4: Group included issues into topics

Group **included** tickets only. See grouping rules in [jql-reference.md](jql-reference.md#grouping-included-tickets-only).

Topic text must reflect **included** work only. If one ticket in a theme was excluded, do not fold its summary into the line.

#### Task text format (grouped)

```
<Verb> **<short topic label>**: <purpose>; <purpose>; <purpose>
```

- **Verb:** Finish, Review, Unblock, Reply, Ship, or Debug (dominant status in the **included** group; see jql-reference)
- **Topic label:** 2–6 words, emphasized with `**`
- **Purposes:** short clauses, separated by `;`. Lowercase, no ticket keys in the visible line

### Step 5: Report proposals in chat

Present **grouped topic lines** as a numbered list. Always show counts: candidates → included → topics.

```markdown
**Proposed tasks for YYYY-MM-DD** (AA - Sprint N · <candidate count> candidates → <included count> included → <topic count> topics)

1) <grouped task line>
2) <grouped task line>
...

**Covers (traceability):** topic number → issue keys (included only)

**Excluded (<exclude count>):**
- FSP-XXXXX → <one-line reason>
- FSP-YYYYY → <one-line reason>

Reply **create all** or **create 1, 3, 4** to add selected tasks to task.skarpa.dev.
```

Also tell the user:

- Date and sprint name
- Candidate vs included vs topic counts
- Phase 1 did not write anything; tasks appear only after they confirm

If every candidate was excluded, say so and list **Excluded** only; do not invent topics.

### Prepare stable task payloads (internal, for Phase 2)

For each numbered proposal, keep this ready (do not write to disk):

| Field | Value |
|-------|-------|
| `id` | `jira-group-<slug>` e.g. `jira-group-cz-withdrawal` |
| `text` | grouped line (included work only) |
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
      "text": "Finish **Czech contract withdrawal & easy return**: withdrawal on order detail and track order; SFCC resources and Resource Manager config; order return email content asset; footer translation for track and return",
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

Use the Shell tool for the curl call. On non-2xx response, report the error body.

### Step 3: Confirm to user

- How many tasks were created
- Link to [task.skarpa.dev](https://task.skarpa.dev/)
- No commit step

---

## Example Phase 1 output (ownership-aware)

```markdown
**Proposed tasks for 2026-06-12** (AA - Sprint 44 · 14 candidates → 11 included → 8 topics)

1) Finish **Czech contract withdrawal & easy return**: withdrawal on order detail and track order; SFCC resources; return email asset; footer translation; Mule unshipped status analysis
2) Finish **AW ISS confirmation email**: add store-pickup disclaimer on order confirmation for AW IT/ES
...

**Covers:** 1 → FSP-49437, FSP-49577, …; 2 → FSP-47299

**Excluded (3):**
- FSP-47441 → handed to Erick (assignee); your comment today delegated Selligent work
- FSP-49700 → Vasileios owns Mule subtask (assignee)
- FSP-46539 → Radek on parent story in Testing in DEV; you are not Tester

Reply **create all** or **create 1, 2**.
```

## Example API task row (Phase 2 payload)

```json
{
  "id": "jira-group-aw-iss-confirmation",
  "text": "Finish **AW ISS confirmation email**: add store-pickup disclaimer on order confirmation for AW IT/ES",
  "status": "open",
  "source": "jira",
  "jiraKey": "FSP-47299",
  "carriedFrom": null
}
```

## Remove tasks (user or skill)

Use [.cursor/skills/remove-tasks/SKILL.md](../remove-tasks/SKILL.md) for `/remove-tasks`, **remove 3**, or **drop task X**.

After Phase 1 proposals, map declined proposal numbers to stable `id` values from the proposal list before calling remove.

## Additional reference

- JQL, ownership, grouping: [jql-reference.md](jql-reference.md)
- Persistence: Vercel Blob (`BLOB_STORE_ID` on deploy; `vercel env pull` for local dev)
