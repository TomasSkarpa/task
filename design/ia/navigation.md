## Navigation and IA

**Site:** task.skarpa.dev

**Purpose:** Daily recyclable tasks. Homepage is today only.

### Routes (v1)

| Label | Route | Notes |
|-------|-------|-------|
| Today | `/` | Primary task list for the current day |
| History | `/history` | List of saved days with preview line |
| Day detail | `/history/YYYY-MM-DD` | Read-only task list for one day |

Header nav: **Today** · **History** (no footer nav in v1).

### Homepage states

| State | Content |
|-------|---------|
| Open day | Task list + Close day |
| Closed day | "Day is closed" placeholder |

### Terminology

- **Task** (never todo)
- **Close day** (never "archive" or "complete day")
- **Spillover** (internal/docs only; user sees "moves to tomorrow" in confirm modal)
