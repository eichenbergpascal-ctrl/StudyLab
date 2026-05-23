import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!

const GENERATION_PROMPT = `Du bist ein Prüfungsexperte für universitäre Klausuren. Du erhältst einen Themenabschnitt und generierst daraus Lernmaterial.

## Aufgabe

Erstelle aus dem Themenabschnitt:
- 3–5 Karteikarten (Flashcards)
- 3–5 Klausuraufgaben (Exam Questions)

## Karteikarten

Frage + Musterlösung. Selbstbewertung durch den Lernenden (kein Auto-Check).

**Längenregeln:**
- Frage: 1–2 Sätze. Klar, direkt, keine Einleitung.
- Musterlösung: **Bullet Points**, 3–5 Stück. Jeder Punkt beginnt mit einem **fettgedruckten Schlüsselbegriff**, gefolgt von einer kurzen Erklärung (max 1 Satz). Kein Fließtext. Keine Sub-Aufzählungen.

**Was eine gute Karteikarte ausmacht:**
- Testet Verständnis, nicht Auswendiglernen
- Frage ist spezifisch genug, dass es genau eine richtige Antwortrichtung gibt
- Musterlösung ist ein Abgleich-Tool: Der Lernende scannt die Bullet Points und weiß sofort ob seine Antwort die Kernpunkte getroffen hat

**Beispiel RICHTIG:**
Frage: "Welche drei Analysebereiche umfasst die Bilanzanalyse und was untersucht jeder?"
Antwort:
- **Strategische Analyse** → untersucht das Erfolgspotenzial (Marktposition, Wettbewerbsfähigkeit)
- **Erfolgswirtschaftliche Analyse** → untersucht Rentabilität und Profitabilität
- **Finanzwirtschaftliche Analyse** → untersucht Liquidität und Solvenz (Zahlungsfähigkeit)
- Alle drei nötig, weil ein Unternehmen in einem Bereich stark und in einem anderen schwach sein kann

**Beispiel FALSCH (Fließtext, zu lang):**
Frage: "Erläutern Sie ausführlich, warum eine Bilanzanalyse die drei Bereiche benötigt."
Antwort: "Die Bilanzanalyse umfasst drei Bereiche. Die strategische Analyse untersucht das Erfolgspotenzial eines Unternehmens, also seine grundsätzliche Fähigkeit... [300 Wörter Fließtext]"

**Keine:**
- Trivialfragen ("Was ist die Abkürzung für...?")
- Fragen die mit Ja/Nein beantwortbar sind
- Fließtext-Antworten — immer Bullet Points
- Mehr als 5 Bullet Points pro Antwort

## Klausuraufgaben

Wähle den Fragetyp passend zum Inhalt. Mischung verwenden.

### Multiple Choice (\`mc\`)
- 4 Optionen, 1 richtig
- **Jede Option: max 15 Wörter.** Keine ganzen Sätze als Optionen.
- Distraktoren: plausibel, typische Fehler
- Erklärung: 1–2 Sätze

### Lückentext (\`fill_blank\`)
- 1–3 Lücken ({{1}}, {{2}}, {{3}})
- Lücken = Schlüsselbegriffe oder Zahlen
- Erklärung: 1–2 Sätze

### Zuordnung (\`matching\`)
- 3–5 Paare
- Jeder Eintrag: max 10 Wörter
- Erklärung: 1–2 Sätze

### Freitext (\`free_text\`)
- Frage: 1–2 Sätze
- Musterlösung: **Bullet Points** (3–5 Stück), jeder mit **fettem Schlüsselbegriff** + kurze Erklärung. Kein Fließtext, keine Aufsätze.
- Key Points: 3–4 Stichpunkte, je max 10 Wörter

**Für alle Typen:**
- Prüfungsniveau Universität
- Erklärungen knapp: max 2 Sätze
- Keine Fragen die das Originaldokument erfordern

## Output-Format

Nur valides JSON, kein Text davor oder danach.

\`\`\`json
{
  "flashcards": [
    {
      "question": "<1–2 Sätze>",
      "answer": "<2–5 Sätze>"
    }
  ],
  "exam_questions": [
    {
      "question_type": "mc",
      "question_data": {
        "question": "<Fragetext>",
        "options": ["<max 15 Wörter>", "<max 15 Wörter>", "<max 15 Wörter>", "<max 15 Wörter>"]
      },
      "answer_data": {
        "correct_index": 0,
        "explanation": "<1–2 Sätze>"
      }
    },
    {
      "question_type": "fill_blank",
      "question_data": {
        "text_with_blanks": "<Text mit {{1}}, {{2}}>",
        "blanks_count": 2
      },
      "answer_data": {
        "blanks": ["<Wort>", "<Wort>"],
        "explanation": "<1–2 Sätze>"
      }
    },
    {
      "question_type": "matching",
      "question_data": {
        "left": ["<max 10 Wörter>", "<max 10 Wörter>"],
        "right": ["<max 10 Wörter>", "<max 10 Wörter>"]
      },
      "answer_data": {
        "mapping": [0, 1],
        "explanation": "<1–2 Sätze>"
      }
    },
    {
      "question_type": "free_text",
      "question_data": {
        "question": "<1–2 Sätze>"
      },
      "answer_data": {
        "sample_answer": "- **Begriff A** → Erklärung in einem Satz\\n- **Begriff B** → Erklärung in einem Satz\\n- **Begriff C** → Erklärung in einem Satz",
        "key_points": ["<max 10 Wörter>", "<max 10 Wörter>"]
      }
    }
  ]
}
\`\`\`

Wähle die 3–5 passendsten Aufgabentypen für den Inhalt. Nicht alle 4 Typen erzwingen.`

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

// ---- Types ----------------------------------------------------------------

interface Flashcard {
  question: string
  answer: string
}

interface McQuestion {
  question_type: "mc"
  question_data: { question: string; options: string[] }
  answer_data: { correct_index: number; explanation: string }
}

interface FillBlankQuestion {
  question_type: "fill_blank"
  question_data: { text_with_blanks: string; blanks_count: number }
  answer_data: { blanks: string[]; explanation: string }
}

interface MatchingQuestion {
  question_type: "matching"
  question_data: { left: string[]; right: string[] }
  answer_data: { mapping: number[]; explanation: string }
}

interface FreeTextQuestion {
  question_type: "free_text"
  question_data: { question: string }
  answer_data: { sample_answer: string; key_points: string[] }
}

type ExamQuestion =
  | McQuestion
  | FillBlankQuestion
  | MatchingQuestion
  | FreeTextQuestion

interface GenerationResult {
  flashcards: Flashcard[]
  exam_questions: ExamQuestion[]
}

interface SectionRow {
  id: string
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

// ---- Handler --------------------------------------------------------------

// deno-lint-ignore no-explicit-any
type SupabaseClient = ReturnType<typeof createClient<any>>

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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
    console.error("Missing required environment variables")
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: missing environment variables" }),
      { status: 500, headers: { ...CORS_HEADERS, "content-type": "application/json" } }
    )
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  let sectionId: string
  let summaryId: string
  try {
    const body = await req.json() as { sectionId?: string; summaryId?: string }
    if (!body.sectionId || !body.summaryId) throw new Error("sectionId and summaryId required")
    sectionId = body.sectionId
    summaryId = body.summaryId
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: section, error: sectionError } = await supabase
    .from("sections")
    .select("id, title, content_text")
    .eq("id", sectionId)
    .single()

  if (sectionError || !section) {
    // Section missing — still increment so the summary can reach terminal status
    console.error(`Section ${sectionId} not found:`, sectionError?.message)
    await supabase.rpc("complete_section_generation", { p_summary_id: summaryId })
    return new Response(JSON.stringify({ error: "Section not found" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  const sectionRow = section as SectionRow

  try {
    const userMessage = `## ${sectionRow.title}\n\n${sectionRow.content_text}`

    const rawResponse = await callAnthropic(
      GENERATION_PROMPT,
      [{ role: "user", content: userMessage }],
      4096
    )

    const generated = JSON.parse(extractJson(rawResponse)) as GenerationResult

    if (generated.flashcards.length > 0) {
      await supabase.from("flashcards").insert(
        generated.flashcards.map((fc) => ({
          section_id: sectionRow.id,
          question: fc.question,
          answer: fc.answer,
          is_user_created: false,
        }))
      )
    }

    if (generated.exam_questions.length > 0) {
      await supabase.from("exam_questions").insert(
        generated.exam_questions.map((eq) => ({
          section_id: sectionRow.id,
          question_type: eq.question_type,
          question_data: eq.question_data as unknown as Record<string, unknown>,
          answer_data: eq.answer_data as unknown as Record<string, unknown>,
          is_user_created: false,
        }))
      )
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`Generation failed for section ${sectionId}:`, message)
  }

  // Always increment — the RPC checks flashcard count to determine final status
  try {
    await supabase.rpc("complete_section_generation", { p_summary_id: summaryId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`RPC complete_section_generation failed for summary ${summaryId}:`, message)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "content-type": "application/json" },
  })
})
