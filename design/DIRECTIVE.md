# Design directive

Master design document for **task.skarpa.dev**. Combines the general ruleset (layered principles, tokens, IA, a11y) with product-specific decisions for daily recyclable **tasks**.

---

## 1. Product purpose

**task.skarpa.dev** is a single-purpose daily task surface. Not a generic todo app.

| Goal | Detail |
|------|--------|
| **Daily focus** | Homepage shows **today only**. No backlog clutter on the main view. |
| **Recyclable tasks** | Open tasks **spill over** to the next day when a day closes. |
| **Two close modes** | **Manual close** (user confirms) or **auto close** (day boundary rolls open tasks forward). |
| **AI-maintained** | Cursor skills mutate tasks via API; persistence is Vercel Blob. |
| **Jira bridge** | A skill pulls open Jira work into today's task list via Atlassian MCP. |

**Terminology:** Use **task** everywhere. Never **todo** in UI, code names, or docs.

---

## 2. Layered design system

| Layer | Location | Role |
|-------|----------|------|
| Principles | `.cursor/rules/core/` | UX, IA, a11y, Cursor guardrails |
| Implementation | `.cursor/rules/frontend/` | Layout, forms, flows, accessibility |
| Product tokens | `design/tokens/` | Color, typography, spacing |
| Product IA | `design/ia/navigation.md` | Routes and labels |
| Product voice | `design/content/voice-and-tone.md` | UI chrome and task copy tone |
| Component patterns | `design/patterns/components.md` | Named UI blocks |
| Data contract | `data/schema/` | JSON shape for days and tasks |
| AI workflows | `.cursor/skills/` | Jira sync, close day, task updates |

When in doubt: principles in core rules, product specifics in `design/`, data contract in `data/schema/`, workflows in skills.

---

## 3. Core UX principles

Grounded in **Nielsen's heuristics**:

- **Visibility of system status**: day open/closed, task done/open, sync and close in progress.
- **Match real-world conventions**: check to complete, confirm before destructive close.
- **Error prevention and recovery**: double confirm before close day; spillover is explicit, not silent loss.

Also:

- **Low cognitive load**: one screen, one day, minimal chrome.
- **Progressive disclosure**: confirm modal only on close; no settings on homepage.
- **Mental model**: "Today is a sheet of tasks. Close the day, open tasks move to tomorrow."

When speed, aesthetics, and accessibility conflict, do not silently drop accessibility or clarity.

---

## 4. Information architecture

**Shallow hierarchy** (2 levels for today + history):

```
/ (Today)
/history (Past days)
/history/YYYY-MM-DD (Day detail, read-only)
```

Settings remain out of scope until needed.

### Homepage (`/`)

| State | UI |
|-------|-----|
| Day **open** | Date label, task list, close-day control |
| Day **closed** | **"Day is closed"** placeholder; no task editing |
| Empty open day | Short empty state; still allow close |

### Labels

- Page title: **Today**
- Close flow: **Close day** → modal **Close this day?**
- Confirm: **Close day** (destructive) / **Keep working**
- Carried tasks: metadata **From yesterday** (or source date)
- Status: **Day is closed**

Noun-based, present tense, no jargon.

---

## 5. Day and task lifecycle

### Day states

| Status | Meaning |
|--------|---------|
| `open` | Tasks can be checked; day can be closed manually |
| `closed` | Read-only; homepage shows closed placeholder |

### Close modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `manual` | User double-confirms close | Set `status: closed`, `closedBy: manual`, move open tasks to next day |
| `auto` | Cron/skill at day boundary (e.g. 00:00 Europe/Prague) | Same spillover; `closedBy: auto` |

### Task states

| Status | Meaning |
|--------|---------|
| `open` | Active for today |
| `done` | Completed; does not spill over |

### Spillover rules

1. On close, every task with `status: open` is copied to **next calendar day**.
2. Spillover tasks get `source: carryover`, `carriedFrom: <closed-day-date>`.
3. Duplicate by `id` or `jiraKey` on the target day: update in place, do not duplicate.
4. Done tasks stay on the closed day only (historical record).

### Data location

One JSON document per calendar day in **Vercel Blob** (`days/YYYY-MM-DD.json`).

See `data/schema/day.schema.json` for the shape. Mutations go through API routes only.

---

## 6. Visual system

**Aesthetic:** Flat ink on paper. Light surfaces, near-black text, no gradients. Same family as skarpa.dev CV dossier, tuned for **speed and focus**.

### Color modes (required)

Every UI change must support **light and dark mode**:

| Mode | Default | Mechanism |
|------|---------|-----------|
| **Light** | Yes (also when no stored preference and OS prefers light) | `:root` tokens in `layout.css` |
| **Dark** | When user toggles or OS prefers dark (until user picks explicitly) | `.dark` on `html`, warm inverted ink-on-paper tokens |

- **Toggle:** `ThemeToggle` in site header (ghost icon button). Persists choice in `localStorage` (`skarpa-task-theme`).
- **No flash:** Inline script in `app.html` applies `.dark` before paint; keep logic in sync with `src/lib/theme.ts`.
- **Components:** Use semantic Tailwind tokens (`bg-background`, `text-muted-foreground`, etc.). Do not hardcode light-only hex in Svelte files.
- **Testing:** Manually verify new or changed UI in **both** modes (contrast, borders, destructive states, modal backdrop). Treat missing dark support as incomplete work.

See `design/tokens/colors.md` for light and dark token tables.

### Color (`design/tokens/colors.md`)

- Light surfaces: page `#f7f7f5`, subtle `#ececea`, elevated `#ffffff`
- Light text: default `#0a0a0a`, muted `#5c5c5c`
- Dark: warm near-black surfaces with off-white text (see token doc)
- Accent: near-black (light) / near-white (dark) for primary actions
- Errors / destructive: shared destructive token with mode-appropriate backgrounds
- Contrast: AA minimum in **both** modes; AAA for primary text where feasible

### Typography (`design/tokens/typography.md`)

- **IBM Plex Sans** for UI and task text
- **IBM Plex Mono** for dates and Jira keys only
- Hierarchy via size and weight, not color noise
- `--font-scale: 1.075` on `html`
- One `heading-xl` on homepage (Today + date)

### Spacing (`design/tokens/spacing.md`)

- 4px base unit
- `content-width: 40rem` slim column
- Larger gaps between day header, task list, and actions than between task rows

### Emphasis in task text

Wrap important words in `**double asterisks**` in JSON. UI renders via `EmphasisText` (bold, `text-foreground`). Use for Jira keys, deadlines, or blocking terms, not whole sentences.

### Interaction states (`design/tokens/interaction-states.md`)

Every interactive control needs hover, active (press), and focus-visible feedback in **both** color modes.

| Element | Hover | Active | Focus |
|---------|-------|--------|-------|
| **Task row** | `bg-accent/20` | `bg-accent/35`, `translate-y-px` | checkbox native focus |
| **Buttons** | shadcn variant fills | `translate-y-px` (base) | `focus-visible:ring-3` |
| **Inputs** | border unchanged | n/a | `focus-visible:ring-3` |
| **Theme toggle** | ghost button hover | ghost button active | same as buttons |

Task rows use `task-row-surface` from `layout.css`. Do not rely on color alone for done vs open (checkbox + strikethrough).

---

## 7. Component patterns

| Block | Usage |
|-------|--------|
| `theme-toggle` | Header control; light/dark switch, persists preference |
| `day-shell` | Page container, max 40rem |
| `day-header` | Today label + date + open/closed badge |
| `day-closed` | Placeholder when day is closed |
| `task-list` | Vertical list of tasks |
| `task-row` | Checkbox, emphasis text, carryover meta |
| `close-day` | Primary outline button → confirm dialog |
| `close-day-dialog` | Modal: summary of open task count, confirm/cancel |

Stack: Svelte 5 runes, shadcn-svelte primitives, Tailwind v4.

---

## 8. Voice and content

### Task copy

- Short, actionable, first line is the verb
- Specific: `Review **ECOM-4821** checkout hook` not `Work on tickets`
- No filler: avoid "sync", "align", "leverage" unless literal

### UI chrome (`content/textations/site.md`)

- Plain, direct, calm errors
- No em dashes in new copy

### AI-authored tasks

When syncing from Jira, format as:

```
<verb> **<KEY>** <short summary>
```

Example: `Finish **SFCC-1204** Constructor facet mapping`

---

## 9. Close day interaction (double confirm)

1. **First step:** User clicks **Close day** (outline or secondary; visible only when day is `open`).
2. **Second step:** Modal opens with:
   - Title: **Close this day?**
   - Body: count of open tasks that will move to tomorrow
   - Actions: **Keep working** (default focus) / **Close day** (destructive)
3. On confirm: API or skill runs spillover, day becomes `closed`, UI shows **Day is closed**.

Keyboard: focus trap in modal, Escape cancels, visible focus rings.

---

## 10. Accessibility

- Target **WCAG 2.1 AA**
- Semantic list for tasks (`ul` / `li` or `role="list"`)
- Checkboxes with accessible labels tied to task text
- Modal: `role="dialog"`, `aria-modal`, labelled title
- Do not use color alone for done vs open (checkbox + strikethrough/muted text)

---

## 11. AI workflow design

### Commands (user-facing)

| Command / skill | Purpose |
|-----------------|--------|
| `/sync-day` or skill `sync-day-from-jira` | Phase 1: propose grouped tasks in chat; Phase 2: `POST /api/task/sync-jira` on task.skarpa.dev |
| `/close-day` or skill `close-day` | Close today (or given date), spill open tasks |
| Natural language in Cursor | "Add task …", "Mark done", "Remove task …" → `POST` task API on task.skarpa.dev |

### Rules for agents

- Read `AGENTS.md` and `data/schema/day.schema.json` before editing tasks
- Never rename "task" to "todo"
- Preserve existing task `id` and `jiraKey` on merge
- Jira sync does not require a git commit; production persists via Vercel Blob

### Jira sync criteria (default)

- Site: `bataeurope.atlassian.net`, project `FSP`
- Squad: Aftersales Avengers (`Team[Team]` UUID in skill jql-reference)
- **Developer** = current user (not assignee)
- Pending-action statuses only (dev, PR review, test on dev/sandbox)
- Sprint-aware buckets: in `openSprints()`, out of sprint, recent out-of-sprint follow-up (report)
- Full JQL: `.cursor/skills/sync-day-from-jira/jql-reference.md`

---

## 12. Technical stack

- SvelteKit 2 + Svelte 5 (runes)
- `@sveltejs/adapter-vercel` (SSR + API on Vercel)
- shadcn-svelte + Tailwind CSS v4
- Node ≥ 22.12.0
- Deploy target: **task.skarpa.dev** (Vercel)

**Persistence:** Vercel Blob. All skills and UI use API routes; no git-tracked day files.

---

## 13. Anti-patterns

- Multi-column dashboard on homepage
- Backlog + today on the same view
- Silent spillover without user awareness on manual close
- Color-only task status
- Generic "My Tasks" marketing tone
- Inventing tasks not grounded in Jira or explicit user input during sync

---

## 14. Research alignment

| Finding | Decision |
|---------|----------|
| Users need one daily focus | Homepage = today only |
| Open work must not disappear | Spillover on close |
| AI is primary editor | API + skills + schema |
| Low friction | Minimal nav, no account UI in v1 |

---

## 15. File map

```
design/DIRECTIVE.md          ← this file
design/tokens/*.md
design/ia/navigation.md
design/content/voice-and-tone.md
data/schema/day.schema.json
content/textations/site.md
.cursor/skills/sync-day-from-jira/
.cursor/skills/close-day/
AGENTS.md
```
