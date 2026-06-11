## Navigation and IA

**Site:** task.skarpa.dev

**Purpose:** Daily recyclable tasks. Homepage is today only.

### Routes (v1)

| Label | Route | Notes |
|-------|-------|-------|
| Today | `/` | Only primary route in v1 |

No header nav in v1. Footer may show date and site name only.

### Homepage states

| State | Content |
|-------|---------|
| Open day | Task list + Close day |
| Closed day | "Day is closed" placeholder |

### Terminology

- **Task** (never todo)
- **Close day** (never "archive" or "complete day")
- **Spillover** (internal/docs only; user sees "moves to tomorrow" in confirm modal)
