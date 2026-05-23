import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Layers, ChevronRight, CheckSquare, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ExamActions } from "./_components/ExamActions"
import { BlockList } from "./_components/BlockList"

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

export default async function ExamDetailPage({
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
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!exam) notFound()

  const { data: blocks } = await supabase
    .from("blocks")
    .select("*")
    .eq("exam_id", id)
    .order("created_at", { ascending: true })

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <Link
          href="/klausuren"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          Alle Klausuren
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
              {exam.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {exam.subject && <span>{exam.subject}</span>}
              {exam.subject && exam.exam_date && (
                <span className="text-border">·</span>
              )}
              {exam.exam_date && <span>{formatDate(exam.exam_date)}</span>}
              <span className="text-border">·</span>
              <span>
                Erstellt am {formatShortDate(exam.created_at)}
              </span>
            </div>
          </div>
          <ExamActions exam={exam} />
        </div>

        <div className="flex flex-col gap-6">
          <BlockList blocks={blocks ?? []} examId={id} />
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Karteikarten</h2>
            <Link
              href={`/klausuren/${id}/flashcards`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Layers className="size-5 text-muted-foreground" strokeWidth={2} />
                <div>
                  <p className="text-sm font-medium text-foreground">Karteikarten</p>
                  <p className="text-xs text-muted-foreground">
                    Alle Karten dieser Klausur ansehen und lernen
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
            </Link>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Probeklausuren</h2>
            <Link
              href={`/klausuren/${id}/probeklausur`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="size-5 text-muted-foreground" strokeWidth={2} />
                <div>
                  <p className="text-sm font-medium text-foreground">Probeklausuren</p>
                  <p className="text-xs text-muted-foreground">
                    Klausur simulieren mit gewichteten Fragen aus allen Blöcken
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
            </Link>
          </section>
          <section>
            <h2 className="mb-3 text-base font-semibold text-foreground">Lernfortschritt</h2>
            <Link
              href={`/fortschritt/${id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="size-5 text-muted-foreground" strokeWidth={2} />
                <div>
                  <p className="text-sm font-medium text-foreground">Lernfortschritt</p>
                  <p className="text-xs text-muted-foreground">
                    Karteikarten und Aufgaben im Überblick — pro Block
                  </p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
