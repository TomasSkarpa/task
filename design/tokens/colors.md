## Color tokens

Flat ink on paper. Light surfaces, near-black text, no gradients. **Both light and dark modes** use the same semantic roles; values invert for dark.

### Light mode (default)

| Token | Value | Usage |
|-------|-------|-------|
| `color-bg-surface` | `#f7f7f5` | Page background |
| `color-bg-subtle` | `#ececea` | Grouped sections |
| `color-bg-elevated` | `#ffffff` | Cards, task rows |
| `color-fg-default` | `#0a0a0a` | Primary text |
| `color-fg-muted` | `#5c5c5c` | Secondary text, metadata |
| `color-accent-primary` | `#0a0a0a` | Primary actions |
| `color-border-subtle` | `#d4d4d0` | Dividers |
| `color-border-critical` | `#b91c1c` | Destructive confirm |
| `color-bg-critical-subtle` | `#fef2f2` | Destructive backgrounds |

### Dark mode (`.dark` on `html`)

Warm ink on dark paper. Same hierarchy as light; no pure `#000` page fill.

| Token | Role | Usage |
|-------|------|-------|
| `color-bg-surface` | ~`oklch(0.16 0.008 90)` | Page background |
| `color-bg-subtle` | ~`oklch(0.24 0.008 90)` | Muted sections, done tasks |
| `color-bg-elevated` | ~`oklch(0.2 0.008 90)` | Cards, task rows, popover |
| `color-fg-default` | ~`oklch(0.95 0.005 90)` | Primary text |
| `color-fg-muted` | ~`oklch(0.68 0.015 90)` | Secondary text, metadata |
| `color-accent-primary` | ~`oklch(0.93 0.005 90)` | Primary actions, checkboxes |
| `color-border-subtle` | ~12% foreground alpha | Dividers, row borders |
| `color-border-critical` | destructive token | Destructive confirm |
| `color-bg-critical-subtle` | destructive / 20% | Destructive backgrounds |

Implementation: CSS custom properties in `src/routes/layout.css` (`:root` and `.dark`). UI components use Tailwind semantic tokens (`bg-background`, `text-foreground`, etc.), not raw hex in components.

### Contrast

- Light: primary text on surface ~18:1 (AAA); muted ~5.5:1 (AA).
- Dark: same AA minimum for body and muted text on surface.
- Test both modes before shipping UI changes.
