# Catch up from Jira reference

Jira scan for **Aftersales Avengers** on **bataeurope.atlassian.net** (FSP). Constants: [sync-day jql-reference](../sync-day-from-jira/jql-reference.md).

| Item | Value |
|------|-------|
| Cloud ID | `cbcbb760-4084-4288-8885-d669c0e5f487` |
| Team JQL | `"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"` |
| User account ID | `712020:717f5e74-349e-47b1-a3ac-e295e9fb024f` |
| Lookback | **7 calendar days** (fixed; not weekday-adjusted) |
| Jira browse URL | `https://bataeurope.atlassian.net/browse/<KEY>` |

## Wide-net JQL

Casts wider than `/sync-day`: any AA ticket touched in 7d where you were involved or commented, excluding terminal statuses.

```
"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"
AND updated >= -7d
AND status not in (Completed, Done, Closed, Cancelled)
AND (
  assignee = currentUser()
  OR Developer = currentUser()
  OR Tester = currentUser()
  OR comment ~ currentUser()
)
ORDER BY updated DESC
```

## Response verdict

Apply **after** JQL. Goal: items where **you owe a Jira comment**, not tickets you already answered or own as active dev work only.

### Trigger (last 7 days)

A comment or field signal counts as a trigger when **any** of:

| Signal | Detail |
|--------|--------|
| **@mention** | Comment body mentions your account (`712020:717f5e74-349e-47b1-a3ac-e295e9fb024f`) or `@Tomáš Škarpa` |
| **Direct ask** | Comment to you uses ask phrasing: please, could you, can you, need you, waiting for, kindly, let me know, share, confirm, check, review, blocked on you |
| **Assign ping** | Comment says you were assigned and asks for action; or assignee is you and the **latest** comment is from someone else with an ask |

Use the **most recent** trigger in the 7d window. Ignore triggers older than 7d.

### Awaiting reply

**Include** when:

- Trigger author is **not** you
- You have **no comment** with `created` **after** the trigger comment
- Issue status is **not** Done/Closed/Completed/Cancelled

### Skip

**Exclude** when:

| Reason | Detail |
|--------|--------|
| Already replied | Your latest comment is **after** the trigger |
| You handed off | Your comment after the trigger delegates work to someone else (same handoff rules as sync-day) |
| FYI only | Mention or CC with no question and no action implied |
| Terminal | Done/Closed/Completed/Cancelled |
| Self-trigger | You opened the thread; no one else is waiting on you |

When excluding a borderline ticket, prefer **skip** if you replied after the ask.

### Overlap with `/sync-day`

A ticket can appear in **both** catch-up and sync-day proposals. Catch-up frames **reply debt**; sync-day frames **delivery work**. Do not dedupe across skills in the report; mention overlap in one line if the same key appears in both lists in one chat.

## Output template

```markdown
**Catch-up from Jira · YYYY-MM-DD** (last 7d · <candidate count> scanned → <count> awaiting reply)

1. **FSP-XXXXX** · <author> · <Mon D Mon> · <one-line ask, no key in prose>
   Status: <status> · [Jira](https://bataeurope.atlassian.net/browse/FSP-XXXXX)

2. ...

Reply **create catch-up 1, 2** to put selected items on today's task list.
Nothing was written to task.skarpa.dev.
```

If **count = 0**:

```markdown
**Catch-up from Jira · YYYY-MM-DD** (last 7d · <candidate count> scanned → 0 awaiting reply)

No Jira threads in the last 7 days need your reply. Nothing was written to task.skarpa.dev.
```

If more than 8 items, show the top 8 by trigger date (newest first) and add: `(+N more; re-run with a narrower ask if needed)`.

## Catch-up task text

When user confirms **create catch-up N**:

```
Reply **<topic label>**: <short ask summary>
```

Example: `Reply **Bata EU mail lists**: share prod mail.list IDs Achilleas requested for BG/HU/LV`
