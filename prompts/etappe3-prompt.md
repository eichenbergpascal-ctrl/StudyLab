# Task: Implement PDF Processing Pipeline (Edge Function + Frontend Status)

## Context
StudyLab is a Next.js 14 learning app with Supabase backend. Users upload PDF summaries to study blocks. The upload flow (Etappe 2) is complete — PDFs land in Supabase Storage with a `summaries` row (status: `pending`). This task adds the AI processing pipeline: parse the PDF into sections, then generate flashcards and exam questions per section.

## Tech Stack
- Framework: Next.js 14 (App Router, TypeScript, pnpm)
- Backend: Supabase (PostgreSQL, Edge Functions via Deno, Storage, Realtime)
- UI: Tailwind CSS + shadcn/ui + Lucide icons
- AI: Anthropic Claude API (API key stored as Supabase Edge Function Secret `ANTHROPIC_API_KEY`)
- Design: See `design-system/README.md` and `design-system/colors_and_type.css` for tokens
- Types: Generated Supabase types in `src/lib/database.types.ts`

## File Structure (relevant subset)
```
supabase/
  migrations/          # existing schema migrations
  functions/
    process-summary/
      index.ts         # NEW — Edge Function
prompts/
  parsing-prompt.md    # LLM prompt for PDF → Sections (use verbatim)
  generation-prompt.md # LLM prompt for Section → Flashcards + Exam Questions (use verbatim)
src/
  app/(dashboard)/klausuren/[id]/blocks/[blockId]/
    _components/SummarySection.tsx  # existing — modify for status + trigger
    actions.ts                      # existing server actions
  lib/
    supabase/client.ts
    supabase/server.ts
    database.types.ts
```

## Task

1. Create `supabase/config.toml` with default Supabase config if it does not exist (needed for `supabase functions serve`).

2. Create Edge Function `supabase/functions/process-summary/index.ts`:
   - Accept POST with JSON body `{ summaryId: string }`.
   - Verify the summary exists and status is `pending`. If not, return 400.
   - **Step 1 — Parsing:**
     - Update summary status to `parsing`.
     - Download PDF from Supabase Storage using the summary's `storage_path`.
     - Convert PDF to Base64.
     - Call Anthropic API (`claude-sonnet-4-20250514`, max_tokens 8192) with the system prompt from `prompts/parsing-prompt.md` (embed the prompt text as a string constant in the function). Send the PDF as a `document` content block (type: `base64`, media_type: `application/pdf`).
     - Parse the JSON response. Write `parsed_content` to the summary row.
     - Create `sections` rows from the parsed sections array (`title`, `sort_order`, `content_text` = `content_markdown`).
     - Update `sections_total` on the summary.
     - Update status to `generating`.
   - **Step 2 — Generation:**
     - For each section, call Anthropic API (`claude-sonnet-4-20250514`, max_tokens 4096) with the system prompt from `prompts/generation-prompt.md`. Send the section title and content_markdown as the user message.
     - Process sections in batches of 3 (not all at once) using `Promise.allSettled` to avoid rate limits.
     - For each successful response: insert `flashcards` rows and `exam_questions` rows (with `question_type`, `question_data`, `answer_data`, `is_user_created = false`).
     - Increment `sections_processed` on the summary after each batch.
     - After all sections: update status to `completed`.
   - **Error handling:**
     - Wrap each API call with retry logic: max 2 retries, exponential backoff (1s, 3s).
     - If parsing fails: set status to `failed`, write error to `processing_error`.
     - If a generation call fails after retries: log the error, skip that section, continue with others. Set status to `completed` only if at least one section succeeded, otherwise `failed`.
   - **Auth:** Use the Supabase service role key (available as `SUPABASE_SERVICE_ROLE_KEY` in Edge Functions) to bypass RLS for writing sections/flashcards/exam_questions.
   - **CORS:** Add appropriate CORS headers for the frontend origin.

3. Modify `src/app/(dashboard)/klausuren/[id]/blocks/[blockId]/_components/SummarySection.tsx`:
   - After successful PDF upload, call the Edge Function `process-summary` with the new summary's ID.
   - Call via `fetch` to `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-summary` with the user's auth token as Bearer token.
   - Do NOT await the response — fire and forget.

4. Add Realtime subscription in `SummarySection.tsx`:
   - Subscribe to changes on the `summaries` table filtered by the current block's summary IDs.
   - Listen for updates to `processing_status`, `sections_processed`, `sections_total`, `processing_error`.
   - Update UI reactively.

5. Add status UI to `SummarySection.tsx` for each summary:
   - `pending`: No badge (just uploaded).
   - `parsing`: Spinner + "Wird analysiert…"
   - `generating`: Spinner + progress "Generiere Aufgaben (3/10 Abschnitte)"
   - `completed`: Green checkmark badge "Verarbeitet"
   - `failed`: Red X badge + error message + "Erneut verarbeiten" retry button.
   - Retry button re-calls the Edge Function (resets status to `pending` first via server action).
   - Style badges using design system tokens. No custom colors — use `text-green-600`, `text-red-600` from the existing palette.

6. Add server action in `actions.ts`: `retrySummaryProcessing(summaryId: string)` — sets `processing_status` back to `pending`, clears `processing_error`, resets `sections_processed` to 0, deletes existing sections/flashcards/exam_questions for this summary, then triggers the Edge Function.

7. Regenerate Supabase types: run `supabase gen types typescript --local > src/lib/database.types.ts` after any schema changes.

## Acceptance Criteria
- [ ] `supabase functions serve` starts without errors
- [ ] PDF upload triggers processing — status changes from `pending` → `parsing` → `generating` → `completed` visibly in UI
- [ ] Sections are created in DB with correct titles and markdown content
- [ ] 3–5 flashcards per section exist in DB with `question` and `answer` fields
- [ ] 3–5 exam questions per section exist in DB with correct `question_type`, `question_data`, `answer_data` structure
- [ ] Progress indicator shows sections_processed/sections_total during generation
- [ ] Failed processing shows error message and retry button
- [ ] Retry button clears old data and re-processes from scratch
- [ ] No TypeScript errors, no `any` types
- [ ] Edge Function handles missing summary, invalid ID, and already-processing states gracefully

## Constraints
- Use the LLM prompt texts from `prompts/parsing-prompt.md` and `prompts/generation-prompt.md` VERBATIM — do not modify or "improve" them. Embed them as string constants.
- Do not create any new UI pages — only modify existing components in the block detail view.
- Do not use `@anthropic-ai/sdk` npm package — call the Anthropic API via `fetch` (Deno Edge Functions don't support Node packages).
- Batch generation calls in groups of 3, not all in parallel.
- Do not touch auth, layout, or any unrelated components.
- Reference `lerntool-spezifikation.md` and `projektplan.md` for architectural decisions.
- Follow CLAUDE.md design system rules for all UI changes.
