# Jira JQL reference (sync-day-from-jira)

Discovered on **bataeurope.atlassian.net** (FA2A Support / FSP) for Tomáš Škarpa, **Aftersales Avengers** squad.

## Site constants

| Item | Value |
|------|-------|
| Cloud ID | `cbcbb760-4084-4288-8885-d669c0e5f487` |
| Project | `FSP` |
| Team (display) | Aftersales Avengers |
| Team field JQL | `"Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"` |
| Developer field | `Developer` (custom user picker; **not** `assignee`) |
| Sprint field | `Sprint` / `customfield_10021` (names like `AA - Sprint 44`) |
| Active sprint | Use `sprint in openSprints()`; do **not** hardcode sprint number |
| User account ID | `712020:717f5e74-349e-47b1-a3ac-e295e9fb024f` |

`assignee = currentUser()` is **wrong** for dev work. Assignee is ticket owner; Developer is who must act.

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

## Shared JQL fragments

**Developer + squad:**

```
Developer = currentUser()
AND "Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"
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

**Recent activity window** (Europe/Prague; use for bucket 2 only):

| Today | Use |
|-------|-----|
| Monday | `updated >= -3d` (covers Fri through Mon) |
| Tue to Fri | `updated >= -1d` |
| Sat or Sun | `updated >= -2d` |

## Bucket queries

Only **bucket 1** and **bucket 2** feed the day JSON. There is no stale out-of-sprint backlog sync.

### 1. In current team sprint (add to day JSON)

```
Developer = currentUser()
AND "Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"
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
ORDER BY updated DESC
```

### 2. Out of sprint, recent involvement (add to day JSON)

Out-of-sprint tickets you touched recently and still need action. Requires **both** pending-action status **and** the recency window.

```
Developer = currentUser()
AND "Team[Team]" = "68d11c02-5275-4350-9883-d1738be2ee8e"
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
AND updated >= -1d
ORDER BY updated DESC
```

Replace `-1d` with the window from the recency table.

Exclude issue keys already in bucket 1 when deduping before grouping.

## MCP fetch fields

Request at minimum: `key`, `summary`, `status`, `updated`, `Sprint`, `Team`, `Developer`, `assignee`.

## Verb hints for grouped task text

| Dominant Jira status in group | Suggested verb |
|-------------------------------|----------------|
| Ready for Development, In Execution, Opened | Finish |
| In Analysis | Review |
| PR Review | Review |
| Testing, Testing in DEV, Released in DEV | Unblock |

Example grouped line: `Follow up on **Czech contract withdrawal & easy return**: withdrawal on order detail; SFCC resources config; return email asset; footer translation`
