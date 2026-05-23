---
name: architect
description: Plan the file structure and implementation approach before writing any code. Use this skill after spec-reader confirms the go-ahead. Never skip this — planning before coding prevents structural mistakes that are hard to undo.
---

# Architect

Read this skill **after spec-reader** and user confirmation. Still no code yet.

## Your job

Present a clear implementation plan. The user should be able to read it in 60 seconds and understand exactly what will be built.

---

### 1. File & folder structure

Show every file that will be created or modified. Use a tree format:

```
src/
├── app/(dashboard)/exams/
│   ├── page.tsx                  ← exam list (Server Component)
│   └── [id]/
│       ├── page.tsx              ← exam detail (Server Component)
│       └── actions.ts            ← Server Actions: createBlock, deleteBlock
├── components/
│   └── exams/
│       ├── ExamCard.tsx          ← single exam card (Server Component)
│       ├── ExamForm.tsx          ← create/edit form (Client Component)
│       └── DeleteExamButton.tsx  ← delete with confirmation (Client Component)
└── lib/
    └── database.types.ts         ← regenerate after DB migration
```

Only list files you will actually touch. Don't pad the list.

---

### 2. New dependencies

List any packages that need to be installed. If none, say so.

| Package | Purpose |
|---------|---------|
| `react-markdown` | Markdown rendering in summary viewer |

If nothing new is needed: "No new dependencies — all needed packages are already installed."

---

### 3. Implementation order

Number the steps you will follow:

```
Step 1: DB migration via Supabase MCP (if schema changes needed)
Step 2: Regenerate database.types.ts
Step 3: Server Actions in actions.ts
Step 4: Server Component pages (data fetching layer)
Step 5: Client Components (interaction layer)
Step 6: Wire up navigation / routing
Step 7: Review against spec (reviewer skill)
```

Adjust steps to fit the actual task. Remove steps that don't apply.

---

### 4. Risks & tradeoffs

List 1–3 things that could go wrong or that you've simplified:

```
RISK: Realtime subscription in Client Component will re-render often — use useMemo for derived state.
TRADEOFF: Optimistic UI skipped — will show loading state instead to keep error handling simple.
ASSUMPTION [A1]: No spec on confirmation dialog style — using shadcn AlertDialog.
```

---

### End

After showing the plan, say:
> "Plan ready. I'll start implementation now unless you want changes."

Then proceed immediately to coding using the `coding-rules`, `stack-nextjs`, and `stack-ui` skills. Do not wait for a second confirmation unless the user explicitly stops you.

---

## Rules

- Never skip the file structure — even for small changes
- Never introduce a package not listed in the plan
- Never change the plan mid-implementation without flagging it
- Keep the plan short — details go in the code, not here
- Always reference `stack-nextjs` and `stack-ui` during implementation
