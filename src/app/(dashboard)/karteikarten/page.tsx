import { redirect } from "next/navigation"
import Link from "next/link"
import { Layers, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"

export default async function KarteikartenPage() {
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
            flashcards ( id )
          )
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("exam_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  // Show exams with at least 1 block that has sections — user can navigate there to generate
  const exams = (examsRaw ?? [])
    .map((exam) => {
      const allSections = (exam.blocks ?? [])
        .flatMap((b) => b.summaries ?? [])
        .flatMap((s) => s.sections ?? [])
      const hasSections = allSections.length > 0
      const totalCount = allSections.reduce(
        (sum, s) => sum + (s.flashcards ?? []).length,
        0,
      )
      return {
        id: exam.id,
        name: exam.name,
        subject: exam.subject as string | null,
        totalCount,
        hasSections,
      }
    })
    .filter((e) => e.hasSections)

  const grandTotal = exams.reduce((sum, e) => sum + e.totalCount, 0)

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
              Karteikarten
            </h1>
            <p className="text-sm text-muted-foreground">
              {grandTotal} {grandTotal === 1 ? "Karte" : "Karten"} über{" "}
              {exams.length} {exams.length === 1 ? "Klausur" : "Klausuren"}
            </p>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
              <Layers className="size-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <h2 className="mb-1 text-base font-medium text-foreground">
              Noch keine Karteikarten
            </h2>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Lade eine Zusammenfassung in einer Klausur hoch, um Karteikarten
              zu generieren.
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
            {exams.map((exam) => (
              <Link
                key={exam.id}
                href={`/klausuren/${exam.id}/flashcards`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">
                    {exam.name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3">
                    {exam.subject && (
                      <span className="text-xs text-muted-foreground">
                        {exam.subject}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {exam.totalCount}{" "}
                      {exam.totalCount === 1 ? "Karte" : "Karten"}
                    </span>
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
