// Regenerates flashcards and/or exam questions for an existing section on user request.
// Validates a user JWT so it can be called directly from the browser.
// mode: "flashcards_only" (default) | "exam_questions_only" | "both"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!

// Reduced prompt for flashcards only
const FLASHCARDS_ONLY_PROMPT = `Du bist ein Prüfungsexperte für universitäre Klausuren. Du erhältst einen Themenabschnitt und generierst daraus Karteikarten.

## Aufgabe

Erstelle 3–5 Karteikarten (Flashcards) aus dem Themenabschnitt.

## Regeln

**Länge:**
- Frage: 1–2 Sätze. Klar, direkt, keine Einleitung.
- Musterlösung: **Bullet Points**, 3–5 Stück. Jeder Punkt beginnt mit einem **fettgedruckten Schlüsselbegriff**, gefolgt von einer kurzen Erklärung (max 1 Satz). Kein Fließtext. Keine Sub-Aufzählungen.

**Inhalt:**
- Verständnis testen, nicht Auswendiglernen
- Frage muss spezifisch genug sein für eine klare Antwortrichtung
- Musterlösung = Abgleich-Tool: Lernender scannt die Bullet Points und weiß sofort ob die Kernpunkte getroffen wurden
- Formeln in LaTeX: \`$...$\` inline, \`$$...$$\` Block
- Keine Trivialfragen, keine Ja/Nein-Fragen, kein Fließtext in Antworten

**Beispiel RICHTIG:**
Frage: "Welche drei Analysebereiche umfasst die Bilanzanalyse und was untersucht jeder?"
Antwort:
- **Strategische Analyse** → untersucht das Erfolgspotenzial (Marktposition, Wettbewerbsfähigkeit)
- **Erfolgswirtschaftliche Analyse** → untersucht Rentabilität und Profitabilität
- **Finanzwirtschaftliche Analyse** → untersucht Liquidität und Solvenz (Zahlungsfähigkeit)
- Alle drei nötig, weil ein Unternehmen in einem Bereich stark und in einem anderen schwach sein kann

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
  "exam_questions": []
}
\`\`\``

// Full prompt for exam questions (and both)
const FULL_GENERATION_PROMPT = `Du bist ein Prüfungsexperte für universitäre Klausuren. Du erhältst einen Themenabschnitt und generierst daraus Lernmaterial.

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

// ---- Types ------------------------------------------------------------------

type GenerationMode = "flashcards_only" | "exam_questions_only" | "both"

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

// ---- Helpers ----------------------------------------------------------------

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (
        err instanceof Error &&
        (err.message.includes("Anthropic 429") ||
          err.message.includes("max_tokens reached"))
      ) {
        throw err
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, attempt === 0 ? 1000 : 3000),
        )
      }
    }
  }
  throw lastError
}

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim()
  }
  return text.trim()
}

async function callAnthropic(
  systemPrompt: string,
  content: string,
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
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content }],
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Anthropic ${res.status}: ${body}`)
    }
    // deno-lint-ignore no-explicit-any
    const response = await res.json() as any
    if (response.stop_reason === "max_tokens") {
      throw new Error("Anthropic response truncated (max_tokens reached)")
    }
    return response.content[0].text as string
  })
}

// ---- Rate limiting ----------------------------------------------------------

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

// ---- Handler ----------------------------------------------------------------

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
    return new Response(
      JSON.stringify({ error: "Server misconfiguration" }),
      { status: 500, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
    )
  }

  // Validate user JWT
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

  // Service role client created once, after successful auth
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Rate limit: max 20 regenerate-content calls per user per hour
  const allowed = await checkRateLimit(serviceClient, user.id, "regenerate-content", 20)
  if (!allowed) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  // Parse body
  let sectionId: string
  let mode: GenerationMode = "flashcards_only"
  try {
    const body = await req.json() as { section_id?: string; mode?: string }
    if (!body.section_id) throw new Error("section_id required")
    sectionId = body.section_id
    if (
      body.mode === "flashcards_only" ||
      body.mode === "exam_questions_only" ||
      body.mode === "both"
    ) {
      mode = body.mode
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  // Verify section ownership: sections → summaries → blocks → exams → user_id
  const { data: section } = await serviceClient
    .from("sections")
    .select("id, title, content_text, summary_id")
    .eq("id", sectionId)
    .single()

  if (!section) {
    return new Response(JSON.stringify({ error: "Section not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  const { data: summary } = await serviceClient
    .from("summaries")
    .select("id, block_id")
    .eq("id", section.summary_id)
    .single()

  if (!summary) {
    return new Response(JSON.stringify({ error: "Summary not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  const { data: block } = await serviceClient
    .from("blocks")
    .select("id, exam_id")
    .eq("id", summary.block_id)
    .single()

  if (!block) {
    return new Response(JSON.stringify({ error: "Block not found" }), {
      status: 404,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }

  const { data: exam } = await serviceClient
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

  // Choose prompt based on mode
  const systemPrompt =
    mode === "flashcards_only" ? FLASHCARDS_ONLY_PROMPT : FULL_GENERATION_PROMPT

  try {
    const userMessage = `## ${section.title}\n\n${section.content_text}`
    const rawResponse = await callAnthropic(systemPrompt, userMessage)
    const generated = JSON.parse(extractJson(rawResponse)) as GenerationResult

    let flashcardCount = 0
    let examQuestionCount = 0

    if (mode !== "exam_questions_only" && generated.flashcards.length > 0) {
      await serviceClient.from("flashcards").insert(
        generated.flashcards.map((fc) => ({
          section_id: section.id,
          question: fc.question,
          answer: fc.answer,
          is_user_created: false,
        })),
      )
      flashcardCount = generated.flashcards.length
    }

    if (mode !== "flashcards_only" && generated.exam_questions.length > 0) {
      await serviceClient.from("exam_questions").insert(
        generated.exam_questions.map((eq) => ({
          section_id: section.id,
          question_type: eq.question_type,
          question_data: eq.question_data as unknown as Record<string, unknown>,
          answer_data: eq.answer_data as unknown as Record<string, unknown>,
          is_user_created: false,
        })),
      )
      examQuestionCount = generated.exam_questions.length
    }

    return new Response(
      JSON.stringify({
        ok: true,
        count: mode === "exam_questions_only" ? examQuestionCount : flashcardCount,
        flashcard_count: flashcardCount,
        exam_question_count: examQuestionCount,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "content-type": "application/json" } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`regenerate-content failed for section ${sectionId}:`, message)
    return new Response(JSON.stringify({ error: "Generation failed" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    })
  }
})
