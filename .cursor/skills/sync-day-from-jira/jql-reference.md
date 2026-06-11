# Jira JQL reference (sync-day-from-jira)

## Default

```
assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC
```

## Variants

**Single project:**

```
assignee = currentUser() AND project = ECOM AND statusCategory != Done ORDER BY updated DESC
```

**In progress only:**

```
assignee = currentUser() AND status in ("In Progress", "In Review") ORDER BY updated DESC
```

**Updated this week:**

```
assignee = currentUser() AND statusCategory != Done AND updated >= -7d ORDER BY updated DESC
```

Replace `currentUser()` with explicit account if MCP requires it.
