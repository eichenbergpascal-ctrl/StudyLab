import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Layers } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { BlockAccordion } from "./_components/BlockAccordion"

export default async function FlashcardsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!exam) notFound()

  const { data: blocksRaw } = await supabase
    .from("blocks")
    .select(
      `
      id, name, weight_percent,
      summaries (
        id,
        sections (
          id, title, sort_order,
          flashcards ( id, question, answer, is_user_created )
        )
      )
    `,
    )
    .eq("exam_id", id)
    .order("created_at", { ascending: true })

  // Collect all flashcard IDs to look up latest attempts per section
  type SectionEntry = { sectionId: string; flashcardIds: string[] }
  const sectionEntries: SectionEntry[] = []

  for (const block of blocksRaw ?? []) {
    for (const summary of block.summaries) {
      for (const section of summary.sections) {
        const ids = section.flashcards.map((f: { id: string }) => f.id)
        if (ids.length > 0) sectionEntries.push({ sectionId: section.id, flashcardIds: ids })
      }
    }
  }

  const allFlashcardIds = sectionEntries.flatMap((e) => e.flashcardIds)

  // Latest attempt date per flashcard
  const latestAttemptBySectionId = new Map<string, string>()

  if (allFlashcardIds.length > 0) {
    const { data: attempts } = await supabase
      .from("attempts")
      .select("flashcard_id, created_at")
      .in("flashcard_id", allFlashcardIds)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    // Build map: flashcardId → latest created_at
    const latestByFlashcard = new Map<string, string>()
    for (const a of attempts ?? []) {
      if (a.flashcard_id && !latestByFlashcard.has(a.flashcard_id)) {
        latestByFlashcard.set(a.flashcard_id, a.created_at)
      }
    }

    // Derive latest per section
    for (const { sectionId, flashcardIds } of sectionEntries) {
      const dates = flashcardIds
        .map((fid) => latestByFlashcard.get(fid))
        .filter(Boolean) as string[]
      if (dates.length > 0) {
        const latest = dates.reduce((a, b) => (a > b ? a : b))
        latestAttemptBySectionId.set(sectionId, latest)
      }
    }
  }

  // Build structured block data for the accordion component
  const blocks = (blocksRaw ?? []).map((block) => {
    const sections = block.summaries
      .flatMap((summary) => summary.sections)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((s) => ({
        id: s.id,
        title: s.title,
        sort_order: s.sort_order,
        flashcardCount: s.flashcards.length,
        aiFlashcardCount: s.flashcards.filter(
          (f: { is_user_created: boolean }) => !f.is_user_created,
        ).length,
        lastStudied: latestAttemptBySectionId.get(s.id) ?? null,
        flashcards: s.flashcards.map(
          (f: { id: string; question: string; answer: string; is_user_created: boolean }) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            is_user_created: f.is_user_created,
          }),
        ),
      }))
    const totalCount = sections.reduce((sum, s) => sum + s.flashcardCount, 0)
    return { id: block.id, name: block.name, weight_percent: block.weight_percent, sections, totalCount }
  })

  const totalCount = blocks.reduce((sum, b) => sum + b.totalCount, 0)
  // Show all blocks that have at least one section — even if sections have 0 cards
  const blocksWithSections = blocks.filter((b) => b.sections.length > 0)

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <Link
          href={`/klausuren/${id}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          {exam.name}
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
              Karteikarten
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalCount} Karten · {exam.name}
            </p>
          </div>
          {totalCount > 0 && (
            <Link
              href={`/klausuren/${id}/flashcards/session`}
              className={buttonVariants()}
            >
              Lernsession starten
            </Link>
          )}
        </div>

        {blocksWithSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-16 text-center">
            <Layers className="mb-3 size-8 text-slate-300" strokeWidth={1.5} />
            <p className="max-w-sm text-sm text-muted-foreground">
              Noch keine Karteikarten. Lade eine Zusammenfassung hoch, um Karteikarten zu
              generieren.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {blocksWithSections.map((block) => (
              <BlockAccordion key={block.id} block={block} examId={id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
