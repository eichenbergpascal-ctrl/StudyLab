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

type McQuestion = Extract<TypedExamQuestion, { question_type: "mc" }>

const MD_PLUGINS = {
  remarkPlugins: [remarkGfm, remarkMath] as Parameters<typeof ReactMarkdown>[0]["remarkPlugins"],
  rehypePlugins: [rehypeKatex] as Parameters<typeof ReactMarkdown>[0]["rehypePlugins"],
}

export function McQuestion({
  question,
  onRate,
  disabled = false,
}: {
  question: McQuestion
  onRate: (isCorrect: boolean, response: unknown) => void
  disabled?: boolean
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const { question_data: qd, answer_data: ad } = question
  const correctIndex = ad.correct_index

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Multiple Choice
        </p>
        <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
          <ReactMarkdown {...MD_PLUGINS}>{qd.question}</ReactMarkdown>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {qd.options.map((option, i) => {
          const isCorrect = i === correctIndex
          const isSelected = i === selected

          let borderClass = "border-border hover:border-slate-300"
          if (revealed) {
            if (isCorrect) borderClass = "border-[#36A06E] bg-green-50"
            else if (isSelected && !isCorrect) borderClass = "border-[#DC4A4A] bg-red-50"
          } else if (isSelected) {
            borderClass = "border-primary bg-blue-50"
          }

          return (
            <button
              key={i}
              onClick={() => !revealed && !disabled && setSelected(i)}
              disabled={revealed || disabled}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${borderClass} disabled:cursor-default`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                  revealed && isCorrect
                    ? "border-[#36A06E] bg-[#36A06E] text-white"
                    : revealed && isSelected && !isCorrect
                      ? "border-[#DC4A4A] bg-[#DC4A4A] text-white"
                      : isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground"
                }`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-foreground">{option}</span>
            </button>
          )
        })}
      </div>

      {!revealed ? (
        <div className="flex justify-end">
          <Button
            onClick={() => setRevealed(true)}
            disabled={disabled}
          >
            Lösung anzeigen
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card px-6 py-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
              onClick={() => onRate(false, selected)}
            >
              <X className="size-4" strokeWidth={2} />
              Falsch
            </Button>
            <Button
              disabled={disabled}
              className="bg-[#36A06E] text-white hover:bg-[#2d8a5e]"
              onClick={() => onRate(true, selected)}
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
