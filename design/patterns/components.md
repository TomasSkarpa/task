## Component patterns

| Block | File | Usage |
|-------|------|-------|
| `theme-toggle` | `ThemeToggle.svelte` | Header light/dark switch; uses `src/lib/theme.ts` |
| `day-shell` | `DayShell.svelte` | 40rem content column |
| `day-header` | `+page.svelte` | Today + date |
| `day-closed` | `+page.svelte` | Closed placeholder |
| `task-list` | `+page.svelte` | Task ul |
| `task-row` | `TaskRow.svelte` | Checkbox + emphasis text |
| `add-task` | `AddTaskForm.svelte` | Text input + submit when day is open |
| `close-day-dialog` | `CloseDayDialog.svelte` | Double confirm modal |
| `emphasis-text` | `EmphasisText.svelte` | `**bold**` parsing |
| `task-row-surface` | `layout.css` | Task row hover, active, focus-within |

Interaction states: `design/tokens/interaction-states.md`. Task rows use `task-row-surface`; buttons use shadcn variants.
