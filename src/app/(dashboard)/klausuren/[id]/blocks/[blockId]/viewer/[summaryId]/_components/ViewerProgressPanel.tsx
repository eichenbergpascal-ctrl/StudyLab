"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, FileText, Layers } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StartSectionButton } from "./StartSectionButton"

export type SectionStat = {
  sectionId: string
  title: string
  startPage: number | null
  flashcardsTotal: number
  flashcardsWorked: number
  flashcardsCorrect: number
  flashcardsIncorrect: number
  examQuestionsTotal: number
  examQuestionsWorked: number
  examQuestionsCorrect: number
  examQuestionsIncorrect: number
}

export function ViewerProgressPanel({
  sections,
  examId,
}: {
  sections: SectionStat[]
  examId: string
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-card transition-all duration-150",
        isOpen ? "w-80" : "w-10",
      )}
    >
      <div className="flex shrink-0 items-center border-b border-border px-3 py-3.5">
        {isOpen && (
          <span className="flex-1 text-sm font-semibold text-foreground">Fortschritt</span>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={isOpen ? "Panel ausblenden" : "Fortschritt anzeigen"}
        >
          {isOpen ? (
            <ChevronRight className="size-4" strokeWidth={2} />
          ) : (
            <ChevronLeft className="size-4" strokeWidth={2} />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {sections.map((section, i) => (
            <div
              key={section.sectionId}
              className={cn("px-4 py-4", i > 0 && "border-t border-border")}
            >
              <h3 className="mb-3 line-clamp-2 text-sm font-medium text-foreground">
                {section.title}
              </h3>

              <div className="mb-3 space-y-2">
                <div>
                  <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Layers className="size-3 shrink-0" strokeWidth={2} />
                    Karteikarten
                  </p>
                  <p className="font-mono text-xs text-foreground">
                    {section.flashcardsWorked}/{section.flashcardsTotal} bearbeitet
                    {section.flashcardsWorked > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {section.flashcardsCorrect}r / {section.flashcardsIncorrect}f
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                    {/* CheckSquare inline to avoid import conflict with StartSectionButton */}
                    <svg
                      className="size-3 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    Aufgaben
                  </p>
                  <p className="font-mono text-xs text-foreground">
                    {section.examQuestionsWorked}/{section.examQuestionsTotal} bearbeitet
                    {section.examQuestionsWorked > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {section.examQuestionsCorrect}r / {section.examQuestionsIncorrect}f
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {section.startPage != null && (
                  <Link
                    href={`?page=${section.startPage}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full justify-start gap-2",
                    )}
                  >
                    <FileText className="size-3.5 shrink-0" strokeWidth={2} />
                    Im PDF anzeigen
                  </Link>
                )}
                {section.flashcardsTotal > 0 && (
                  <Link
                    href={`/klausuren/${examId}/flashcards/session?section=${section.sectionId}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full justify-start gap-2",
                    )}
                  >
                    <Layers className="size-3.5 shrink-0" strokeWidth={2} />
                    Karteikarten lernen
                  </Link>
                )}
                {section.examQuestionsTotal > 0 && (
                  <StartSectionButton examId={examId} sectionId={section.sectionId} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
