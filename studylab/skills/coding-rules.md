---
name: coding-rules
description: Apply consistent coding standards during implementation. TypeScript/React conventions, naming rules, error handling, and forbidden patterns. Always active during implementation phase. Load alongside stack-nextjs and stack-ui for full coverage.
---

# Coding Rules

Apply these rules to **every file** you create or modify. No exceptions.

---

## Naming conventions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `userName`, `itemCount` |
| Functions | camelCase | `getUser()`, `calculateTotal()` |
| React components | PascalCase | `ExamCard`, `BlockList` |
| Types & Interfaces | PascalCase | `ExamSession`, `BlockWithWeight` |
| Constants | UPPER_SNAKE | `MAX_FILE_SIZE`, `DEFAULT_TIMEOUT` |
| Component files | PascalCase | `ExamCard.tsx`, `BlockForm.tsx` |
| Page/route files | lowercase | `page.tsx`, `layout.tsx`, `route.ts` |
| Utility/lib files | kebab-case | `format-date.ts`, `supabase-client.ts` |

---

## TypeScript rules

- **No `any` types** — ever. Use proper types or `unknown` with a type guard.
- Use generated Supabase types from `@/lib/database.types.ts` for all DB entities.
- Prefer `type` for plain data shapes; `interface` for extendable contracts.
- All function parameters and return values must be typed.

```typescript
// Bad
async function getExam(id: any): Promise<any> { ... }

// Good
import type { Database } from '@/lib/database.types'
type Exam = Database['public']['Tables']['exams']['Row']

async function getExam(id: string): Promise<Exam | null> { ... }
```

---

## Comments

Only add a comment when the WHY is non-obvious: a hidden constraint, a workaround, or behavior that would surprise a reader. Never explain what the code does — names do that.

Mark all spec assumptions with `// ASSUMPTION [Ax]:`:

```typescript
// ASSUMPTION [A1]: Spec doesn't define max attempts — defaulting to unlimited
```

---

## Error handling

- Never catch and silently swallow errors.
- Server Actions and Route Handlers return typed result objects — never throw to the client.
- User-facing error messages must be in German, human-readable, no stack traces.

```typescript
// Bad
try {
  await supabase.from('exams').insert(data)
} catch (e) {}

// Good
const { error } = await supabase.from('exams').insert(data)
if (error) {
  console.error('[createExam]', error.message)
  return { success: false, error: 'Klausur konnte nicht gespeichert werden.' }
}
return { success: true }
```

---

## Imports

Order: external packages → internal aliases (`@/`) → relative imports. Separate groups with a blank line.

```typescript
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

import type { ExamFormValues } from './types'
```

---

## Forbidden patterns

- ❌ `any` types — ever
- ❌ Hardcoded Supabase URLs, API keys, or secrets in source code
- ❌ `console.log` left in committed code (remove before done)
- ❌ Inline styles (`style={{ ... }}`) — use Tailwind classes
- ❌ Components longer than 150 lines — extract sub-components
- ❌ Fetching data in a Client Component when a Server Component works
- ❌ `useEffect` for data fetching — use Server Components instead
- ❌ Building custom Button, Input, Card, Dialog, etc. — use shadcn/ui

---

## File structure within a component file

```
1. Imports (external → @/ aliases → relative)
2. Types (local to this file only)
3. Constants
4. Helper functions (not exported)
5. Main component (default export)
6. Named sub-components (if small enough to live here)
```

---

## Rules meta

- If a rule conflicts with the spec, follow the spec and add a comment: `// SPEC OVERRIDE: reason`
- If a rule would make the code significantly worse, flag it in the review step instead of silently breaking it
