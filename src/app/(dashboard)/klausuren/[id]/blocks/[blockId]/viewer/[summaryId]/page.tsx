import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { PdfViewerClient } from "@/components/pdf-viewer/PdfViewerClient"
import { ViewerProgressPanel, type SectionStat } from "./_components/ViewerProgressPanel"

export default async function SummaryViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; blockId: string; summaryId: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id: examId, blockId, summaryId } = await params
  const { page: pageParam } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Verify ownership chain: summary → block → exam → user_id
  const { data: exam } = await supabase
    .from("exams")
    .select("id, name")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()

  if (!exam) notFound()

  const { data: block } = await supabase
    .from("blocks")
    .select("id, name")
    .eq("id", blockId)
    .eq("exam_id", examId)
    .single()

  if (!block) notFound()

  const { data: summary } = await supabase
    .from("summaries")
    .select("id, filename, storage_path, processing_status")
    .eq("id", summaryId)
    .eq("block_id", blockId)
    .single()

  if (!summary) notFound()

  const { data: signedUrlData, error: signedUrlError } =
    await supabase.storage
      .from("summaries")
      .createSignedUrl(summary.storage_path, 3600)

  // Pass the 1-based ?page param directly — PdfViewer uses 1-based page numbers
  const rawPage = pageParam ? parseInt(pageParam, 10) : NaN
  const initialPage = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : undefined

  // Load section progress panel data only when processing is completed
  let sectionStats: SectionStat[] = []
  if (summary.processing_status === "completed") {
    const { data: sectionsRaw } = await supabase
      .from("sections")
      .select("id, title, sort_order, start_page, flashcards(id), exam_questions(id)")
      .eq("summary_id", summaryId)
      .order("sort_order", { ascending: true })

    const sections = sectionsRaw ?? []

    const allFlashcardIds = sections.flatMap((s) => s.flashcards.map((f) => f.id))
    const allExamQuestionIds = sections.flatMap((s) =>
      s.exam_questions.map((eq) => eq.id),
    )

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

    sectionStats = sections.map((s) => {
      let flashcardsWorked = 0
      let flashcardsCorrect = 0
      let flashcardsIncorrect = 0
      for (const f of s.flashcards) {
        const result = flashcardLastAttempt.get(f.id)
        if (result !== undefined) {
          flashcardsWorked++
          if (result) flashcardsCorrect++
          else flashcardsIncorrect++
        }
      }

      let examQuestionsWorked = 0
      let examQuestionsCorrect = 0
      let examQuestionsIncorrect = 0
      for (const eq of s.exam_questions) {
        const result = examQuestionLastAttempt.get(eq.id)
        if (result !== undefined) {
          examQuestionsWorked++
          if (result) examQuestionsCorrect++
          else examQuestionsIncorrect++
        }
      }

      return {
        sectionId: s.id,
        title: s.title,
        startPage: (s as unknown as { start_page: number | null }).start_page ?? null,
        flashcardsTotal: s.flashcards.length,
        flashcardsWorked,
        flashcardsCorrect,
        flashcardsIncorrect,
        examQuestionsTotal: s.exam_questions.length,
        examQuestionsWorked,
        examQuestionsCorrect,
        examQuestionsIncorrect,
      }
    })
  }

  const showPanel =
    summary.processing_status === "completed" && sectionStats.length > 0

  return (
    <div className="flex h-full min-h-0">
      {/* PDF area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0 px-8 py-6">
          <Link
            href={`/klausuren/${examId}/blocks/${blockId}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            {block.name}
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {summary.filename}
          </h1>
        </div>

        <div className="min-h-0 flex-1 px-8 pb-8">
          {signedUrlError || !signedUrlData?.signedUrl ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-border bg-card">
              <p className="text-sm text-muted-foreground">
                Das PDF konnte nicht geladen werden. Bitte versuche es erneut.
              </p>
            </div>
          ) : (
            <PdfViewerClient
              url={signedUrlData.signedUrl}
              initialPage={initialPage}
              className="h-full"
            />
          )}
        </div>
      </div>

      {showPanel && (
        <ViewerProgressPanel sections={sectionStats} examId={examId} />
      )}
    </div>
  )
}
