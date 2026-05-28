import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FileText, Loader2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Dashboard",
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

function daysUntil(dateStr: string): number | null {
  const d = new Date(dateStr)
  const examMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  const now = new Date()
  const todayMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const diff = Math.round((examMidnight - todayMidnight) / 86400000)
  return diff > 0 ? diff : null
}

type ExamCardData = {
  id: string
  name: string
  exam_date: string | null
  created_at: string
  flashcardsTotal: number
  flashcardsWorked: number
  examQuestionsTotal: number
  examQuestionsWorked: number
  errorCount: number
  inProgressSessionId: string | null
  isProcessing: boolean
  lastActivity: Date | null
}

function ExamCard({ exam }: { exam: ExamCardData }) {
  const days = exam.exam_date ? daysUntil(exam.exam_date) : null

  return (
    <div className="flex flex-col rounded-lg border border-[#E3E8ED] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex-1 p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <Link
            href={`/klausuren/${exam.id}`}
            className="flex-1 text-base font-semibold leading-snug text-foreground hover:underline"
          >
            {exam.name}
          </Link>
          {exam.errorCount > 0 && (
            <Link
              href={`/fehler/karteikarten/session?examId=${exam.id}`}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#DC4A4A]/10 px-2 py-0.5 font-mono text-xs text-[#DC4A4A] transition-colors hover:bg-[#DC4A4A]/20"
            >
              {exam.errorCount} Fehler
            </Link>
          )}
        </div>

        {exam.exam_date && (
          <p className="mb-3 text-xs text-muted-foreground">
            {formatDate(exam.exam_date)}
            {days !== null && (
              <span className="ml-1.5 font-medium text-foreground">
                · in {days} {days === 1 ? "Tag" : "Tagen"}
              </span>
            )}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          <span className="font-mono text-foreground">{exam.flashcardsWorked}/{exam.flashcardsTotal}</span>
          {" "}Karten
          <span className="mx-2 text-border">|</span>
          <span className="font-mono text-foreground">{exam.examQuestionsWorked}/{exam.examQuestionsTotal}</span>
          {" "}Aufgaben
        </p>

        {exam.inProgressSessionId && (
          <div className="mt-4">
            <Link
              href={`/klausuren/${exam.id}/probeklausur/session/${exam.inProgressSessionId}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Probeklausur fortsetzen
            </Link>
          </div>
        )}

        {exam.isProcessing && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" strokeWidth={2} />
            <span>Verarbeitung läuft</span>
          </div>
        )}
      </div>

      <div className={cn("flex items-center gap-1 border-t border-[#E3E8ED] px-3 py-2.5")}>
        <Link
          href={`/klausuren/${exam.id}/flashcards`}
          className="rounded px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Karteikarten
        </Link>
        <Link
          href={`/klausuren/${exam.id}/probeklausur`}
          className="rounded px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Probeklausur
        </Link>
        {exam.errorCount > 0 && (
          <Link
            href={`/fehler/karteikarten/session?examId=${exam.id}`}
            className="rounded px-2.5 py-1.5 text-xs text-[#DC4A4A] transition-colors hover:bg-[#DC4A4A]/10"
          >
            Fehler
          </Link>
        )}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: allExamsRaw } = await supabase
    .from("exams")
    .select("id, name, exam_date, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const exams = allExamsRaw ?? []

  if (exams.length === 0) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6">
        <div className="max-w-[960px]">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
            Willkommen bei StudyLab
          </h1>
          <p className="mb-10 text-sm text-muted-foreground">
            Dein persönlicher Lernbereich für die Klausurvorbereitung.
          </p>
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
            <FileText className="mb-4 size-10 text-slate-300" strokeWidth={1.5} />
            <h2 className="mb-1 text-base font-medium text-slate-700">
              Noch keine Klausuren angelegt
            </h2>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Lade eine Zusammenfassung hoch, um Karteikarten und Probeklausuren zu generieren.
            </p>
            <Link href="/klausuren">
              <Button size="sm">
                <Plus strokeWidth={2} />
                Erste Klausur erstellen
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const examIds = exams.map((e) => e.id)

  // Load blocks with nested IDs and summary processing status
  const { data: blocksRaw } = await supabase
    .from("blocks")
    .select(
      "id, exam_id, summaries(id, processing_status, sections(id, flashcards(id), exam_questions(id)))",
    )
    .in("exam_id", examIds)

  type SummaryRaw = {
    id: string
    processing_status: string
    sections: { id: string; flashcards: { id: string }[]; exam_questions: { id: string }[] }[]
  }
  type BlockRaw = { id: string; exam_id: string; summaries: SummaryRaw[] }
  const blocks = (blocksRaw ?? []) as unknown as BlockRaw[]

  const examFlashcardIds = new Map<string, string[]>()
  const examExamQuestionIds = new Map<string, string[]>()
  const examIsProcessing = new Map<string, boolean>()

  for (const block of blocks) {
    const fcIds = block.summaries.flatMap((s) =>
      s.sections.flatMap((sec) => sec.flashcards.map((f) => f.id)),
    )
    const eqIds = block.summaries.flatMap((s) =>
      s.sections.flatMap((sec) => sec.exam_questions.map((eq) => eq.id)),
    )
    const processing = block.summaries.some(
      (s) => s.processing_status === "parsing" || s.processing_status === "generating",
    )

    examFlashcardIds.set(block.exam_id, [
      ...(examFlashcardIds.get(block.exam_id) ?? []),
      ...fcIds,
    ])
    examExamQuestionIds.set(block.exam_id, [
      ...(examExamQuestionIds.get(block.exam_id) ?? []),
      ...eqIds,
    ])
    if (processing) examIsProcessing.set(block.exam_id, true)
  }

  const allFlashcardIds = [...examFlashcardIds.values()].flat()
  const allExamQuestionIds = [...examExamQuestionIds.values()].flat()

  // Run all remaining queries in parallel
  const [
    { data: fcAttempts },
    { data: eqAttempts },
    { data: fcErrors },
    { data: eqErrors },
    { data: openSessionsRaw },
  ] = await Promise.all([
    allFlashcardIds.length > 0
      ? supabase
          .from("attempts")
          .select("flashcard_id, created_at")
          .in("flashcard_id", allFlashcardIds)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    allExamQuestionIds.length > 0
      ? supabase
          .from("attempts")
          .select("exam_question_id, created_at")
          .in("exam_question_id", allExamQuestionIds)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    allFlashcardIds.length > 0
      ? supabase
          .from("error_pool")
          .select("flashcard_id")
          .eq("user_id", user.id)
          .in("flashcard_id", allFlashcardIds)
      : Promise.resolve({ data: null }),
    allExamQuestionIds.length > 0
      ? supabase
          .from("error_pool")
          .select("exam_question_id")
          .eq("user_id", user.id)
          .in("exam_question_id", allExamQuestionIds)
      : Promise.resolve({ data: null }),
    supabase
      .from("exam_sessions")
      .select("id, exam_id, created_at")
      .in("exam_id", examIds)
      .eq("user_id", user.id)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false }),
  ])

  // Build lookup maps from query results
  const flashcardAttemptMap = new Map<string, string>()
  for (const a of fcAttempts ?? []) {
    if (a.flashcard_id && !flashcardAttemptMap.has(a.flashcard_id)) {
      flashcardAttemptMap.set(a.flashcard_id, a.created_at)
    }
  }

  const examQuestionAttemptMap = new Map<string, string>()
  for (const a of eqAttempts ?? []) {
    if (a.exam_question_id && !examQuestionAttemptMap.has(a.exam_question_id)) {
      examQuestionAttemptMap.set(a.exam_question_id, a.created_at)
    }
  }

  const flashcardErrorSet = new Set<string>()
  for (const e of fcErrors ?? []) {
    if (e.flashcard_id) flashcardErrorSet.add(e.flashcard_id)
  }

  const examQuestionErrorSet = new Set<string>()
  for (const e of eqErrors ?? []) {
    if (e.exam_question_id) examQuestionErrorSet.add(e.exam_question_id)
  }

  const examSessionMap = new Map<string, string>()
  for (const s of openSessionsRaw ?? []) {
    if (!examSessionMap.has(s.exam_id)) {
      examSessionMap.set(s.exam_id, s.id)
    }
  }

  // Build card data per exam
  const examCardData: ExamCardData[] = exams.map((exam) => {
    const fcIds = examFlashcardIds.get(exam.id) ?? []
    const eqIds = examExamQuestionIds.get(exam.id) ?? []

    const flashcardsWorked = fcIds.filter((id) => flashcardAttemptMap.has(id)).length
    const examQuestionsWorked = eqIds.filter((id) => examQuestionAttemptMap.has(id)).length
    const errorCount =
      fcIds.filter((id) => flashcardErrorSet.has(id)).length +
      eqIds.filter((id) => examQuestionErrorSet.has(id)).length

    let lastActivity: Date | null = null
    for (const id of fcIds) {
      const ts = flashcardAttemptMap.get(id)
      if (ts) {
        const d = new Date(ts)
        if (!lastActivity || d > lastActivity) lastActivity = d
      }
    }
    for (const id of eqIds) {
      const ts = examQuestionAttemptMap.get(id)
      if (ts) {
        const d = new Date(ts)
        if (!lastActivity || d > lastActivity) lastActivity = d
      }
    }

    return {
      id: exam.id,
      name: exam.name,
      exam_date: exam.exam_date,
      created_at: exam.created_at,
      flashcardsTotal: fcIds.length,
      flashcardsWorked,
      examQuestionsTotal: eqIds.length,
      examQuestionsWorked,
      errorCount,
      inProgressSessionId: examSessionMap.get(exam.id) ?? null,
      isProcessing: examIsProcessing.get(exam.id) ?? false,
      lastActivity,
    }
  })

  // Sort by last activity, fallback to exam created_at
  const sorted = [...examCardData].sort((a, b) => {
    if (a.lastActivity && b.lastActivity) {
      return b.lastActivity.getTime() - a.lastActivity.getTime()
    }
    if (a.lastActivity) return -1
    if (b.lastActivity) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const displayExams = sorted.slice(0, 4)
  const totalExams = exams.length
  const showPlusCard = totalExams < 4
  const showAllLink = totalExams >= 4

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[960px]">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
          Willkommen bei StudyLab
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Dein persönlicher Lernbereich für die Klausurvorbereitung.
        </p>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Deine Klausuren</h2>
          {showAllLink && (
            <Link
              href="/klausuren"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Alle {totalExams} Klausuren anzeigen →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {displayExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
          {showPlusCard && (
            <Link
              href="/klausuren"
              className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-8 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Plus className="size-6" strokeWidth={1.5} />
              <span className="text-sm">Neue Klausur hinzufügen</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
