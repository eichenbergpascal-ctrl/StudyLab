import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { ExamCard } from "./_components/ExamCard"
import { CreateExamButton } from "./_components/CreateExamButton"

export const metadata: Metadata = {
  title: "Klausuren",
}

export default async function KlausurenPage() {
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
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
              Klausuren
            </h1>
            <p className="text-sm text-muted-foreground">
              {count} {count === 1 ? "Klausur" : "Klausuren"} angelegt
            </p>
          </div>
          <CreateExamButton />
        </div>

        {count === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
              <BookOpen className="size-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <h2 className="mb-1 text-base font-medium text-foreground">
              Noch keine Klausuren angelegt
            </h2>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Erstelle deine erste Klausur und beginne mit der Vorbereitung.
            </p>
            <CreateExamButton />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {exams!.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
