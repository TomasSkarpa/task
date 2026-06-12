# Jira JQL reference (sync-day-from-jira)

Discovered on **bataeurope.atlassian.net** (FA2A Support / FSP) for Tomáš Škarpa, **Aftersales Avengers** squad.

## Site constants

| Item | Value |
|------|-------|
| Cloud ID | `cbcbb760-4084-4288-8885-d669c0e5f487` |
| Project | `FSP` |
| Team (display) | Aftersales Avengers |
| Team field JQL | `"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"` |
| Developer field | `Developer` (custom user picker; who codes / implements) |
| Tester field | `Tester` (custom user picker; who tests / pings QA) |
| Assignee field | `assignee` (ticket owner; often PM or current executor) |
| Sprint field | `Sprint` / `customfield_10021` (names like `AA - Sprint 44`) |
| Active sprint | Use `sprint in openSprints()`; do **not** hardcode sprint number |
| User account ID | `712020:717f5e74-349e-47b1-a3ac-e295e9fb024f` |

**Do not** use a single field as the only filter. JQL casts a wide net; [ownership verdict](#ownership-verdict-per-ticket) decides what lands on your day.

## Pending-action statuses (FSP / Foundry)

Only sync issues in these statuses (unless user overrides):

| Status | Typical action |
|--------|----------------|
| Ready for Development | Start or continue dev |
| In Execution | Continue dev |
| In Analysis | Analysis / spike / unblock |
| Opened | Pick up / clarify scope |
| PR Review | Review PR or ping reviewer |
| Testing | Ping QA / verify on sandbox |
| Testing in DEV | Test on dev instance |
| Released in DEV | PR merged to dev; test or ping QA |

Exclude `Completed`, `Done`, `Closed`, `Cancelled`, and any `statusCategory = Done`.

Status buckets for ownership (see verdict table below):

| Bucket | Statuses |
|--------|----------|
| **dev** | Ready for Development, In Execution, In Analysis, Opened |
| **review** | PR Review |
| **test** | Testing, Testing in DEV, Released in DEV |

## Shared JQL fragments

**Squad:**

```
"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"
```

**Pending action only:**

```
AND status in (
  "Ready for Development",
  "In Execution",
  "In Analysis",
  "Opened",
  "PR Review",
  "Testing",
  "Testing in DEV",
  "Released in DEV"
)
```

**Wide-net involvement** (candidate pool; verdict step narrows):

```
AND (
  Developer = currentUser()
  OR assignee = currentUser()
  OR Tester = currentUser()
)
```

**Recent activity window** (Europe/Prague; use for bucket 2 only):

| Today | Use |
|-------|-----|
| Monday | `updated >= -3d` (covers Fri through Mon) |
| Tue to Fri | `updated >= -1d` |
| Sat or Sun | `updated >= -2d` |

## Bucket queries

Only **bucket 1** and **bucket 2** produce **candidates**. Ownership verdict filters before grouping. There is no stale out-of-sprint backlog sync.

### 1. In current team sprint (candidates)

```
"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"
AND sprint in openSprints()
AND status in (
  "Ready for Development",
  "In Execution",
  "In Analysis",
  "Opened",
  "PR Review",
  "Testing",
  "Testing in DEV",
  "Released in DEV"
)
AND (
  Developer = currentUser()
  OR assignee = currentUser()
  OR Tester = currentUser()
)
ORDER BY updated DESC
```

### 2. Out of sprint, recent involvement (candidates)

Out-of-sprint tickets you may still need to act on. Requires **both** pending-action status **and** the recency window.

```
"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"
AND (sprint is EMPTY OR sprint not in openSprints())
AND status in (
  "Ready for Development",
  "In Execution",
  "In Analysis",
  "Opened",
  "PR Review",
  "Testing",
  "Testing in DEV",
  "Released in DEV"
)
AND (
  Developer = currentUser()
  OR assignee = currentUser()
  OR Tester = currentUser()
)
AND updated >= -1d
ORDER BY updated DESC
```

Replace `-1d` with the window from the recency table.

Dedupe bucket 1 + bucket 2 by issue key before ownership verdict.

## MCP fetch fields

**Search** (all candidates): `key`, `summary`, `status`, `updated`, `Sprint`, `Team`, `Developer`, `Tester`, `assignee`.

**Borderline tickets** (see below): `getJiraIssue` with `fields: ["comment"]` (last comments in `fields.comment.comments`).

## Ownership verdict (per ticket)

Apply after JQL. Each candidate gets **include**, **exclude**, or fetch comments first if **borderline**.

### Primary actor by status

| Status bucket | Who should act next | Match if you are |
|---------------|---------------------|------------------|
| dev | Developer, then assignee if Developer empty | Developer **or** assignee |
| review | Developer, then assignee | Developer **or** assignee |
| test | Tester, then Developer (unblock dev) | Tester **or** Developer |

**Include** when you match the primary actor for the ticket's status bucket.

**Also include** when:

- You are **assignee** in a dev-bucket status (you own delivery even if Developer names someone else)
- A comment in the last **7 days** **@mentions you** with a clear ask (question, please, can you, need you, blocked on you)
- You are **Tester** and status is in the test bucket

### Borderline (fetch comments before verdict)

Fetch last **3** comments when **any** of:

- `Developer = you` **and** `assignee` is someone else (non-empty)
- `assignee = you` **and** `Developer` is someone else (non-empty)
- Status is test bucket **and** you are Developer but not Tester and not assignee

If comments are empty or unavailable, use field rules only and note uncertainty in **Excluded** only when excluding; otherwise include with lower confidence (prefer include when assignee = you).

### Exclude (handoff / stale fields)

**Exclude** when a handoff signal outweighs field match:

| Signal | Verdict |
|--------|---------|
| Your **latest** comment (last 7d) **@mentions assignee** (or another dev) with handoff phrasing | **Exclude** you |
| Assignee is someone else, you are only on stale **Developer**, their comment is newer than yours | **Exclude** you |
| Your comment delegates work ("could you", "please update", "assigned to", "for you", "handing over", "taking over", "kindly", "request a change on") to assignee | **Exclude** you |
| Status is test bucket, **Tester** is someone else, you are only stale **Developer**, no recent @mention of you | **Exclude** you |

Handoff phrasing is indicative, not exhaustive; use judgment from comment body.

### Worked examples

| Ticket | Fields | Comment signal | Verdict |
|--------|--------|----------------|---------|
| FSP-47441 | Developer=you, assignee=Erick, Opened | You @Erick today with Selligent request | **Exclude** (handed off) |
| FSP-47299 | Developer=you, assignee=you, Ready for Development | none | **Include** |
| FSP-49575 | Developer=you, Testing, Tester=Jan | You did BM config; Jan tests | **Include** if you must unblock; else **Exclude** if only Tester acts and no ping to you |

Record every **exclude** with key + one-line reason for the Phase 1 **Excluded** block.

## Grouping (included tickets only)

Group **only** tickets that passed **include**. Never merge an excluded ticket into a topic line.

Merge into **one task row** when they share a work theme, for example:

- Same country/market (`BATA CZ`, `Bata IN`, `Bata PE`, …)
- Same feature stream (Czech easy return, store locator / ProManage, registration journey)
- Same bracket tag (`[SFCC]`, `[MULE]`, `[AW EN]`) **and** clearly related summaries
- Same email/transactional template area for one brand

Keep **separate** tasks when markets, features, or actions are unrelated even if the tag matches.

If two tickets share a theme but **different ownership verdicts** (one included, one excluded), the topic line lists **only included** purposes. Do not mention excluded work in the numbered proposal.

## Verb hints for grouped task text

| Dominant Jira status in group | Suggested verb |
|-------------------------------|----------------|
| Ready for Development, In Execution, Opened | Finish |
| In Analysis | Review |
| PR Review | Review |
| Testing, Testing in DEV, Released in DEV | Unblock |

Example grouped line: `Finish **AW ISS confirmation email**: add store-pickup disclaimer on order confirmation for AW IT/ES`
