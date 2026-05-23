import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronRight, FileText, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: recentExams } = await supabase
    .from("exams")
    .select("id, name, subject, exam_date")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  const hasExams = recentExams && recentExams.length > 0

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
          Willkommen bei StudyLab
        </h1>
        <p className="text-sm text-muted-foreground">
          Dein persönlicher Lernbereich für die Klausurvorbereitung.
        </p>

        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">
              Zuletzt hinzugefügt
            </h2>
            {hasExams && (
              <Link
                href="/klausuren"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Alle anzeigen
              </Link>
            )}
          </div>

          {hasExams ? (
            <div className="flex flex-col gap-2">
              {recentExams.map((exam) => (
                <Link
                  key={exam.id}
                  href={`/klausuren/${exam.id}`}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {exam.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      {exam.subject && <span>{exam.subject}</span>}
                      {exam.subject && exam.exam_date && <span>·</span>}
                      {exam.exam_date && (
                        <span>{formatDate(exam.exam_date)}</span>
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
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
              <FileText
                className="mb-4 size-10 text-slate-300"
                strokeWidth={1.5}
              />
              <h2 className="mb-1 text-base font-medium text-slate-700">
                Noch keine Klausuren angelegt
              </h2>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Lade eine Zusammenfassung hoch, um Karteikarten und
                Probeklausuren zu generieren.
              </p>
              <Link href="/klausuren">
                <Button size="sm">
                  <Plus strokeWidth={2} />
                  Erste Klausur erstellen
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
