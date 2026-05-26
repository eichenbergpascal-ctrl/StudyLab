import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CheckSquare, ChevronRight, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Probeklausuren",
}

export default async function ProbeklausurenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: examsRaw } = await supabase
    .from("exams")
    .select(
      `
      id, name, subject,
      blocks (
        id,
        summaries (
          sections (
            id,
            exam_questions ( id )
          )
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("exam_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  const exams = (examsRaw ?? []).map((exam) => {
    const totalQuestions = (exam.blocks ?? [])
      .flatMap((b) => b.summaries ?? [])
      .flatMap((s) => s.sections ?? [])
      .reduce((sum, s) => sum + (s.exam_questions ?? []).length, 0)
    return {
      id: exam.id,
      name: exam.name,
      subject: exam.subject as string | null,
      totalQuestions,
    }
  })

  const grandTotal = exams.reduce((sum, e) => sum + e.totalQuestions, 0)
  const examIds = exams.map((e) => e.id)

  // Load which exams have an open session — used for the "Läuft" badge
  const openByExam = new Set<string>()
  if (examIds.length > 0) {
    const { data: openSessions } = await supabase
      .from("exam_sessions")
      .select("exam_id")
      .in("exam_id", examIds)
      .eq("user_id", user.id)
      .eq("status", "in_progress")
    for (const s of openSessions ?? []) {
      openByExam.add(s.exam_id)
    }
  }

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
              Probeklausuren
            </h1>
            <p className="text-sm text-muted-foreground">
              {grandTotal} {grandTotal === 1 ? "Frage" : "Fragen"} über{" "}
              {exams.length} {exams.length === 1 ? "Klausur" : "Klausuren"}
            </p>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
              <CheckSquare className="size-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <h2 className="mb-1 text-base font-medium text-foreground">
              Noch keine Probeklausuren
            </h2>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Erstelle eine Klausur und lade Zusammenfassungen hoch, um
              Aufgaben zu generieren.
            </p>
            <Link
              href="/klausuren"
              className={buttonVariants({ variant: "outline" })}
            >
              Zu den Klausuren
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {exams.map((exam) => {
              const hasOpenSession = openByExam.has(exam.id)
              return (
                <Link
                  key={exam.id}
                  href={`/klausuren/${exam.id}/probeklausur`}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {exam.name}
                      </span>
                      {hasOpenSession && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <Clock className="size-3" strokeWidth={2} />
                          Läuft
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3">
                      {exam.subject && (
                        <span className="text-xs text-muted-foreground">
                          {exam.subject}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {exam.totalQuestions}{" "}
                        {exam.totalQuestions === 1 ? "Frage" : "Fragen"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
                    strokeWidth={2}
                  />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
