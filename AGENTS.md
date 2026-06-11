# AGENTS.md

Routing context for AI assistants working in **skarpa_task**.

**Site:** [task.skarpa.dev](https://task.skarpa.dev/)

Daily **tasks** (never "todos"). One day on the homepage. Recyclable via spillover on day close.

## Stack

- SvelteKit 2 + Svelte 5 (runes), `@sveltejs/adapter-vercel`
- shadcn-svelte (`src/lib/components/ui/`) + Tailwind CSS v4
- Node **≥ 22.12.0**
- Persistence: **Vercel Blob** (`days/YYYY-MM-DD.json` in Blob store)

## Where to look

| Task | Start here |
|------|------------|
| Design directive (master) | `design/DIRECTIVE.md` |
| Data contract | `data/schema/day.schema.json` |
| Blob read/write | `src/lib/server/day-persistence.ts` |
| Day logic | `src/lib/server/day-store.ts` |
| API routes | `src/routes/api/` |
| UI labels | `content/textations/site.md` |
| Homepage | `src/routes/+page.svelte` |
| Light/dark theme | `src/lib/theme.ts`, `ThemeToggle.svelte`, `layout.css` |
| Tokens, IA, voice | `design/tokens/`, `design/ia/`, `design/content/` |
| Jira sync (propose → confirm → API) | `.cursor/skills/sync-day-from-jira/SKILL.md` |
| Add manual task (API) | `.cursor/skills/add-task/SKILL.md` |
| Fragment task (split one row) | `.cursor/skills/fragment-task/SKILL.md` |
| Close day (API) | `.cursor/skills/close-day/SKILL.md` |
| Remove tasks (API) | `.cursor/skills/remove-tasks/SKILL.md` |

## Data workflow

1. **Today** is `Europe/Prague` calendar date (`day-store.ts`).
2. All reads/writes go through API → Blob. **Never** edit day JSON on disk.
3. Task text: short action line; wrap emphasis in `**like this**`.
4. Use **task** terminology in code, copy, and commits. Never **todo**.

## AI commands

| User says | Action |
|-----------|--------|
| `/sync-day`, sync from Jira | `sync-day-from-jira` Phase 1: proposals in chat |
| `create all` / `create 1,3,4` | Phase 2 → `POST https://task.skarpa.dev/api/task/sync-jira` |
| `/close-day`, close today | `close-day` → `POST https://task.skarpa.dev/api/day/close` |
| `/remove-tasks`, `remove 1,3` | `remove-tasks` → `GET /api/day`, then `POST /api/task/remove` |
| `/add-task`, add task | `add-task` → `GET /api/day`, then `POST /api/task/add` |
| `/fragment-task`, split task N | `fragment-task` Phase 1: propose; **split all** → add fragments + remove parent |
| Mark task done | `POST https://task.skarpa.dev/api/task/toggle` |

## Day lifecycle

- `status: open` → tasks editable; **Close day** available in UI
- `status: closed` → homepage shows **Day is closed**; open tasks copied to next day
- `closedBy: manual | auto` records how the day closed

Spillover logic is in `closeDay()` in `day-store.ts`. Skills call the API; do not duplicate file edits.

## Commands

```bash
npm install
vercel env pull   # required for local API/Blob access
npm run dev       # localhost:5173
npm run build
npm run check
```

## Svelte

- Svelte 5 runes in `src/`
- Prefer site components: `DayShell`, `TaskRow`, `CloseDayDialog`, `EmphasisText`, `ThemeToggle`
- Use Svelte MCP `svelte-autofixer` when editing `.svelte` files

## Conventions

- Minimal diffs; match existing patterns
- No em dashes in new UI copy
- Layout: `DayShell` / `.site-container` (40rem)
- UI changes: verify **light and dark mode** (see `design/DIRECTIVE.md` §6)
- Commits only when explicitly requested
