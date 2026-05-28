import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

type BlockStats = {
  blockId: string
  blockName: string
  flashcardsTotal: number
  flashcardsWorked: number
  flashcardsCorrect: number
  flashcardsIncorrect: number
  examQuestionsTotal: number
  examQuestionsWorked: number
  examQuestionsCorrect: number
  examQuestionsIncorrect: number
  offeneFehler: number
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ examId: string }>
}): Promise<Metadata> {
  const { examId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { title: "Lernfortschritt" }
  const { data: exam } = await supabase
    .from("exams")
    .select("name")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()
  return { title: exam ? `${exam.name} – Fortschritt` : "Lernfortschritt" }
}

export default async function FortschrittDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const { examId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id, name")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()
  if (!exam) notFound()

  const { data: blocksRaw } = await supabase
    .from("blocks")
    .select("id, name, summaries(sections(id, flashcards(id), exam_questions(id)))")
    .eq("exam_id", examId)
    .order("created_at", { ascending: true })

  const blocks = blocksRaw ?? []

  type BlockIdsEntry = {
    blockId: string
    blockName: string
    flashcardIds: string[]
    examQuestionIds: string[]
  }

  const blockEntries: BlockIdsEntry[] = blocks.map((b) => ({
    blockId: b.id,
    blockName: b.name,
    flashcardIds: b.summaries.flatMap((s) =>
      s.sections.flatMap((sec) =>
        sec.flashcards.map((f: { id: string }) => f.id),
      ),
    ),
    examQuestionIds: b.summaries.flatMap((s) =>
      s.sections.flatMap((sec) =>
        sec.exam_questions.map((eq: { id: string }) => eq.id),
      ),
    ),
  }))

  const allFlashcardIds = blockEntries.flatMap((b) => b.flashcardIds)
  const allExamQuestionIds = blockEntries.flatMap((b) => b.examQuestionIds)

  // Run both attempt queries in parallel
  const [{ data: fcAttempts }, { data: eqAttempts }] = await Promise.all([
    allFlashcardIds.length > 0
      ? supabase
          .from("attempts")
          .select("flashcard_id, is_correct, created_at")
          .in("flashcard_id", allFlashcardIds)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    allExamQuestionIds.length > 0
      ? supabase
          .from("attempts")
          .select("exam_question_id, is_correct, created_at")
          .in("exam_question_id", allExamQuestionIds)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
  ])

  const flashcardLastAttempt = new Map<string, boolean>()
  for (const a of fcAttempts ?? []) {
    if (a.flashcard_id && !flashcardLastAttempt.has(a.flashcard_id)) {
      flashcardLastAttempt.set(a.flashcard_id, a.is_correct)
    }
  }

  const examQuestionLastAttempt = new Map<string, boolean>()
  for (const a of eqAttempts ?? []) {
    if (a.exam_question_id && !examQuestionLastAttempt.has(a.exam_question_id)) {
      examQuestionLastAttempt.set(a.exam_question_id, a.is_correct)
    }
  }

  const blockStats: BlockStats[] = blockEntries.map((b) => {
    let flashcardsWorked = 0
    let flashcardsCorrect = 0
    let flashcardsIncorrect = 0

    for (const id of b.flashcardIds) {
      const result = flashcardLastAttempt.get(id)
      if (result !== undefined) {
        flashcardsWorked++
        if (result) flashcardsCorrect++
        else flashcardsIncorrect++
      }
    }

    let examQuestionsWorked = 0
    let examQuestionsCorrect = 0
    let examQuestionsIncorrect = 0

    for (const id of b.examQuestionIds) {
      const result = examQuestionLastAttempt.get(id)
      if (result !== undefined) {
        examQuestionsWorked++
        if (result) examQuestionsCorrect++
        else examQuestionsIncorrect++
      }
    }

    return {
      blockId: b.blockId,
      blockName: b.blockName,
      flashcardsTotal: b.flashcardIds.length,
      flashcardsWorked,
      flashcardsCorrect,
      flashcardsIncorrect,
      examQuestionsTotal: b.examQuestionIds.length,
      examQuestionsWorked,
      examQuestionsCorrect,
      examQuestionsIncorrect,
      offeneFehler: flashcardsIncorrect + examQuestionsIncorrect,
    }
  })

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[960px]">
        <Link
          href="/fortschritt"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Alle Klausuren
        </Link>

        <div className="mb-8">
          <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
            {exam.name}
          </h1>
          <p className="text-sm text-muted-foreground">Lernfortschritt</p>
        </div>

        {blockStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Blöcke für diese Klausur angelegt.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {blockStats.map((block) => (
              <div
                key={block.blockId}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  {block.blockName}
                </h2>

                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="pb-2 text-left text-xs font-medium text-muted-foreground" />
                      <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">
                        Gesamt
                      </th>
                      <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">
                        Bearbeitet
                      </th>
                      <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">
                        Richtig
                      </th>
                      <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                        Falsch
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="py-2.5 text-sm text-foreground">Karteikarten</td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm text-foreground">
                        {block.flashcardsTotal}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm text-foreground">
                        {block.flashcardsWorked}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm text-foreground">
                        {block.flashcardsCorrect}
                      </td>
                      <td className="py-2.5 text-right font-mono text-sm text-foreground">
                        {block.flashcardsIncorrect}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-sm text-foreground">Klausuraufgaben</td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm text-foreground">
                        {block.examQuestionsTotal}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm text-foreground">
                        {block.examQuestionsWorked}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-sm text-foreground">
                        {block.examQuestionsCorrect}
                      </td>
                      <td className="py-2.5 text-right font-mono text-sm text-foreground">
                        {block.examQuestionsIncorrect}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-3 border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground">Offene Fehler:</span>{" "}
                  <span className="font-mono text-sm text-foreground">
                    {block.offeneFehler}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
