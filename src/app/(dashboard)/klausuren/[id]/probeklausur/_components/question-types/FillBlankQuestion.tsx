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

type FillBlankQuestion = Extract<TypedExamQuestion, { question_type: "fill_blank" }>

const MD_PLUGINS = {
  remarkPlugins: [remarkGfm, remarkMath] as Parameters<typeof ReactMarkdown>[0]["remarkPlugins"],
  rehypePlugins: [rehypeKatex] as Parameters<typeof ReactMarkdown>[0]["rehypePlugins"],
}

type Part =
  | { type: "text"; content: string }
  | { type: "blank"; index: number }

function parseTemplate(template: string): Part[] {
  const parts = template.split(/\{\{(\d+)\}\}/)
  return parts.map((part, i) => {
    if (i % 2 === 0) return { type: "text" as const, content: part }
    return { type: "blank" as const, index: parseInt(part) - 1 }
  })
}

export function FillBlankQuestion({
  question,
  onRate,
  disabled = false,
}: {
  question: FillBlankQuestion
  onRate: (isCorrect: boolean, response: unknown) => void
  disabled?: boolean
}) {
  const { question_data: qd, answer_data: ad } = question
  const parts = parseTemplate(qd.text_with_blanks)
  const [inputs, setInputs] = useState<string[]>(Array(qd.blanks_count).fill(""))
  const [revealed, setRevealed] = useState(false)

  function setInput(i: number, value: string) {
    setInputs((prev) => prev.map((v, idx) => (idx === i ? value : v)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Lückentext
        </p>
        <p className="flex flex-wrap items-baseline gap-y-2 text-sm text-foreground leading-relaxed">
          {parts.map((part, i) => {
            if (part.type === "text") {
              return <span key={i}>{part.content}</span>
            }
            const correct = ad.blanks[part.index]
            const userVal = inputs[part.index] ?? ""
            return (
              <span key={i} className="mx-1 inline-flex flex-col items-center gap-0.5">
                <input
                  type="text"
                  value={userVal}
                  onChange={(e) => !revealed && !disabled && setInput(part.index, e.target.value)}
                  disabled={revealed || disabled}
                  placeholder={`(${part.index + 1})`}
                  className={`h-8 w-36 rounded border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${
                    revealed
                      ? "border-[#36A06E] bg-green-50 text-[#36A06E]"
                      : "border-input bg-background text-foreground"
                  }`}
                />
                {revealed && (
                  <span className="text-xs font-medium text-[#36A06E]">{correct}</span>
                )}
              </span>
            )
          })}
        </p>
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
              onClick={() => onRate(false, inputs)}
            >
              <X className="size-4" strokeWidth={2} />
              Falsch
            </Button>
            <Button
              disabled={disabled}
              className="bg-[#36A06E] text-white hover:bg-[#2d8a5e]"
              onClick={() => onRate(true, inputs)}
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
