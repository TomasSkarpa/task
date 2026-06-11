---
name: fragment-task
description: >-
  Split one existing task on task.skarpa.dev into smaller focused tasks. Phase 1
  proposes fragments in chat; Phase 2 adds selected rows and removes the parent
  via POST /api/task/add and /api/task/remove. Use when the user runs
  /fragment-task, asks to split or break down a task, or fragment task 2.
disable-model-invocation: true
---

# Fragment task

Split one **parent task** into several smaller tasks on today (or a given date). Two phases. **Phase 1 never writes data.** **Phase 2 writes** via the live API (no git commit).

## Before you start

1. Read `data/schema/day.schema.json`, `add-task/SKILL.md` (task text format), `remove-tasks/SKILL.md` (resolve targets)
2. Date defaults to today (`Europe/Prague`, same as `todayDateString()`)
3. Base URL: `https://task.skarpa.dev` (or `http://localhost:5173` when testing locally)

## Task text format (fragments)

Each fragment is one homepage row, same format as Jira sync and manual add:

```
<Verb> **<short topic label>**: <single primary purpose>
```

| Part | Rules |
|------|-------|
| **Verb** | Finish, Review, Unblock, Reply, Ship, or Debug (inherit from parent unless a fragment is clearly different) |
| **Topic label** | Reuse the parent `**topic**` or a narrower sub-label (2–6 words) |
| **Purpose** | One focused clause; no semicolon lists in the fragment line |

Parent example (too broad):

```
Finish **Czech contract withdrawal & easy return**: withdrawal on order detail and track order; SFCC resources and Resource Manager config; order return email content asset; footer translation for track and return; Mule analysis of unshipped order statuses
```

Fragment examples:

```
Finish **Czech contract withdrawal**: withdrawal flow on order detail and track order
Finish **Czech easy return config**: SFCC resources and Resource Manager setup
Finish **Czech return email**: order return email content asset
Finish **Czech track/return footer**: footer translation for track and return
Review **Czech withdrawal Mule**: analyse which statuses mean order not shipped yet
```

No em dashes. No ticket keys in visible lines.

---

## Phase 1: Propose (trigger: `/fragment-task`, split this task, fragment …)

**Do not** call add/remove in Phase 1.

### Step 1: Load today and resolve parent

```bash
curl -sS 'https://task.skarpa.dev/api/day'
```

Sort tasks by `sort` (same as homepage). Use **1-based** numbers in chat.

If `day.status === 'closed'`, stop.

Resolve the parent task (same rules as remove-tasks):

| Input | Maps to |
|-------|---------|
| `/fragment-task 2` | Task at list position 2 |
| `/fragment-task jira-group-cz-withdrawal` | Task by `id` |
| `fragment the Czech withdrawal task` | Keyword match on `task.text` |

If zero or multiple matches, list options and wait.

### Step 2: Parse parent text

Split the parent line on the first `:`:

- **Head:** verb + optional `**topic**` (e.g. `Finish **Czech contract withdrawal & easy return**`)
- **Tail:** purpose clauses separated by `;`

Extract:

- **Verb** from the head (first word before `**` or before topic)
- **Topic** from `**...**` in the head, or derive a short label from the head
- **Clauses** from the tail (trim, drop empties)

If the parent has no `;` tail (already a single-purpose line), say so and stop, or ask the user how they want it split.

### Step 3: Build fragment proposals

Rules:

1. **One clause → one fragment** when clauses are independent work (default for Jira-group rows).
2. **Merge** only when two clauses are trivially the same action (e.g. duplicate wording).
3. **Narrow the topic** per fragment when the parent topic is broad; keep a shared theme word when helpful (e.g. "Czech withdrawal", "Czech easy return").
4. **Verb per fragment:** keep the parent verb unless status/intent differs (analysis → Review, QA wait → Unblock).
5. Aim for **2–6 fragments**; if more than 6 clauses, group related clauses and mention grouped items in the single purpose clause.
6. Fragments are always **`source: manual`** (new rows via add API). Do not copy parent `jiraKey`.

### Step 4: Report proposals in chat

```markdown
**Fragment proposal for task N** (<parent id> · parent topic short label)

Parent (will be removed after confirm):
> <full parent text>

Proposed fragments:

1) <fragment line>
2) <fragment line>
...

Reply **split all** or **split 1, 3, 4** to add selected fragments and remove the parent.
Reply **cancel** to keep the parent unchanged.
```

Tell the user Phase 1 did not write anything.

---

## Phase 2: Split (trigger: user confirms)

Run only after explicit confirmation in the same chat, e.g. **split all**, **split 1,2,4**, **fragment 2** (after Phase 1).

### Step 1: Select fragments

- **split all** → every numbered fragment from the latest Phase 1 for that parent
- **split 1, 3, 4** → only those indices
- If no prior Phase 1, run Phase 1 first or ask the user to re-run `/fragment-task`

### Step 2: Add fragments, then remove parent

Add **in proposal order** (one POST per fragment):

```bash
curl -sS -X POST https://task.skarpa.dev/api/task/add \
  -H 'content-type: application/json' \
  -d '{"date":"YYYY-MM-DD","text":"Finish **Czech contract withdrawal**: withdrawal flow on order detail and track order"}'
```

Then remove the parent (always, unless user said **split … keep parent**):

```bash
curl -sS -X POST https://task.skarpa.dev/api/task/remove \
  -H 'content-type: application/json' \
  -d '{"date":"YYYY-MM-DD","taskId":"<parent-id>"}'
```

Use the Shell tool for each call. On non-2xx, report the error body and stop; do not remove the parent if adds failed.

**Sort note:** New fragments append at the end of the list (add API behavior). The parent row disappears after remove.

### Step 3: Confirm to user

Report:

- Date
- Parent removed (id + short label)
- Count and lines of fragments added
- Link to [task.skarpa.dev](https://task.skarpa.dev/)

---

## Triggers (quick reference)

| User says | Action |
|-----------|--------|
| `/fragment-task` | List today's tasks, ask which to split |
| `/fragment-task 2` | Phase 1 for task 2 |
| `split task 2` / `break down the Czech withdrawal task` | Phase 1 |
| **split all** / **split 1, 3** (after proposal) | Phase 2 |
| **split all keep parent** | Phase 2 adds fragments but does **not** remove parent |

---

## Related skills

- Add one task: [add-task/SKILL.md](../add-task/SKILL.md)
- Remove without split: [remove-tasks/SKILL.md](../remove-tasks/SKILL.md)
- Jira bulk topics: [sync-day-from-jira/SKILL.md](../sync-day-from-jira/SKILL.md)
