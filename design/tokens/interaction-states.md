## Interaction states

Flat ink on paper. Feedback is subtle: fill shifts, underlines, or a 1px press, never glow or bounce.

All interactive elements need **default**, **hover**, **active** (press), and **focus-visible** (keyboard). Disabled elements skip hover/active.

### Principles

| State | Purpose | Treatment |
|-------|---------|-----------|
| **Hover** | Pointer is over a control | Light accent fill or step text toward `foreground` |
| **Active** | Control is pressed | Slightly stronger fill than hover, or `translate-y-px` on buttons |
| **Focus-visible** | Keyboard focus | `ring-3 ring-ring/50`, no outline; same as shadcn `Button` |
| **Disabled** | Not available | `opacity-50`, `pointer-events-none` on controls |

Use `transition-colors` or `transition-all` on interactive surfaces. Task done/open uses checkbox + strikethrough, not color alone.

### Semantic tokens

| Token | Role |
|-------|------|
| `color-accent-primary-hover` | Primary controls on hover |
| `color-accent-primary-active` | Primary controls on press |
| `color-surface-hover` | Task rows, cards at ~20% accent |
| `color-surface-active` | Task rows, cards at ~35% accent |

Implementation: Tailwind semantic tokens in `src/routes/layout.css`. Components use classes from that file or shadcn variants, not raw hex in Svelte files.

### Component classes (`layout.css`)

| Class | Usage |
|-------|--------|
| `task-row-surface` | Clickable task row label (checkbox + text) |

`Button`, `Input`, and shadcn primitives keep their variant hover/active rules.

### Contrast

Hover and active fills must keep text at **AA** against the surface in **light and dark** mode. Focus rings must be visible on `background` and `card`.
