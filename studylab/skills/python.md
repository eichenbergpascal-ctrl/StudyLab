---
name: stack-nextjs
description: Next.js App Router + TypeScript + Supabase + Tailwind rules. Load this alongside coding-rules for all tasks in this project. Covers server vs client components, Supabase data fetching, Server Actions, and form handling with react-hook-form + zod.
---

# Next.js Stack Profile

Load this **alongside coding-rules**. These rules are specific to the StudyLab project.

---

## Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Forms | react-hook-form + zod |
| Icons | lucide-react (outline, strokeWidth=2) |
| Toasts | sonner |
| Package manager | pnpm |

---

## App Router file conventions

| File | Purpose |
|------|---------|
| `page.tsx` | Route UI — Server Component by default |
| `layout.tsx` | Persistent wrapper across child routes |
| `loading.tsx` | Suspense fallback for the route segment |
| `error.tsx` | Error boundary — must be `'use client'` |
| `route.ts` | API route handler (GET, POST, etc.) |
| `actions.ts` | Server Actions for all mutations |

---

## Server vs Client components

**Default to Server Components.** Only add `'use client'` when you need:
- `useState`, `useEffect`, or other hooks
- Browser APIs (`window`, `localStorage`, etc.)
- Event listeners (`onClick`, `onChange`, etc.)
- Realtime subscriptions

```typescript
// Server Component — no directive needed, fetch directly
export default async function ExamList() {
  const supabase = await createClient()
  const { data: exams } = await supabase.from('exams').select()
  return <ul>{exams?.map(e => <ExamCard key={e.id} exam={e} />)}</ul>
}

// Client Component — only when interaction is required
'use client'
export function DeleteButton({ examId }: { examId: string }) {
  return <button onClick={() => deleteExam(examId)}>Löschen</button>
}
```

---

## Supabase patterns

### Server-side (Server Components, Server Actions, Route Handlers)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase.from('exams').select('*')
if (error) throw new Error(error.message)
```

### Client-side (Client Components, Realtime subscriptions)
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

### Typed queries — always use generated types
```typescript
import type { Database } from '@/lib/database.types'
type Exam = Database['public']['Tables']['exams']['Row']
```

### RLS is always active — never bypass it
Every query runs as the authenticated user. If data is missing, check RLS policies first before debugging the query.

---

## Server Actions

All mutations (create, update, delete) go in `actions.ts` — not in components or API routes.

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createExam(name: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('exams').insert({ name })
  if (error) return { success: false, error: 'Klausur konnte nicht gespeichert werden.' }

  revalidatePath('/dashboard')
  return { success: true }
}
```

Always call `revalidatePath()` after mutations that change what a page displays.

---

## Forms (react-hook-form + zod)

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100),
})
type FormValues = z.infer<typeof schema>

export function ExamForm() {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    const result = await createExam(values.name)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success('Klausur erstellt.')
    form.reset()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input {...form.register('name')} placeholder="Klausurname" />
      {form.formState.errors.name && (
        <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        Erstellen
      </Button>
    </form>
  )
}
```

---

## Routing & navigation

```typescript
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Programmatic navigation (Client Component only)
const router = useRouter()
router.push('/dashboard')

// Links — always use next/link, never <a> for internal routes
<Link href={`/exams/${exam.id}`}>Zur Klausur</Link>
```

---

## Implementation order for a new feature

```
Step 1: DB migration (if needed) — apply via Supabase MCP
Step 2: Regenerate database.types.ts
Step 3: Server Action(s) in actions.ts
Step 4: Server Component page (data fetching)
Step 5: Client Component(s) (interaction layer)
Step 6: Wire up: page → components → actions
Step 7: Review against spec (reviewer skill)
```
