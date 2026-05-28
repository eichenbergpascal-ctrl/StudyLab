import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { TrendingUp, Calendar, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Lernfortschritt",
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

export default async function FortschrittPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .eq("user_id", user.id)
    .order("exam_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  const count = exams?.length ?? 0

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[960px]">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
            Lernfortschritt
          </h1>
          <p className="text-sm text-muted-foreground">
            {count} {count === 1 ? "Klausur" : "Klausuren"}
          </p>
        </div>

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
              <TrendingUp className="size-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <h2 className="mb-1 text-base font-medium text-foreground">
              Noch keine Klausuren angelegt
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Erstelle zuerst eine Klausur unter "Klausuren", um deinen Fortschritt zu verfolgen.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {exams!.map((exam) => (
              <Link
                key={exam.id}
                href={`/fortschritt/${exam.id}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {exam.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    {exam.subject && (
                      <span className="text-xs text-muted-foreground">{exam.subject}</span>
                    )}
                    {exam.exam_date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" strokeWidth={2} />
                        {formatDate(exam.exam_date)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
                  strokeWidth={2}
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
