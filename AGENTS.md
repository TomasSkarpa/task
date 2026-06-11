# AGENTS.md

Routing context for AI assistants working in **skarpa_task**.

**Site:** [task.skarpa.dev](https://task.skarpa.dev/) (planned)

Daily **tasks** (never "todos"). One day per JSON file. Recyclable via spillover on day close.

## Stack

- SvelteKit 2 + Svelte 5 (runes), `@sveltejs/adapter-auto`
- shadcn-svelte (`src/lib/components/ui/`) + Tailwind CSS v4
- Node **≥ 22.12.0**

## Where to look

| Task | Start here |
|------|------------|
| Design directive (master) | `design/DIRECTIVE.md` |
| Day/task data | `data/days/YYYY-MM-DD.json` |
| Data contract | `data/schema/day.schema.json` |
| UI labels | `content/textations/site.md` |
| Day read/write logic | `src/lib/server/day-store.ts` |
| Homepage | `src/routes/+page.svelte` |
| Light/dark theme | `src/lib/theme.ts`, `ThemeToggle.svelte`, `layout.css` |
| Tokens, IA, voice | `design/tokens/`, `design/ia/`, `design/content/` |
| Jira sync workflow (propose → confirm → API) | `.cursor/skills/sync-day-from-jira/SKILL.md` |
| Close day workflow | `.cursor/skills/close-day/SKILL.md` |

## Data workflow

1. **Today** is `Europe/Prague` calendar date (`day-store.ts`).
2. Edit or create `data/days/<date>.json` following `data/schema/day.schema.json`.
3. Task text: short action line; wrap emphasis in `**like this**`.
4. Use **task** terminology in code, copy, and commits. Never **todo**.

## AI commands

| User says | Skill |
|-----------|-------|
| `/sync-day`, sync from Jira | `sync-day-from-jira` (Phase 1: proposals in chat only) |
| `create all` / `create 1,3,4` after sync | `sync-day-from-jira` Phase 2 → `POST /api/task/sync-jira` on task.skarpa.dev |
| `/close-day`, close today | `close-day` |
| Add/mark tasks | Edit `data/days/<date>.json` directly |

**Jira sync:** Phase 1 does not write files. Phase 2 writes via `POST https://task.skarpa.dev/api/task/sync-jira` (Vercel Blob). Local dev without `BLOB_READ_WRITE_TOKEN` falls back to `data/days/`. Commit data files only when explicitly asked.

## Day lifecycle

- `status: open` → tasks editable; **Close day** available in UI
- `status: closed` → homepage shows **Day is closed**; open tasks copied to next day
- `closedBy: manual | auto` records how the day closed

Spillover logic is in `closeDay()` in `day-store.ts`. Skills must mirror that logic when editing files without the API.

## Commands

```bash
npm install
npm run dev      # localhost:5173, API writes to data/days/
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
