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

type TrueFalseQuestion = Extract<TypedExamQuestion, { question_type: "true_false" }>

const MD_PLUGINS = {
  remarkPlugins: [remarkGfm, remarkMath] as Parameters<typeof ReactMarkdown>[0]["remarkPlugins"],
  rehypePlugins: [rehypeKatex] as Parameters<typeof ReactMarkdown>[0]["rehypePlugins"],
}

export function TrueFalseQuestion({
  question,
  onRate,
  disabled = false,
}: {
  question: TrueFalseQuestion
  onRate: (isCorrect: boolean, response: unknown) => void
  disabled?: boolean
}) {
  const [selected, setSelected] = useState<boolean | null>(null)
  const [revealed, setRevealed] = useState(false)

  const { question_data: qd, answer_data: ad } = question

  function handleSelect(value: boolean) {
    if (revealed || disabled) return
    setSelected(value)
    setRevealed(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Wahr oder Falsch
        </p>
        <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
          <ReactMarkdown {...MD_PLUGINS}>{qd.statement}</ReactMarkdown>
        </div>
      </div>

      {!revealed ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSelect(true)}
            disabled={disabled}
          >
            Wahr
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSelect(false)}
            disabled={disabled}
          >
            Falsch
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-xl border px-6 py-5 ${
              selected === ad.is_true
                ? "border-[#36A06E] bg-green-50"
                : "border-[#DC4A4A] bg-red-50"
            }`}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Richtige Antwort
            </p>
            <p className="text-sm text-foreground">
              Die Aussage ist{" "}
              <span className={`font-semibold ${ad.is_true ? "text-[#36A06E]" : "text-[#DC4A4A]"}`}>
                {ad.is_true ? "wahr" : "falsch"}
              </span>
              {selected === ad.is_true
                ? " — richtig eingeschätzt."
                : " — falsch eingeschätzt."}
            </p>
          </div>

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
