"use client"

import * as React from "react"
import { X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ContributionForGroup } from "../../actions"
import type {
  McQuestionData,
  McAnswerData,
  FillBlankQuestionData,
  FillBlankAnswerData,
  MatchingQuestionData,
  MatchingAnswerData,
  FreeTextQuestionData,
  FreeTextAnswerData,
  TrueFalseQuestionData,
  TrueFalseAnswerData,
  OrderingQuestionData,
  OrderingAnswerData,
  CalculationQuestionData,
  CalculationAnswerData,
} from "@/lib/types/exam-questions"

interface Props {
  contribution: ContributionForGroup | null
  onClose: () => void
}

type FlashcardData = {
  type: "flashcard"
  question: string
  answer: string
}

type ExamQuestionData = {
  type: "exam_question"
  question_type: string
  question_data: unknown
  answer_data: unknown
}

type CardData = FlashcardData | ExamQuestionData

function QuestionSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Frage
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function AnswerSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border-l-2 border-green-500 bg-white p-4 shadow-sm">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Antwort
      </p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

function ExplanationNote({ text }: { text: string }) {
  if (!text) return null
  return (
    <p className="mt-2 text-xs text-muted-foreground italic">{text}</p>
  )
}

function FlashcardPreview({ data }: { data: FlashcardData }) {
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>{data.question}</QuestionSection>
      <AnswerSection>{data.answer}</AnswerSection>
    </div>
  )
}

function McPreview({ qd, ad }: { qd: McQuestionData; ad: McAnswerData }) {
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>
        <p>{qd.question}</p>
        <ol className="mt-2 list-decimal pl-4 space-y-1">
          {qd.options.map((opt, i) => (
            <li
              key={i}
              className={
                i === ad.correct_index ? "font-medium text-green-700" : ""
              }
            >
              {opt}
            </li>
          ))}
        </ol>
      </QuestionSection>
      <AnswerSection>
        <p>
          Korrekt: <span className="font-medium">{qd.options[ad.correct_index]}</span>
        </p>
        <ExplanationNote text={ad.explanation} />
      </AnswerSection>
    </div>
  )
}

function FillBlankPreview({
  qd,
  ad,
}: {
  qd: FillBlankQuestionData
  ad: FillBlankAnswerData
}) {
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>
        <p className="whitespace-pre-wrap">{qd.text_with_blanks}</p>
      </QuestionSection>
      <AnswerSection>
        <ol className="list-decimal pl-4 space-y-1">
          {ad.blanks.map((blank, i) => (
            <li key={i}>{blank}</li>
          ))}
        </ol>
        <ExplanationNote text={ad.explanation} />
      </AnswerSection>
    </div>
  )
}

function MatchingPreview({
  qd,
  ad,
}: {
  qd: MatchingQuestionData
  ad: MatchingAnswerData
}) {
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Links</p>
          <p className="text-xs font-medium text-muted-foreground mb-1">Rechts</p>
          {qd.left.map((l, i) => (
            <React.Fragment key={i}>
              <span>{l}</span>
              <span>{qd.right[i]}</span>
            </React.Fragment>
          ))}
        </div>
      </QuestionSection>
      <AnswerSection>
        <ul className="space-y-1">
          {ad.mapping.map((rightIdx, leftIdx) => (
            <li key={leftIdx}>
              <span className="font-medium">{qd.left[leftIdx]}</span>
              {" → "}
              {qd.right[rightIdx]}
            </li>
          ))}
        </ul>
        <ExplanationNote text={ad.explanation} />
      </AnswerSection>
    </div>
  )
}

function FreeTextPreview({
  qd,
  ad,
}: {
  qd: FreeTextQuestionData
  ad: FreeTextAnswerData
}) {
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>{qd.question}</QuestionSection>
      <AnswerSection>
        <p className="whitespace-pre-wrap">{ad.sample_answer}</p>
        {ad.key_points.length > 0 && (
          <ul className="mt-2 list-disc pl-4 space-y-0.5">
            {ad.key_points.map((kp, i) => (
              <li key={i}>{kp}</li>
            ))}
          </ul>
        )}
      </AnswerSection>
    </div>
  )
}

function TrueFalsePreview({
  qd,
  ad,
}: {
  qd: TrueFalseQuestionData
  ad: TrueFalseAnswerData
}) {
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>{qd.statement}</QuestionSection>
      <AnswerSection>
        <p>
          <span className="font-bold">{ad.is_true ? "Wahr" : "Falsch"}</span>
        </p>
        <ExplanationNote text={ad.explanation} />
      </AnswerSection>
    </div>
  )
}

function OrderingPreview({
  qd,
  ad,
}: {
  qd: OrderingQuestionData
  ad: OrderingAnswerData
}) {
  const orderedItems = ad.correct_order.map((idx) => qd.items[idx])
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>
        <p>{qd.instruction}</p>
        <ol className="mt-2 list-decimal pl-4 space-y-1">
          {qd.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </QuestionSection>
      <AnswerSection>
        <p className="mb-1.5 text-xs text-muted-foreground">Korrekte Reihenfolge:</p>
        <ol className="list-decimal pl-4 space-y-1">
          {orderedItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
        <ExplanationNote text={ad.explanation} />
      </AnswerSection>
    </div>
  )
}

function CalculationPreview({
  qd,
  ad,
}: {
  qd: CalculationQuestionData
  ad: CalculationAnswerData
}) {
  return (
    <div className="flex flex-col gap-3">
      <QuestionSection>
        <p>{qd.question}</p>
        {qd.formula_hint && (
          <p className="mt-2 italic text-muted-foreground">{qd.formula_hint}</p>
        )}
      </QuestionSection>
      <AnswerSection>
        <p>
          <span className="font-medium">{ad.correct_value}</span>
          {ad.unit && <span className="ml-1 text-muted-foreground">{ad.unit}</span>}
        </p>
        {ad.solution_steps.length > 0 && (
          <>
            <p className="mt-2 mb-1 text-xs text-muted-foreground">Lösungsschritte:</p>
            <ol className="list-decimal pl-4 space-y-1">
              {ad.solution_steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </>
        )}
        <ExplanationNote text={ad.explanation} />
      </AnswerSection>
    </div>
  )
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mc: "Multiple Choice",
  fill_blank: "Lückentext",
  matching: "Zuordnung",
  free_text: "Freitext",
  true_false: "Wahr / Falsch",
  ordering: "Reihenfolge",
  calculation: "Berechnung",
}

function TypeBadge({ cardData }: { cardData: CardData }) {
  if (cardData.type === "flashcard") {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        Karteikarte
      </span>
    )
  }
  const subLabel = QUESTION_TYPE_LABELS[cardData.question_type] ?? cardData.question_type
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
        Klausurfrage
      </span>
      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-400">
        {subLabel}
      </span>
    </div>
  )
}

function DialogBody({ cardData }: { cardData: CardData }) {
  if (cardData.type === "flashcard") {
    return <FlashcardPreview data={cardData} />
  }

  const { question_type, question_data, answer_data } = cardData

  switch (question_type) {
    case "mc":
      return (
        <McPreview
          qd={question_data as McQuestionData}
          ad={answer_data as McAnswerData}
        />
      )
    case "fill_blank":
      return (
        <FillBlankPreview
          qd={question_data as FillBlankQuestionData}
          ad={answer_data as FillBlankAnswerData}
        />
      )
    case "matching":
      return (
        <MatchingPreview
          qd={question_data as MatchingQuestionData}
          ad={answer_data as MatchingAnswerData}
        />
      )
    case "free_text":
      return (
        <FreeTextPreview
          qd={question_data as FreeTextQuestionData}
          ad={answer_data as FreeTextAnswerData}
        />
      )
    case "true_false":
      return (
        <TrueFalsePreview
          qd={question_data as TrueFalseQuestionData}
          ad={answer_data as TrueFalseAnswerData}
        />
      )
    case "ordering":
      return (
        <OrderingPreview
          qd={question_data as OrderingQuestionData}
          ad={answer_data as OrderingAnswerData}
        />
      )
    case "calculation":
      return (
        <CalculationPreview
          qd={question_data as CalculationQuestionData}
          ad={answer_data as CalculationAnswerData}
        />
      )
    default:
      return <p className="text-sm text-muted-foreground">Unbekannter Fragetyp.</p>
  }
}

export function ContributionPreviewDialog({ contribution, onClose }: Props) {
  if (!contribution) return null

  const cardData = contribution.card_data as CardData

  return (
    <Dialog open={contribution !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="sr-only">Beitragsvorschau</DialogTitle>
            <TypeBadge cardData={cardData} />
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              aria-label="Schließen"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] flex flex-col gap-3 pt-1">
          <DialogBody cardData={cardData} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
