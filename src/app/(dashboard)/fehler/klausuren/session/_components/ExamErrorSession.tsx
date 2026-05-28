"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { TypedExamQuestion } from "@/lib/types/exam-questions"
import { McQuestion } from "@/app/(dashboard)/klausuren/[id]/probeklausur/_components/question-types/McQuestion"
import { FillBlankQuestion } from "@/app/(dashboard)/klausuren/[id]/probeklausur/_components/question-types/FillBlankQuestion"
import { MatchingQuestion } from "@/app/(dashboard)/klausuren/[id]/probeklausur/_components/question-types/MatchingQuestion"
import { FreeTextQuestion } from "@/app/(dashboard)/klausuren/[id]/probeklausur/_components/question-types/FreeTextQuestion"
import { TrueFalseQuestion } from "@/app/(dashboard)/klausuren/[id]/probeklausur/_components/question-types/TrueFalseQuestion"
import { OrderingQuestion } from "@/app/(dashboard)/klausuren/[id]/probeklausur/_components/question-types/OrderingQuestion"
import { CalculationQuestion } from "@/app/(dashboard)/klausuren/[id]/probeklausur/_components/question-types/CalculationQuestion"

type Phase = "session" | "end"

function QuestionRenderer({
  question,
  onRate,
  disabled,
}: {
  question: TypedExamQuestion
  onRate: (isCorrect: boolean, response: unknown) => void
  disabled: boolean
}) {
  switch (question.question_type) {
    case "mc":
      return <McQuestion key={question.id} question={question} onRate={onRate} disabled={disabled} />
    case "fill_blank":
      return <FillBlankQuestion key={question.id} question={question} onRate={onRate} disabled={disabled} />
    case "matching":
      return <MatchingQuestion key={question.id} question={question} onRate={onRate} disabled={disabled} />
    case "free_text":
      return <FreeTextQuestion key={question.id} question={question} onRate={onRate} disabled={disabled} />
    case "true_false":
      return <TrueFalseQuestion key={question.id} question={question} onRate={onRate} disabled={disabled} />
    case "ordering":
      return <OrderingQuestion key={question.id} question={question} onRate={onRate} disabled={disabled} />
    case "calculation":
      return <CalculationQuestion key={question.id} question={question} onRate={onRate} disabled={disabled} />
  }
}

export function ExamErrorSession({
  questions,
  userId,
}: {
  questions: TypedExamQuestion[]
  userId: string
}) {
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>(questions.length === 0 ? "end" : "session")
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const [isRating, setIsRating] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const total = questions.length
  const currentQuestion = questions[index] ?? null

  const handleRate = useCallback(
    async (isCorrect: boolean, response: unknown) => {
      if (!currentQuestion || isRating) return
      setIsRating(true)

      await supabase.from("attempts").insert({
        user_id: userId,
        exam_question_id: currentQuestion.id,
        is_correct: isCorrect,
        session_type: "error_session" as const,
      })

      if (isCorrect) setCorrect((c) => c + 1)
      else setIncorrect((c) => c + 1)

      if (index + 1 >= total) {
        setPhase("end")
      } else {
        setIndex((i) => i + 1)
      }

      setIsRating(false)
    },
    [currentQuestion, index, total, userId, supabase, isRating],
  )

  if (phase === "end") {
    const done = correct + incorrect
    const pct = done > 0 ? Math.round((correct / done) * 100) : 0
    const remaining = incorrect

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-4 md:px-8 md:py-6">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto mb-6 size-10 text-slate-300" strokeWidth={1.5} />
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            {total === 0 ? "Keine Fehler-Aufgaben" : "Session abgeschlossen"}
          </h2>
          {total === 0 ? (
            <p className="mb-8 text-sm text-muted-foreground">
              Keine fehlerhaften Klausuraufgaben im Pool.
            </p>
          ) : (
            <div className="mb-8">
              <p className="mb-6 text-sm text-muted-foreground">{total} Aufgaben abgeschlossen</p>
              <div className="mb-4 flex justify-center gap-10">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[#36A06E]">{correct}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Richtig</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-[#DC4A4A]">{incorrect}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Falsch</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground">{pct} %</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Quote</div>
                </div>
              </div>
              {remaining > 0 && (
                <p className="text-sm text-muted-foreground">
                  {remaining} {remaining === 1 ? "Aufgabe verbleibt" : "Aufgaben verbleiben"} im Fehler-Pool.
                </p>
              )}
              {remaining === 0 && (
                <p className="text-sm text-[#36A06E]">
                  Alle Aufgaben richtig — Fehler-Pool geleert!
                </p>
              )}
            </div>
          )}
          <Link href="/fehler" className={buttonVariants()}>
            Zurück zum Fehler-Pool
          </Link>
        </div>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[960px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/fehler"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            Fehler-Pool
          </Link>
          <span className="font-mono text-sm text-muted-foreground">
            Frage {index + 1} / {total}
          </span>
        </div>

        <div className="mb-8 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <QuestionRenderer
          key={currentQuestion.id}
          question={currentQuestion}
          onRate={handleRate}
          disabled={isRating}
        />
      </div>
    </div>
  )
}
