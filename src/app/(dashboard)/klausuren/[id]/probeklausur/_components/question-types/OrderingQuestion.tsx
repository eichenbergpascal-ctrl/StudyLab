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

type OrderingQuestion = Extract<TypedExamQuestion, { question_type: "ordering" }>

const MD_PLUGINS = {
  remarkPlugins: [remarkGfm, remarkMath] as Parameters<typeof ReactMarkdown>[0]["remarkPlugins"],
  rehypePlugins: [rehypeKatex] as Parameters<typeof ReactMarkdown>[0]["rehypePlugins"],
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function OrderingQuestion({
  question,
  onRate,
  disabled = false,
}: {
  question: OrderingQuestion
  onRate: (isCorrect: boolean, response: unknown) => void
  disabled?: boolean
}) {
  const { question_data: qd, answer_data: ad } = question
  const n = qd.items.length

  // shuffledItems[i] = { item: string; originalIndex: number }
  const [shuffledItems] = useState(() =>
    shuffle(qd.items.map((item, i) => ({ item, originalIndex: i }))),
  )
  // userOrder[i] = selected 1-based position for shuffledItems[i], or -1
  const [userOrder, setUserOrder] = useState<number[]>(Array(n).fill(-1))
  const [revealed, setRevealed] = useState(false)

  // items are in correct order → correct 1-based position = originalIndex + 1
  function isCorrect(shuffledIdx: number): boolean {
    return userOrder[shuffledIdx] === shuffledItems[shuffledIdx].originalIndex + 1
  }

  const correctCount = revealed ? shuffledItems.filter((_, i) => isCorrect(i)).length : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reihenfolge
        </p>
        <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
          <ReactMarkdown {...MD_PLUGINS}>{qd.instruction}</ReactMarkdown>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {shuffledItems.map(({ item, originalIndex }, i) => {
          const correct = isCorrect(i)
          const wrong = revealed && !correct

          return (
            <div key={originalIndex} className="flex items-center gap-3">
              <div
                className={`flex-1 rounded-md border px-3 py-2 text-sm text-foreground ${
                  revealed
                    ? correct
                      ? "border-[#36A06E] bg-green-50"
                      : "border-[#DC4A4A] bg-red-50"
                    : "border-border bg-background"
                }`}
              >
                <span>{item}</span>
                {wrong && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (richtig: {originalIndex + 1}.)
                  </span>
                )}
              </div>
              {revealed ? (
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md border text-sm font-semibold ${
                    correct
                      ? "border-[#36A06E] bg-[#36A06E] text-white"
                      : "border-[#DC4A4A] bg-[#DC4A4A] text-white"
                  }`}
                >
                  {userOrder[i] === -1 ? "—" : userOrder[i]}
                </div>
              ) : (
                <select
                  value={userOrder[i] === -1 ? "" : String(userOrder[i])}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    setUserOrder((prev) => prev.map((v, j) => (j === i ? val : v)))
                  }}
                  disabled={disabled}
                  className="w-16 shrink-0 rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                >
                  <option value="" disabled>
                    —
                  </option>
                  {Array.from({ length: n }, (_, k) => k + 1).map((pos) => (
                    <option key={pos} value={String(pos)}>
                      {pos}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )
        })}
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

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {correctCount === n
                ? "Alle Positionen korrekt."
                : `${correctCount} von ${n} korrekt — selbst bewerten:`}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={disabled}
                className="border-[#DC4A4A]/30 text-[#DC4A4A] hover:border-[#DC4A4A]/50 hover:bg-[#DC4A4A]/10 hover:text-[#DC4A4A]"
                onClick={() => onRate(false, userOrder)}
              >
                <X className="size-4" strokeWidth={2} />
                Falsch
              </Button>
              <Button
                disabled={disabled}
                className="bg-[#36A06E] text-white hover:bg-[#2d8a5e]"
                onClick={() => onRate(true, userOrder)}
              >
                <Check className="size-4" strokeWidth={2} />
                Richtig
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
