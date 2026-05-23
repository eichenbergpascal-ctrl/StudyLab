---
name: spec-reader
description: Parse and understand a structured spec prompt before writing any code. Use this skill at the very start of every task — before planning, before creating files, before any implementation. Triggers on any task that comes with a spec, requirements list, or feature description.
---

# Spec Reader

Read this skill **first**, before anything else. No code, no file creation, no planning until this is done.

## Your job

Extract the following from the spec prompt and present them clearly:

### 1. Goal
One sentence: what is this feature supposed to do?

### 2. Constraints
What must NOT happen? (e.g. "don't change the DB schema", "no new dependencies", "must work offline")

### 3. Out of scope
What is explicitly excluded, or what you will NOT build as part of this task?

### 4. Assumptions
List every technical decision the spec does NOT specify. State what you will assume.

Format assumptions like this:
```
ASSUMPTION [A1]: Spec doesn't define confirmation dialog style — using shadcn AlertDialog.
ASSUMPTION [A2]: Spec doesn't specify toast position — using sonner default (bottom-right).
ASSUMPTION [A3]: No loading skeleton specified — showing spinner on Button instead.
```

Default assumptions for this project (apply unless the spec overrides):
- Framework: Next.js App Router, TypeScript strict
- Mutations: Server Actions in `actions.ts`
- UI components: shadcn/ui
- Styling: Tailwind semantic tokens only
- Icons: lucide-react, strokeWidth=2
- Toasts: sonner
- Language: German, "du"-Anrede

### 5. One-line confirmation
End with:
> "Ready to proceed. Waiting for your go-ahead — or tell me if any assumption is wrong."

Then **wait** for the user to confirm before moving to the architect skill.

---

## Rules

- Never skip this step, even if the spec seems simple
- Never start coding during this step
- Never ask technical questions — make assumptions and document them
- Keep output short and scannable — this is a summary, not an essay
- If the spec is missing the goal entirely, ask one focused question before continuing
