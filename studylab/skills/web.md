---
name: stack-ui
description: Design system and UI patterns for StudyLab. Load this alongside coding-rules when writing any UI code. Covers shadcn/ui component usage, Tailwind token conventions, layout rules, and visual do/don'ts from the StudyLab design system.
---

# UI Stack Profile

Load this **alongside coding-rules** when writing any component or page.

The authoritative design reference is `design-system/README.md` and `design-system/colors_and_type.css`.

---

## Components — always use shadcn/ui

Never build custom equivalents for primitives that shadcn/ui covers.

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
```

If a component isn't installed yet, add it with:
```bash
pnpm dlx shadcn@latest add <component-name>
```

---

## Icons — lucide-react only

```typescript
import { FileText, Plus, Trash2, ChevronRight } from 'lucide-react'

// Always explicit strokeWidth — never rely on defaults
<FileText className="size-5" strokeWidth={2} />

// Never use emoji in UI chrome. Never use custom SVGs if Lucide has it.
```

---

## Colors — semantic tokens only

Use shadcn-compatible semantic Tailwind classes. Never hardcode hex values.

| Token class | Usage |
|------------|-------|
| `bg-background` | Page background (`#F8FAFB`) |
| `bg-card` | Card surfaces (white) |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / helper text |
| `border-border` | All borders (`#E3E8ED`) |
| `bg-primary` / `text-primary` | Brand blue actions |
| `text-destructive` | Error states |

```tsx
// Good
<p className="text-muted-foreground text-sm">Noch keine Einträge.</p>

// Bad — hardcoded color
<p style={{ color: '#6b7280' }}>Noch keine Einträge.</p>
```

---

## Layout

### Page wrapper
```tsx
<div className="px-8 py-6">
  <div className="max-w-[960px]">
    {/* page content */}
  </div>
</div>
```

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Titel</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

Or raw div when shadcn Card is overkill:
```tsx
<div className="bg-card border border-border rounded-lg p-6">
  ...
</div>
```

### Spacing — 4px grid
All spacing must be multiples of 4px. Tailwind units: `p-1`=4px, `p-2`=8px, `p-4`=16px, `p-6`=24px, `p-8`=32px.

---

## Typography

| Font | Class | Usage |
|------|-------|-------|
| Plus Jakarta Sans | `font-sans` (default) | All UI text |
| Source Serif 4 | `font-serif` | Summary reader / reading view |
| JetBrains Mono | `font-mono` | Stats, numbers, code |

```tsx
// Page title
<h1 className="text-2xl font-semibold tracking-tight text-foreground">

// Section heading
<h2 className="text-base font-medium text-foreground">

// Body text
<p className="text-sm text-muted-foreground">

// Stat/number display
<span className="font-mono text-lg font-semibold">42</span>
```

---

## Empty states

Every list view needs an empty state. Standard pattern:

```tsx
<div className="flex flex-col items-center justify-center text-center py-16 px-8 rounded-lg border border-border bg-card">
  <SomeIcon className="size-10 text-slate-300 mb-4" strokeWidth={1.5} />
  <h2 className="text-base font-medium text-slate-700 mb-1">
    Noch keine Einträge
  </h2>
  <p className="text-sm text-muted-foreground max-w-xs">
    Erklärung was der User tun kann.
  </p>
</div>
```

---

## Interactions

- **Hover:** one shade darker — use `hover:bg-accent` or `hover:bg-muted`. Never `hover:opacity-75`.
- **Focus:** 2px ring in blue-500 — shadcn handles this automatically.
- **Disabled:** `disabled:opacity-50 disabled:cursor-not-allowed` — shadcn Button handles this.
- **Loading:** Show spinner or skeleton, never freeze the UI silently.

---

## Visual do/don'ts

| ❌ Never | ✅ Instead |
|---------|-----------|
| Gradients | Flat colors with subtle borders |
| Bounce / spring animations | `transition-colors duration-150` |
| Emoji in UI chrome | Lucide icons |
| Colored card backgrounds | White cards on `bg-background` |
| Multiple font weights per component | max 2: regular + semibold |
| Arbitrary values `text-[13px]` | Use scale: `text-xs`, `text-sm`, `text-base` |

---

## Language & copy

- German throughout: buttons, labels, errors, empty states
- "Du"-Anrede (informal)
- Sentence case: "Klausur erstellen" not "Klausur Erstellen"
- No emoji in UI text — not in buttons, labels, or headings
