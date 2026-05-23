---
name: reviewer
description: Self-review all implemented code against the original spec before declaring a task done. Use this skill after implementation is complete — never skip it. Catches spec deviations, TypeScript violations, and coding-rules issues before the user sees the output.
---

# Reviewer

Read this skill **after implementation is complete**. Run through every checkpoint below before saying you're done.

---

## Checklist

Go through each item. Mark it ✅ or flag it with ❌ + short explanation.

### Spec compliance
- [ ] Does the implementation match the goal stated in spec-reader?
- [ ] Are all constraints respected?
- [ ] Is everything out-of-scope actually excluded?
- [ ] Are all assumptions documented in code with `// ASSUMPTION [Ax]:`?

### TypeScript & code quality
- [ ] Zero `any` types used?
- [ ] All Supabase queries use generated types from `database.types.ts`?
- [ ] All function parameters and return values typed?
- [ ] No `console.log` left in committed code?
- [ ] No inline styles (`style={{ ... }}`)?
- [ ] No components longer than 150 lines?
- [ ] Imports ordered: external → `@/` aliases → relative?
- [ ] No hardcoded secrets or API keys?

### Next.js patterns
- [ ] Server Components used for data fetching (no `useEffect` fetching)?
- [ ] `'use client'` only where actually needed (hooks, events, browser APIs)?
- [ ] `revalidatePath()` called after all mutations?
- [ ] All mutations in `actions.ts`, not in components?
- [ ] User-facing error messages in German, human-readable?

### UI
- [ ] Only shadcn/ui components used — no custom primitives built?
- [ ] Only Tailwind semantic token classes used — no hardcoded colors?
- [ ] Lucide icons with `strokeWidth={2}`?
- [ ] Empty states present for every list view?
- [ ] No gradients, bounce animations, or emoji in UI chrome?

### Structure
- [ ] File and folder structure matches the architect plan?
- [ ] All planned files created?

---

## Output format

```
## Review Report

✅ Spec compliance: all constraints respected, assumptions documented
✅ TypeScript: no any types, all queries typed
❌ Next.js patterns: revalidatePath missing after deleteExam → fixed
✅ UI: shadcn only, semantic tokens, empty state present
✅ Structure: matches architect plan

Status: READY ✅
```

Fix all ❌ items before reporting READY.

---

## Final message to user

**If READY:**
> "Review complete. All checks passed. Here's what was built: [2–3 sentences]. Let me know if anything needs adjusting."

**If fixes were needed:**
> "Review complete. Fixed [X issue(s)]: [brief list]. Everything now passes. Here's what was built: [2–3 sentences]."

---

## Rules

- Never skip this step, even for small changes
- Never mark READY with open ❌ items
- Never summarize before running the checklist
