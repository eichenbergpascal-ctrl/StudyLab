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

type FreeTextQuestion = Extract<TypedExamQuestion, { question_type: "free_text" }>

const MD_PLUGINS = {
  remarkPlugins: [remarkGfm, remarkMath] as Parameters<typeof ReactMarkdown>[0]["remarkPlugins"],
  rehypePlugins: [rehypeKatex] as Parameters<typeof ReactMarkdown>[0]["rehypePlugins"],
}

export function FreeTextQuestion({
  question,
  onRate,
  disabled = false,
}: {
  question: FreeTextQuestion
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
          Freitext
        </p>
        <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
          <ReactMarkdown {...MD_PLUGINS}>{qd.question}</ReactMarkdown>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Deine Antwort
        </label>
        <textarea
          value={answer}
          onChange={(e) => !revealed && !disabled && setAnswer(e.target.value)}
          disabled={revealed || disabled}
          placeholder="Schreib deine Antwort hier…"
          rows={5}
          className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-70"
        />
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
              Musterlösung
            </p>
            <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
              <ReactMarkdown {...MD_PLUGINS}>{ad.sample_answer}</ReactMarkdown>
            </div>
            {ad.key_points.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Kernpunkte
                </p>
                <ul className="space-y-1">
                  {ad.key_points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
