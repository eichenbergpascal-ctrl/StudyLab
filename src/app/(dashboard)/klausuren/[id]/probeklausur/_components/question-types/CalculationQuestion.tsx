"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TypedExamQuestion } from "@/lib/types/exam-questions"

type CalculationQuestion = Extract<TypedExamQuestion, { question_type: "calculation" }>

const MD_PLUGINS = {
  remarkPlugins: [remarkGfm, remarkMath] as Parameters<typeof ReactMarkdown>[0]["remarkPlugins"],
  rehypePlugins: [rehypeKatex] as Parameters<typeof ReactMarkdown>[0]["rehypePlugins"],
}

export function CalculationQuestion({
  question,
  onRate,
  disabled = false,
}: {
  question: CalculationQuestion
  onRate: (isCorrect: boolean, response: unknown) => void
  disabled?: boolean
}) {
  const [answer, setAnswer] = useState("")
  const [revealed, setRevealed] = useState(false)

  const { question_data: qd, answer_data: ad } = question

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Rechenaufgabe
        </p>
        <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
          <ReactMarkdown {...MD_PLUGINS}>{qd.question}</ReactMarkdown>
        </div>
        {qd.formula_hint && (
          <p className="mt-3 text-sm italic text-muted-foreground">
            Hinweis: {qd.formula_hint}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          value={answer}
          onChange={(e) => !revealed && setAnswer(e.target.value)}
          disabled={revealed || disabled}
          placeholder="Antwort eingeben…"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:cursor-default disabled:opacity-60"
        />
        {ad.unit && (
          <span className="shrink-0 text-sm font-medium text-muted-foreground">{ad.unit}</span>
        )}
      </div>

      {!revealed ? (
        <div className="flex justify-end">
          <Button onClick={() => setRevealed(true)} disabled={disabled}>
            Lösung anzeigen
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card px-6 py-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lösung
            </p>
            <p className="mb-4 text-sm text-foreground">
              Korrekter Wert:{" "}
              <span className="font-semibold text-[#36A06E]">
                {ad.correct_value}
                {ad.unit ? ` ${ad.unit}` : ""}
              </span>
              {ad.tolerance != null && ad.tolerance > 0 && (
                <span className="ml-1 text-muted-foreground text-xs">
                  (± {ad.tolerance}{ad.unit ? ` ${ad.unit}` : ""})
                </span>
              )}
            </p>

            {ad.solution_steps.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Lösungsweg
                </p>
                <ol className="flex flex-col gap-1.5 text-sm text-foreground">
                  {ad.solution_steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 font-medium text-muted-foreground">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Erklärung
            </p>
            <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
              <ReactMarkdown {...MD_PLUGINS}>{ad.explanation}</ReactMarkdown>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              disabled={disabled}
              className="border-[#DC4A4A]/30 text-[#DC4A4A] hover:border-[#DC4A4A]/50 hover:bg-[#DC4A4A]/10 hover:text-[#DC4A4A]"
              onClick={() => onRate(false, answer)}
            >
              <X className="size-4" strokeWidth={2} />
              Falsch
            </Button>
            <Button
              disabled={disabled}
              className="bg-[#36A06E] text-white hover:bg-[#2d8a5e]"
              onClick={() => onRate(true, answer)}
            >
              <Check className="size-4" strokeWidth={2} />
              Richtig
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
