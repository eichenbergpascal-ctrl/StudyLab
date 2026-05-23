# StudyLab Design System

## Product Context

**StudyLab** is a web application for exam preparation (Klausurvorbereitung) aimed at German-speaking university students. Users upload their own lecture summaries as PDFs; the system then automatically generates flashcards (Karteikarten) and practice exercises (Übungsaufgaben) from them.

### Core Features
- **Dashboard** — Exam overview with upcoming deadlines, study progress, and recent activity
- **Karteikarten-Sessions** — Interactive flashcard study sessions with spaced repetition
- **Probeklausuren** — Practice exams with multiple question types (multiple choice, free text, matching)
- **Fehler-Tracking** — Tracks wrong answers to surface weak areas for targeted review
- **Zusammenfassungs-Viewer** — Summary reader with progress indicator and highlighted sections

### Design Philosophy
StudyLab is a **focused, distraction-free study tool** — not a social network. The interface should feel functional and elegant, like a well-designed instrument for learning. Key influences: Notion (clean structure), Linear (functional elegance), Arc Browser (modern polish).

### Tech Stack
- **Frontend:** React + shadcn/ui (Radix UI) + Tailwind CSS
- **Theming:** CSS custom properties, HSL color format (shadcn-compatible)
- **Icons:** Lucide (default icon set for shadcn/ui)

### Sources
This design system was created from a product brief and design direction document. No existing codebase, Figma file, or production assets were provided — all foundations were designed from the brief's requirements and the specified design inspirations (Notion, Linear, Arc Browser).

---

## CONTENT FUNDAMENTALS

### Tone & Voice
- **Functional, clear, encouraging.** Copy should feel like a helpful study partner, not a marketing pitch.
- **Direct "du" address** (German informal) — the audience is students. Use "Deine Klausuren", "Dein Fortschritt", not "Ihre".
- **Short, scannable.** Labels are 1–3 words. Descriptions are 1 sentence max. The user is here to study, not to read UI copy.
- **No exclamation marks in UI labels.** Restrained punctuation. Exclamation marks only in success states ("Richtig!" after a correct answer).

### Casing
- **Sentence case** for all UI text, headings, descriptions
- **Title case** only for the product name "StudyLab"
- German nouns stay capitalized per grammar rules

### Emoji
- **Never in UI chrome.** No emoji in navigation, labels, buttons, or headers.
- Acceptable only inside user-generated content (e.g., a user's exam name) and possibly in empty states as illustration substitutes, but this should be rare.

### Key Vocabulary
| German (primary)          | English fallback        |
|---------------------------|-------------------------|
| Karteikarten              | Flashcards              |
| Probeklausur              | Practice exam           |
| Zusammenfassung           | Summary                 |
| Fehler-Tracking           | Error tracking          |
| Richtig / Falsch          | Correct / Wrong         |
| Fortschritt               | Progress                |
| Nächste Klausur           | Next exam               |
| Wiederholen               | Review / Repeat         |
| Aufdecken                 | Reveal (flip card)      |

### Example Copy
- Empty state: "Noch keine Zusammenfassungen hochgeladen. Lade ein PDF hoch, um loszulegen."
- Button: "Weiter" (not "Nächste Frage →")
- Stat label: "Richtige Antworten" (concise)
- Success: "Richtig!"
- Encouragement: "7 Tage in Folge gelernt" (streak)

---

## VISUAL FOUNDATIONS

### Color System
A calm, non-fatiguing palette designed for extended study sessions.

- **Primary Blue** (`#5178C0`) — Used for primary actions, links, focus rings, active states. A medium-saturation blue that's easy on the eyes. Not neon, not corporate.
- **Neutral Slate** — Slightly blue-tinted grays (`#F8FAFB` → `#13171E`). Warmer than pure gray, cooler than zinc. Used for all text, borders, and backgrounds.
- **Success Green** (`#36A06E`) — Correct answers, completed items, positive progress.
- **Warning Amber** (`#D4960A`) — Approaching deadlines, partial scores, alerts.
- **Error Red** (`#DC4A4A`) — Wrong answers, failed states, destructive actions.

### Typography
Three font families serving distinct roles:

| Role | Font | Usage |
|------|------|-------|
| **UI Sans** | Plus Jakarta Sans | All interface text — headings, labels, buttons, navigation |
| **Reading Serif** | Source Serif 4 | Summary viewer, long-form notes, study materials |
| **Monospace** | JetBrains Mono | Statistics, code snippets, timestamps, tabular data |

**Type scale:** Based on `1rem = 16px`, using a musical-third-inspired scale from `xs` (12px) to `5xl` (48px). Headings use tight letter-spacing (`-0.025em`); body text uses normal tracking.

**Font weights:** Light (300) through ExtraBold (800). UI text primarily uses Regular (400) and Medium (500); headings use Semibold (600) and Bold (700).

**⚠️ Font substitution note:** Both Plus Jakarta Sans and Source Serif 4 are sourced from Google Fonts. If the brand acquires custom typefaces in the future, update the `@import` in `colors_and_type.css` and the `--font-sans` / `--font-serif` variables.

### Spacing
- **4px base grid.** All spacing is a multiple of 4px.
- Token scale: `0.5` (2px), `1` (4px), `1.5` (6px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px), `16` (64px), `20` (80px), `24` (96px).
- Standard component padding: `8px 16px` (buttons), `12px 16px` (inputs), `16px` (cards).

### Backgrounds
- **Page background:** `#F8FAFB` (slate-50) — very subtle warm-cool gray
- **Card/surface:** `#FFFFFF` with 1px `#E3E8ED` border
- **Active/selected:** `#F1F5FB` (blue-50)
- **No gradients.** Backgrounds are flat, solid colors.
- **No patterns or textures.** Clean, empty space.
- **No full-bleed images** in the app chrome. Images only appear in user-uploaded content.

### Borders & Corners
- **Border color:** `#E3E8ED` (slate-200) — 1px solid, never thicker
- **Border radii:** `xs` 4px (badges), `sm` 6px (buttons, inputs), `md` 8px (cards, default), `lg` 12px (modals), `xl` 16px (larger panels), `full` for pills
- **No colored left-border accents.** Cards are outlined uniformly.

### Shadows
Extremely subtle, Notion-style elevation:
- `xs` — barely visible, for hover states on flat elements
- `sm` — default card shadow (only used when cards don't have borders)
- `md` — dropdowns, popovers
- `lg` — modals, overlays
- `xl` — rarely used; only for dramatic floating elements
- Shadow color: `rgba(30, 36, 46, 0.04–0.07)` — uses the foreground color at very low opacity, not pure black

### Animation & Transitions
- **Duration:** `100ms` (hover), `150ms` (default), `250ms` (larger transitions like modals)
- **Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` — a natural, slightly springy default
- **No bounces, no dramatic animations.** Everything is smooth and fast.
- **Opacity transitions:** Used sparingly for fade-in/out of tooltips and toasts
- **No parallax, no scroll-triggered animations.** The app must feel stable and grounded.

### Hover & Press States
- **Buttons:** Darken background by one shade on hover (e.g., blue-500 → blue-600). No opacity change.
- **Ghost buttons / links:** Show subtle background fill on hover (`slate-100`)
- **Cards:** No hover shadow change by default. Interactive cards may show `shadow-xs` on hover.
- **Press:** No shrink/scale. Darken by one additional shade from hover state.
- **Focus:** 2px ring in `blue-500` with 2px offset — visible, accessible, not garish.

### Transparency & Blur
- **Minimal usage.** No frosted-glass effects in the main UI.
- **Modal overlay:** `rgba(30, 36, 46, 0.4)` — dark enough to focus attention, not fully opaque.
- **No backdrop-filter blur** unless needed for a future mobile viewport.

### Imagery
- **No decorative imagery in the UI.** The app is tool-first.
- **User content (PDFs)** is displayed in the summary viewer with the serif reading font.
- **Empty states:** Use simple text with a single neutral icon, not illustrations.
- **If illustrations are ever introduced:** Cool-neutral tone, thin-line style, single accent color. No warm/saturated illustrations, no 3D renders.

### Layout Rules
- **Sidebar + Main content** layout pattern (like Notion/Linear)
- Sidebar width: fixed at `240px`, collapsible
- Main content: centered with `max-width: 960px` for reading; full-width for dashboard grids
- **Consistent page padding:** `32px` horizontal, `24px` vertical
- **Grid:** Dashboard uses a responsive grid with `16px` gap; cards are equal-height

---

## ICONOGRAPHY

### Icon System
StudyLab uses **Lucide** icons — the default icon set for shadcn/ui. Lucide is an open-source icon library with consistent 24×24 viewbox, 2px stroke weight, and round line caps.

**CDN link:**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lucide-static@latest/font/lucide.min.css">
```

**Or as React components:**
```bash
npm install lucide-react
```

### Usage Guidelines
- **Stroke weight:** Always 2px (default). Never 1px or 3px.
- **Size:** 16px in navigation and inline; 20px in buttons; 24px for standalone icons; 32px+ only in empty states.
- **Color:** Inherit from parent text color. Primary-colored icons only for active/selected states.
- **No filled icons.** Always use outline/stroke variants for consistency.
- **No custom SVGs** unless absolutely necessary — pick from Lucide's 1000+ icons first.
- **No emoji as icons.** No unicode symbols as icon substitutes.

### Key Icons Used
| Context              | Lucide Icon        |
|----------------------|--------------------|
| Dashboard            | `layout-grid`      |
| Flashcards           | `layers`           |
| Practice Exams       | `check-square`     |
| Summaries            | `file-text`        |
| Error Tracking       | `alert-circle`     |
| Upload               | `upload`           |
| Settings             | `settings`         |
| Search               | `search`           |
| Progress             | `trending-up`      |
| Calendar/Deadline    | `calendar`         |
| Correct/Success      | `check`            |
| Wrong/Error          | `x`                |
| Flip card            | `rotate-ccw`       |
| Next                 | `arrow-right`      |
| Menu/Sidebar toggle  | `panel-left`       |

### Logo
The StudyLab logo consists of:
- **Wordmark:** "StudyLab" in Plus Jakarta Sans Bold, with "Lab" in primary blue
- **Icon mark:** Three overlapping card shapes with progressive opacity — representing stacked flashcards / layers of knowledge
- **Variants:** Default (dark text), inverse (white on dark), icon-only

Logo files:
- `assets/logo.svg` — Full wordmark, default
- `assets/logo-icon.svg` — Icon mark only
- `assets/logo-white.svg` — Inverse for dark backgrounds

---

## File Index

### Root
| File | Description |
|------|-------------|
| `README.md` | This file — full design system documentation |
| `SKILL.md` | Agent skill definition for AI-assisted design |
| `colors_and_type.css` | All CSS custom properties: colors, type, spacing, shadows, transitions |

### `assets/`
| File | Description |
|------|-------------|
| `logo.svg` | Full wordmark logo (dark text) |
| `logo-icon.svg` | Icon mark only |
| `logo-white.svg` | Inverse wordmark for dark backgrounds |

### `preview/`
Design System tab preview cards — 18 cards covering colors, type, spacing, and components.

| File | Group | Description |
|------|-------|-------------|
| `colors-primary.html` | Colors | Primary blue scale (50–950) |
| `colors-neutral.html` | Colors | Neutral slate scale |
| `colors-semantic.html` | Colors | Success, warning, error, info |
| `colors-surfaces.html` | Colors | Surface/background tokens |
| `type-sans.html` | Type | Plus Jakarta Sans specimen |
| `type-serif.html` | Type | Source Serif 4 specimen |
| `type-mono.html` | Type | JetBrains Mono specimen |
| `type-scale.html` | Type | Full type scale with German copy |
| `spacing-radii.html` | Spacing | Border radius scale |
| `spacing-shadows.html` | Spacing | Elevation / shadow system |
| `spacing-tokens.html` | Spacing | 4px grid spacing tokens |
| `component-buttons.html` | Components | Button variants and sizes |
| `component-inputs.html` | Components | Form controls |
| `component-cards.html` | Components | Stat, exam, and flashcard cards |
| `component-badges.html` | Components | Badges, pills, status dots |
| `component-progress.html` | Components | Progress bars, ring, streak |
| `component-navigation.html` | Components | Sidebar, tabs, breadcrumbs |
| `brand-logo.html` | Brand | Logo variants display |

### `ui_kits/web-app/`
High-fidelity interactive recreation of the StudyLab web application.

| File | Description |
|------|-------------|
| `README.md` | UI kit documentation and component list |
| `index.html` | Main entry — interactive click-through prototype |
| `Components.jsx` | Shared low-level components (Button, Input, Badge, etc.) |
| `Sidebar.jsx` | App sidebar navigation |
| `Dashboard.jsx` | Dashboard view with stats and exam cards |
| `FlashcardSession.jsx` | Flashcard study session with flip interaction |
| `QuizView.jsx` | Practice exam with question types |
| `SummaryViewer.jsx` | PDF summary reader with progress |
