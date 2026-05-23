import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckSquare, Play, Clock, CheckCircle2 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { largestRemainder } from "@/lib/utils/largest-remainder"
import { StartSessionButton } from "./_components/StartSessionButton"
import { ExamSectionRow } from "./_components/ExamSectionRow"

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(dateStr))
}

export default async function ProbeklausurOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: examId } = await params
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

  // Load blocks with question counts per section
  const { data: blocksRaw } = await supabase
    .from("blocks")
    .select(
      "id, name, weight_percent, summaries(id, sections(id, title, exam_questions(id, question_type, question_data, answer_data, is_user_created)))",
    )
    .eq("exam_id", examId)
    .order("created_at", { ascending: true })

  const blocks = (blocksRaw ?? []).map((b) => {
    const sections = b.summaries.flatMap((s) =>
      s.sections.map((sec) => ({
        id: sec.id,
        title: sec.title,
        questionCount: sec.exam_questions.length,
        questions: sec.exam_questions.map((eq: { id: string; question_type: string; question_data: unknown; answer_data: unknown; is_user_created: boolean }) => ({
          id: eq.id,
          question_type: eq.question_type,
          question_data: eq.question_data as Record<string, unknown>,
          answer_data: eq.answer_data as Record<string, unknown>,
          is_user_created: eq.is_user_created,
        })),
      })),
    )
    const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0)
    const expectedCount = Math.max(
      3,
      Math.min(18, Math.round((b.weight_percent / 100) * 18)),
    )
    return {
      id: b.id,
      name: b.name,
      weight_percent: b.weight_percent,
      sections,
      totalQuestions,
      expectedCount,
    }
  })

  // Vollklausur expected distribution
  const distribution = largestRemainder(
    blocks.map((b) => ({ blockId: b.id, weight: b.weight_percent })),
  )
  const distributionMap = new Map(distribution.map((d) => [d.blockId, d.count]))
  const totalExpected = distribution.reduce((sum, d) => sum + d.count, 0)
  const totalAvailable = blocks.reduce((sum, b) => sum + b.totalQuestions, 0)

  // Open sessions
  const { data: openSessionFull } = await supabase
    .from("exam_sessions")
    .select("id, block_id, created_at")
    .eq("exam_id", examId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .is("block_id", null)
    .maybeSingle()

  const { data: openPartialSessions } = await supabase
    .from("exam_sessions")
    .select("id, block_id, created_at")
    .eq("exam_id", examId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .not("block_id", "is", null)

  const openPartialMap = new Map(
    (openPartialSessions ?? []).map((s) => [s.block_id!, s]),
  )

  // Completed sessions (last 5)
  const { data: completedSessions } = await supabase
    .from("exam_sessions")
    .select("id, block_id, completed_at, answers, question_ids")
    .eq("exam_id", examId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5)

  // Compute block name map
  const blockNameMap = new Map(blocks.map((b) => [b.id, b.name]))

  function getSessionResult(session: {
    answers: unknown
    question_ids: unknown
  }): { correct: number; total: number } {
    const answers = session.answers as Record<string, { is_correct: boolean }> | null
    const qids = session.question_ids as string[] | null
    const total = qids?.length ?? 0
    const correct = answers
      ? Object.values(answers).filter((a) => a.is_correct).length
      : 0
    return { correct, total }
  }

  const hasAnyOpenSession =
    !!openSessionFull || (openPartialSessions ?? []).length > 0

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <Link
          href={`/klausuren/${examId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          {exam.name}
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
              Probeklausuren
            </h1>
            <p className="text-sm text-muted-foreground">
              {totalAvailable} Fragen verfügbar · {exam.name}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Vollklausur */}
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Vollklausur</h2>

            {openSessionFull ? (
              <div className="rounded-xl border border-primary/20 bg-blue-50/50 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="size-5 shrink-0 text-primary" strokeWidth={2} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Probeklausur läuft noch
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gestartet {formatDate(openSessionFull.created_at)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/klausuren/${examId}/probeklausur/session/${openSessionFull.id}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    <Play className="size-3.5" strokeWidth={2} />
                    Fortsetzen
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Neue Probeklausur
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {totalExpected} Fragen · gewichtet nach Blockverteilung
                    </p>
                  </div>
                  <StartSessionButton
                    examId={examId}
                    label="Starten"
                    disabled={totalAvailable === 0}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Teilklausuren */}
          {blocks.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">Teilklausuren</h2>
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                {blocks.map((block, i) => {
                  const openPartial = openPartialMap.get(block.id)
                  const expected = distributionMap.get(block.id) ?? block.expectedCount
                  const isThin = block.totalQuestions < block.expectedCount

                  return (
                    <div
                      key={block.id}
                      className={i > 0 ? "border-t border-border" : ""}
                    >
                      {/* Block header */}
                      <div className="flex items-center gap-3 px-5 py-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {block.name}
                            </p>
                            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground">
                              {block.weight_percent} %
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {block.totalQuestions} Fragen verfügbar · {expected} erwartet
                            </span>
                            {isThin && (
                              <span className="text-amber-600">· Pool dünn</span>
                            )}
                          </div>
                        </div>

                        {openPartial ? (
                          <Link
                            href={`/klausuren/${examId}/probeklausur/session/${openPartial.id}`}
                            className={buttonVariants({ size: "sm" })}
                          >
                            <Play className="size-3.5" strokeWidth={2} />
                            Fortsetzen
                          </Link>
                        ) : (
                          <StartSessionButton
                            examId={examId}
                            blockId={block.id}
                            label="Starten"
                            size="sm"
                            variant="outline"
                            disabled={block.totalQuestions === 0}
                          />
                        )}
                      </div>

                      {/* Section rows */}
                      {block.sections.length > 0 && (
                        <div className="border-t border-border/60">
                          {block.sections.map((s, si) => (
                            <div
                              key={s.id}
                              className={si > 0 ? "border-t border-border/60" : ""}
                            >
                              <ExamSectionRow section={s} examId={examId} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Abgeschlossene Sessions */}
          {(completedSessions ?? []).length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                Abgeschlossene Klausuren
              </h2>
              <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
                {(completedSessions ?? []).map((session, i) => {
                  const { correct, total } = getSessionResult(session)
                  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
                  const blockName = session.block_id
                    ? blockNameMap.get(session.block_id)
                    : null

                  return (
                    <div
                      key={session.id}
                      className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? "border-t border-border" : ""}`}
                    >
                      <CheckCircle2
                        className="size-4 shrink-0 text-[#36A06E]"
                        strokeWidth={2}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {blockName ? `Teilklausur: ${blockName}` : "Vollklausur"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.completed_at
                            ? formatDate(session.completed_at)
                            : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {correct}/{total} richtig
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            pct >= 70
                              ? "text-[#36A06E]"
                              : pct >= 50
                                ? "text-amber-600"
                                : "text-[#DC4A4A]"
                          }`}
                        >
                          {pct} %
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {blocks.length === 0 && !hasAnyOpenSession && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-16 text-center">
              <CheckSquare className="mb-3 size-8 text-slate-300" strokeWidth={1.5} />
              <p className="max-w-sm text-sm text-muted-foreground">
                Noch keine Blöcke vorhanden. Erstelle zuerst Blöcke und lade
                Zusammenfassungen hoch.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
