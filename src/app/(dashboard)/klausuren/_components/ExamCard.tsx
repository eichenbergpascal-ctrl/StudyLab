import Link from "next/link"
import { Calendar, ChevronRight } from "lucide-react"
import { Tables } from "@/lib/database.types"

type Exam = Tables<"exams">

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

export function ExamCard({ exam }: { exam: Exam }) {
  return (
    <Link
      href={`/klausuren/${exam.id}`}
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
  )
}
