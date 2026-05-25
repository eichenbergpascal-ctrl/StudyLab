import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!

// Verbatim prompt from prompts/parsing-prompt.md
const PARSING_PROMPT = `Du bist ein akademischer Textanalyst. Du erhältst ein PDF-Dokument — eine universitäre Zusammenfassung (Vorlesungsskript, Folienexport oder handschriftliche Notizen).

## Aufgabe

Analysiere das PDF und extrahiere den Inhalt als strukturierte Themenabschnitte (Sections).

## Regeln für die Section-Erkennung

1. **Schneide auf der zweiten Gliederungsebene** (z.B. 1.1, 1.2, 2.1, 2.2). Nicht auf Kapitel-Ebene (zu grob) und nicht auf Unter-Unter-Ebene (zu fein).
2. Falls keine nummerierte Gliederung existiert: erkenne Sections anhand von Überschriften, thematischen Wechseln oder visuellen Trennern.
3. Falls eine Section extrem lang ist (>2 Seiten Inhalt): teile sie in sinnvolle Unter-Sections auf.
4. Falls eine Section extrem kurz ist (<3 Sätze): fasse sie mit der vorherigen oder nächsten Section zusammen.
5. Ziel: 5–20 Sections pro Dokument. Weniger als 5 ist zu grob, mehr als 20 ist zu fein.

## Regeln für den Content

1. Gib den Inhalt jeder Section als **Markdown** zurück.
2. Überschriften, Listen, Tabellen und Fettdruck als Markdown abbilden.
3. Formeln als LaTeX: \`$...$\` für inline, \`$$...$$\` für Blockformeln.
4. Tabellen als Markdown-Tabellen.
5. Definitionskästen, Merksätze und Hinweise als Blockquotes (\`> ...\`) mit einem Label (z.B. \`> **Definition:**\`).
6. **Handschriftliche Anmerkungen:** Bestmöglich miterfassen. Wenn unleserlich, ignorieren — NICHT raten oder halluzinieren.
7. **Diagramme/Abbildungen:** Nicht visuell beschreiben. Aber Beschriftungen, Legenden und Erklärungstexte rund um Diagramme extrahieren.
8. Keine Informationen erfinden. Nur extrahieren was im PDF steht.

## Ignorieren

- Deckblätter, Inhaltsverzeichnisse, reine Seitenumbrüche
- Klausurhinweise, organisatorische Infos (Sprechstunden, Termine)
- Seitenzahlen, Header/Footer

## Output-Format

Antworte ausschließlich mit validem JSON — kein Text davor oder danach.

\`\`\`json
{
  "version": 1,
  "page_count": <Anzahl Seiten im PDF>,
  "sections": [
    {
      "title": "<Section-Titel>",
      "sort_order": 1,
      "content_markdown": "<Markdown-Inhalt der Section>"
    }
  ],
  "metadata": {
    "ignored_blocks": ["<Beschreibung ignorierter Bereiche, z.B. 'Deckblatt S.1', 'Klausurhinweis S.4'>"]
  }
}
\`\`\`

Sortiere die Sections in der Reihenfolge, in der sie im Dokument erscheinen.`

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// ---- Types ----------------------------------------------------------------

interface ParsedSection {
  title: string
  sort_order: number
  content_markdown: string
}

interface ParsedContent {
  version: number
  page_count: number
  sections: ParsedSection[]
  metadata: { ignored_blocks: string[] }
}

interface SummaryRow {
  id: string
  storage_path: string
  processing_status: string
  block_id: string
}

interface InsertedSection {
  id: string
  sort_order: number
  title: string
  content_text: string
}

// ---- Helpers --------------------------------------------------------------

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      // Rate limit errors and max_tokens truncation won't resolve with retries
      if (err instanceof Error && (
        err.message.includes("Anthropic 429") ||
        err.message.includes("max_tokens reached")
      )) {
        throw err
      }
      if (attempt < maxRetries) {
        const delay = attempt === 0 ? 1000 : 3000
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

function extractJson(text: string): string {
  // Try fence-delimited JSON first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  // Try to extract from first { to last }
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim()
  }
  return text.trim()
}

async function callAnthropic(
  systemPrompt: string,
  messages: { role: string; content: unknown }[],
  maxTokens: number
): Promise<string> {
  return withRetry(async () => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "prompt-caching-2024-07-31",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Anthropic ${res.status}: ${body}`)
    }

    // deno-lint-ignore no-explicit-any
    const response = await res.json() as any
    const u = response.usage ?? {}
    console.log("Cache stats:", {
      input_tokens: u.input_tokens,
      cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
    })
    const stopReason: string = response.stop_reason
    console.log("Anthropic stop_reason:", stopReason)
    if (stopReason === "max_tokens") {
      throw new Error("Anthropic response truncated (max_tokens reached)")
    }
    return response.content[0].text as string
  })
}

// ---- Rate limiting --------------------------------------------------------

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>

async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  maxPerHour: number
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("count, window_start")
    .eq("user_id", userId)
    .eq("action", action)
    .single()

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  if (!existing) {
    await supabase.from("rate_limits").insert({
      user_id: userId,
      action,
      window_start: now.toISOString(),
      count: 1,
    })
    return true
  }

  const windowStart = new Date(existing.window_start)
  if (windowStart < oneHourAgo) {
    await supabase
      .from("rate_limits")
      .update({ count: 1, window_start: now.toISOString() })
      .eq("user_id", userId)
      .eq("action", action)
    return true
  }

  if (existing.count >= maxPerHour) {
    return false
  }

  await supabase
    .from("rate_limits")
    .update({ count: existing.count + 1 })
    .eq("user_id", userId)
    .eq("action", action)
  return true
}

// ---- Core processing ------------------------------------------------------

async function processSummary(
  supabase: SupabaseClient,
  summary: SummaryRow
): Promise<void> {
  await supabase
    .from("summaries")
    .update({ processing_status: "parsing" })
    .eq("id", summary.id)

  let parsedContent: ParsedContent
  try {
    const { data: blob, error: storageError } = await supabase.storage
      .from("summaries")
      .download(summary.storage_path)

    if (storageError || !blob) {
      throw new Error(`Storage download failed: ${storageError?.message ?? "no data"}`)
    }

    const arrayBuffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    const rawResponse = await callAnthropic(
      PARSING_PROMPT,
      [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
          ],
        },
      ],
      16384
    )

    parsedContent = JSON.parse(extractJson(rawResponse)) as ParsedContent
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Parsing phase failed:", message)
    await supabase
      .from("summaries")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", summary.id)
    return
  }

  const sectionInserts = parsedContent.sections.map((s) => ({
    summary_id: summary.id,
    title: s.title,
    sort_order: s.sort_order,
    content_text: s.content_markdown,
  }))

  const { data: rawSections, error: sectionsError } = await supabase
    .from("sections")
    .insert(sectionInserts)
    .select("id, sort_order, title, content_text")

  const insertedSections = (rawSections ?? []) as InsertedSection[]

  if (sectionsError || insertedSections.length === 0) {
    const errMsg = `Section insert failed: ${sectionsError?.message ?? "unknown"}`
    console.error(errMsg)
    await supabase
      .from("summaries")
      .update({
        processing_status: "failed",
        processing_error: errMsg,
      })
      .eq("id", summary.id)
    return
  }

  await supabase
    .from("summaries")
    .update({
      parsed_content: parsedContent as unknown as Record<string, unknown>,
      sections_total: insertedSections.length,
      processing_status: "generating",
    })
    .eq("id", summary.id)

  // Dispatch all generate-section calls concurrently.
  // We must await the responses (not the generation itself) to prevent
  // Deno from killing in-flight HTTP connections when the worker exits.
  // The Supabase gateway accepts immediately — generate-section runs independently.
  await Promise.all(
    insertedSections.map((section) =>
      fetch(`${SUPABASE_URL}/functions/v1/generate-section`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sectionId: section.id, summaryId: summary.id }),
      }).then(
        (res) => {
          if (!res.ok) {
            console.error(`generate-section dispatch for ${section.id} returned ${res.status}`)
          }
        },
        (e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e)
          console.error(`Failed to dispatch generate-section for ${section.id}:`, msg)
        }
      )
    )
  )
}

// ---- Handler --------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
    console.error("Missing required environment variables")
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing environment variables" }),
      { status: 500, headers: { ...CORS_HEADERS, "content-type": "application/json" } }
    )
  }

  let summaryId: string
  try {
    const body = await req.json() as { summaryId?: string }
    if (!body.summaryId) throw new Error("summaryId required")
    summaryId = body.summaryId
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  // Validate user JWT before creating the service role client
  const authHeader = req.headers.get("Authorization") ?? ""
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  // Service role client created only after successful auth
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Rate limit: max 5 process-summary calls per user per hour
  const allowed = await checkRateLimit(supabase, user.id, "process-summary", 5)
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  // Fetch summary and verify ownership: summary → block → exam → user_id
  const { data: summary, error: fetchError } = await supabase
    .from("summaries")
    .select("id, storage_path, processing_status, block_id")
    .eq("id", summaryId)
    .single()

  if (fetchError || !summary) {
    return new Response(JSON.stringify({ error: "Summary not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  const { data: block } = await supabase
    .from("blocks")
    .select("id, exam_id")
    .eq("id", summary.block_id)
    .single()

  if (!block) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  const { data: exam } = await supabase
    .from("exams")
    .select("id, user_id")
    .eq("id", block.exam_id)
    .single()

  if (!exam || exam.user_id !== user.id) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  if (summary.processing_status !== "pending") {
    return new Response(
      JSON.stringify({ error: "Summary is not in pending state" }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, "content-type": "application/json" },
      }
    )
  }

  try {
    await processSummary(supabase, summary as SummaryRow)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("processSummary threw unexpectedly:", message)
    await supabase
      .from("summaries")
      .update({ processing_status: "failed", processing_error: message })
      .eq("id", summaryId)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  })
})
