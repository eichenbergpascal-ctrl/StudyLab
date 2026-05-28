"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, CheckSquare, Check, X } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { TypedExamQuestion, SessionAnswers } from "@/lib/types/exam-questions"
import { McQuestion } from "../../../_components/question-types/McQuestion"
import { FillBlankQuestion } from "../../../_components/question-types/FillBlankQuestion"
import { MatchingQuestion } from "../../../_components/question-types/MatchingQuestion"
import { FreeTextQuestion } from "../../../_components/question-types/FreeTextQuestion"
import { TrueFalseQuestion } from "../../../_components/question-types/TrueFalseQuestion"
import { OrderingQuestion } from "../../../_components/question-types/OrderingQuestion"
import { CalculationQuestion } from "../../../_components/question-types/CalculationQuestion"

type Phase = "session" | "allDone" | "summary"

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

export function ExamSession({
  questions,
  sessionId,
  examId,
  userId,
  initialAnswers,
  blockName,
}: {
  questions: TypedExamQuestion[]
  sessionId: string
  examId: string
  userId: string
  initialAnswers: SessionAnswers
  blockName?: string
}) {
  const [phase, setPhase] = useState<Phase>(() => {
    const firstUnanswered = questions.findIndex((q) => !initialAnswers[q.id])
    return firstUnanswered === -1 ? "allDone" : "session"
  })
  const [localAnswers, setLocalAnswers] = useState<SessionAnswers>(initialAnswers)
  const [isCompleting, setIsCompleting] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Derived: first unanswered question
  const currentIndex = questions.findIndex((q) => !localAnswers[q.id])
  const currentQuestion = currentIndex >= 0 ? questions[currentIndex] : null
  const total = questions.length
  const answered = Object.keys(localAnswers).length

  const handleRate = useCallback(
    async (isCorrect: boolean, response: unknown) => {
      if (!currentQuestion) return

      const newAnswers: SessionAnswers = {
        ...localAnswers,
        [currentQuestion.id]: { response, is_correct: isCorrect },
      }
      setLocalAnswers(newAnswers)

      // Save answers to session (fire-and-forget)
      supabase
        .from("exam_sessions")
        .update({ answers: newAnswers })
        .eq("id", sessionId)
        .then(({ error }) => {
          if (error) console.error("Failed to save answer:", error)
        })

      // If this was the last question, transition to allDone
      const nextUnanswered = questions.findIndex((q) => !newAnswers[q.id])
      if (nextUnanswered === -1) {
        setPhase("allDone")
      }
    },
    [currentQuestion, localAnswers, questions, sessionId, supabase],
  )

  const handleComplete = useCallback(async () => {
    setIsCompleting(true)

    await supabase.from("attempts").insert(
      questions.map((q) => ({
        user_id: userId,
        exam_question_id: q.id,
        is_correct: localAnswers[q.id]?.is_correct ?? false,
        session_type: "exam" as const,
      })),
    )

    await supabase
      .from("exam_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", sessionId)

    setIsCompleting(false)
    setPhase("summary")
  }, [localAnswers, questions, sessionId, userId, supabase])

  // Summary screen
  if (phase === "summary") {
    const correct = Object.values(localAnswers).filter((a) => a.is_correct).length
    const incorrect = total - correct
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-4 md:px-8 md:py-6">
        <div className="w-full max-w-md text-center">
          <CheckSquare className="mx-auto mb-6 size-10 text-slate-300" strokeWidth={1.5} />
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            Probeklausur abgeschlossen
          </h2>
          {blockName && (
            <p className="mb-1 text-sm text-muted-foreground">Teilklausur: {blockName}</p>
          )}
          <div className="mb-8">
            <p className="mb-6 text-sm text-muted-foreground">{total} Fragen abgeschlossen</p>
            <div className="flex justify-center gap-10">
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
          </div>
          <Link
            href={`/klausuren/${examId}/probeklausur`}
            className={buttonVariants()}
          >
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  // All-done confirmation screen
  if (phase === "allDone") {
    const correct = Object.values(localAnswers).filter((a) => a.is_correct).length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-4 md:px-8 md:py-6">
        <div className="w-full max-w-md text-center">
          <CheckSquare className="mx-auto mb-6 size-10 text-primary" strokeWidth={1.5} />
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-foreground">
            Alle Fragen beantwortet
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Vorläufiges Ergebnis: {correct}/{total} richtig ({pct} %)
          </p>
          <p className="mb-8 text-sm text-muted-foreground">
            Klicke auf &quot;Abschließen&quot;, um deine Ergebnisse zu speichern.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={`/klausuren/${examId}/probeklausur`}
              className={buttonVariants({ variant: "outline" })}
            >
              Später abschließen
            </Link>
            <Button onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? "Wird gespeichert…" : "Abschließen"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Active session
  if (!currentQuestion) return null

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[960px]">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/klausuren/${examId}/probeklausur`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            Übersicht
          </Link>
          <span className="font-mono text-sm text-muted-foreground">
            Frage {answered + 1} / {total}
          </span>
        </div>

        <div className="mb-8 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>

        <QuestionRenderer
          key={currentQuestion.id}
          question={currentQuestion}
          onRate={handleRate}
          disabled={isCompleting}
        />
      </div>
    </div>
  )
}
