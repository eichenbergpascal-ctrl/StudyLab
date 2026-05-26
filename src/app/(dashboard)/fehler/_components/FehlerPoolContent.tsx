"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { AlertCircle, ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FlashcardError = {
  flashcard_id: string
  question: string
  section_title: string
  block_id: string
  block_name: string
  exam_id: string
  exam_name: string
  created_at: string
}

export type ExamQuestionError = {
  exam_question_id: string
  question_type: string
  question_preview: string
  section_title: string
  block_id: string
  block_name: string
  exam_id: string
  exam_name: string
  created_at: string
}

type BlockGroup<T> = { block_id: string; block_name: string; items: T[] }
type ExamGroup<T> = { exam_id: string; exam_name: string; total: number; blocks: BlockGroup<T>[] }

function groupErrors<T extends { exam_id: string; exam_name: string; block_id: string; block_name: string }>(
  items: T[]
): ExamGroup<T>[] {
  const map = new Map<string, ExamGroup<T>>()
  for (const item of items) {
    if (!map.has(item.exam_id)) {
      map.set(item.exam_id, { exam_id: item.exam_id, exam_name: item.exam_name, total: 0, blocks: [] })
    }
    const eg = map.get(item.exam_id)!
    let bg = eg.blocks.find(b => b.block_id === item.block_id)
    if (!bg) {
      bg = { block_id: item.block_id, block_name: item.block_name, items: [] }
      eg.blocks.push(bg)
    }
    bg.items.push(item)
    eg.total++
  }
  return Array.from(map.values())
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Berlin",
  }).format(new Date(dateStr))
}

function QuestionTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    mc: "Multiple Choice",
    fill_blank: "Lückentext",
    matching: "Zuordnung",
    free_text: "Freitext",
  }
  return (
    <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
      {labels[type] ?? type}
    </span>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-16 text-center">
      <AlertCircle className="mb-3 size-8 text-slate-300" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground">Keine offenen Fehler</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Keine fehlerhaften {label} — weiter so!
      </p>
    </div>
  )
}

export function FehlerPoolContent({
  flashcardErrors,
  examErrors,
  emptyParam,
}: {
  flashcardErrors: FlashcardError[]
  examErrors: ExamQuestionError[]
  emptyParam?: string
}) {
  const [tab, setTab] = useState<"karteikarten" | "klausuren">("karteikarten")

  useEffect(() => {
    if (!emptyParam) return
    const message =
      emptyParam === "block"
        ? "Keine offenen Fehler für diesen Block."
        : "Keine offenen Fehler für diese Klausur."
    toast.info(message, { duration: 5000 })
  }, [emptyParam])

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
          Fehler-Pool
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Alle falsch beantworteten Karteikarten und Klausuraufgaben
        </p>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 border-b border-border">
          {(["karteikarten", "klausuren"] as const).map((t) => {
            const label = t === "karteikarten" ? "Karteikarten" : "Klausuraufgaben"
            const count = t === "karteikarten" ? flashcardErrors.length : examErrors.length
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "relative -mb-px flex items-center gap-2 border-b-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors",
                  tab === t
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px]",
                    count > 0
                      ? "bg-[#DC4A4A]/10 text-[#DC4A4A]"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Karteikarten Tab */}
        {tab === "karteikarten" && (
          <div className="flex flex-col gap-6">
            {flashcardErrors.length === 0 ? (
              <EmptyState label="Karteikarten" />
            ) : (
              groupErrors(flashcardErrors).map((examGroup) => (
                <div key={examGroup.exam_id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{examGroup.exam_name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {examGroup.total} {examGroup.total === 1 ? "Karte" : "Karten"}
                      </p>
                    </div>
                    <Link
                      href={`/fehler/karteikarten/session?examId=${examGroup.exam_id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Klausur üben
                    </Link>
                  </div>

                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {examGroup.blocks.map((blockGroup, blockIdx) => (
                      <div key={blockGroup.block_id}>
                        <div
                          className={cn(
                            "flex items-center justify-between px-5 py-3 bg-slate-50",
                            blockIdx > 0 && "border-t border-border"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{blockGroup.block_name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({blockGroup.items.length} {blockGroup.items.length === 1 ? "Karte" : "Karten"})
                            </span>
                          </div>
                          <Link
                            href={`/fehler/karteikarten/session?blockId=${blockGroup.block_id}`}
                            className={buttonVariants({ size: "sm", variant: "outline" })}
                          >
                            Block üben
                          </Link>
                        </div>
                        {blockGroup.items.map((item) => (
                          <div
                            key={item.flashcard_id}
                            className="flex items-start justify-between gap-4 border-t border-border px-5 py-4"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="mb-1 line-clamp-2 text-sm text-foreground">
                                {item.question}
                              </p>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{item.block_name}</span>
                                <ChevronRight className="size-3 shrink-0" strokeWidth={2} />
                                <span>{item.section_title}</span>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {item.created_at ? formatDate(item.created_at) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Klausuraufgaben Tab */}
        {tab === "klausuren" && (
          <div className="flex flex-col gap-6">
            {examErrors.length === 0 ? (
              <EmptyState label="Klausuraufgaben" />
            ) : (
              groupErrors(examErrors).map((examGroup) => (
                <div key={examGroup.exam_id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">{examGroup.exam_name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {examGroup.total} {examGroup.total === 1 ? "Aufgabe" : "Aufgaben"}
                      </p>
                    </div>
                    <Link
                      href={`/fehler/klausuren/session?examId=${examGroup.exam_id}`}
                      className={buttonVariants({ size: "sm" })}
                    >
                      Klausur üben
                    </Link>
                  </div>

                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    {examGroup.blocks.map((blockGroup, blockIdx) => (
                      <div key={blockGroup.block_id}>
                        <div
                          className={cn(
                            "flex items-center justify-between px-5 py-3 bg-slate-50",
                            blockIdx > 0 && "border-t border-border"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{blockGroup.block_name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({blockGroup.items.length} {blockGroup.items.length === 1 ? "Aufgabe" : "Aufgaben"})
                            </span>
                          </div>
                          <Link
                            href={`/fehler/klausuren/session?blockId=${blockGroup.block_id}`}
                            className={buttonVariants({ size: "sm", variant: "outline" })}
                          >
                            Block üben
                          </Link>
                        </div>
                        {blockGroup.items.map((item) => (
                          <div
                            key={item.exam_question_id}
                            className="flex items-start justify-between gap-4 border-t border-border px-5 py-4"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <QuestionTypeLabel type={item.question_type} />
                                <p className="line-clamp-1 text-sm text-foreground">
                                  {item.question_preview}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span>{item.block_name}</span>
                                <ChevronRight className="size-3 shrink-0" strokeWidth={2} />
                                <span>{item.section_title}</span>
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {item.created_at ? formatDate(item.created_at) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
