# StudyLab Web App — UI Kit

## Overview
High-fidelity interactive recreation of the StudyLab web application. This kit provides click-through screens demonstrating the core product experience.

## Screens
1. **Dashboard** — Exam overview, stats, upcoming exams, recent activity
2. **Flashcard Session** — Interactive flashcard with flip, progress, controls
3. **Practice Exam** — Multiple choice + free text questions with scoring
4. **Summary Viewer** — Long-form reading with progress bar and table of contents

## Components
All shared UI primitives live in `Components.jsx`:
- `Button` — Primary, secondary, ghost, destructive variants + sizes
- `Badge` — Colored status badges
- `Card` — Standard card container
- `Input` / `Select` — Form controls
- `Toggle` — Switch control
- `ProgressBar` — Horizontal progress indicator
- `StatCard` — Metric display with label, value, and optional bar
- `IconBtn` — Icon-only button
- `NavItem` — Sidebar navigation item

## Usage
Open `index.html` to see the full interactive prototype. Click sidebar items to navigate between screens. The prototype uses React 18 + Babel for inline JSX transpilation and references `../../colors_and_type.css` for design tokens.

## Design Width
- Sidebar: 240px fixed
- Content max-width: varies by screen (960px for reading, full for dashboard)
- Minimum viewport: 1024px
