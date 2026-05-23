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

type MatchingQuestion = Extract<TypedExamQuestion, { question_type: "matching" }>

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

export function MatchingQuestion({
  question,
  onRate,
  disabled = false,
}: {
  question: MatchingQuestion
  onRate: (isCorrect: boolean, response: unknown) => void
  disabled?: boolean
}) {
  const { question_data: qd, answer_data: ad } = question

  // shuffledRight: { item: string; originalIndex: number }[]
  const [shuffledRight] = useState(() =>
    shuffle(qd.right.map((item, i) => ({ item, originalIndex: i }))),
  )
  // selections[leftIndex] = originalIndex of selected right item, or -1
  const [selections, setSelections] = useState<number[]>(
    Array(qd.left.length).fill(-1),
  )
  const [revealed, setRevealed] = useState(false)

  function handleSelect(leftIndex: number, value: string) {
    const parsed = parseInt(value)
    setSelections((prev) => prev.map((v, i) => (i === leftIndex ? parsed : v)))
  }

  const allCorrect =
    revealed &&
    selections.every((sel, i) => sel === ad.mapping[i])

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-card px-6 py-5">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Zuordnung
        </p>
        <div className="flex flex-col gap-3">
          {qd.left.map((leftItem, leftIdx) => {
            const correctOrigIdx = ad.mapping[leftIdx]
            const userOrigIdx = selections[leftIdx]
            const isCorrectPair = revealed && userOrigIdx === correctOrigIdx
            const isWrongPair = revealed && userOrigIdx !== -1 && userOrigIdx !== correctOrigIdx

            return (
              <div key={leftIdx} className="flex items-center gap-3">
                <div className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  {leftItem}
                </div>
                <span className="shrink-0 text-muted-foreground">→</span>
                <div className="flex-1">
                  {revealed ? (
                    <div
                      className={`rounded-md border px-3 py-2 text-sm ${
                        isCorrectPair
                          ? "border-[#36A06E] bg-green-50 text-[#36A06E]"
                          : isWrongPair
                            ? "border-[#DC4A4A] bg-red-50 text-[#DC4A4A]"
                            : "border-border bg-background text-foreground"
                      }`}
                    >
                      <div>{qd.right[correctOrigIdx]}</div>
                      {isWrongPair && userOrigIdx !== -1 && (
                        <div className="mt-1 text-xs text-muted-foreground line-through">
                          {qd.right[userOrigIdx]}
                        </div>
                      )}
                    </div>
                  ) : (
                    <select
                      value={userOrigIdx === -1 ? "" : String(userOrigIdx)}
                      onChange={(e) => handleSelect(leftIdx, e.target.value)}
                      disabled={disabled}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                    >
                      <option value="" disabled>
                        Auswählen…
                      </option>
                      {shuffledRight.map(({ item, originalIndex }) => (
                        <option key={originalIndex} value={String(originalIndex)}>
                          {item}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )
          })}
        </div>
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
              {allCorrect
                ? "Alle Zuordnungen korrekt."
                : `${selections.filter((sel, i) => sel === ad.mapping[i]).length} von ${qd.left.length} korrekt — selbst bewerten:`}
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={disabled}
                className="border-[#DC4A4A]/30 text-[#DC4A4A] hover:border-[#DC4A4A]/50 hover:bg-[#DC4A4A]/10 hover:text-[#DC4A4A]"
                onClick={() => onRate(false, selections)}
              >
                <X className="size-4" strokeWidth={2} />
                Falsch
              </Button>
              <Button
                disabled={disabled}
                className="bg-[#36A06E] text-white hover:bg-[#2d8a5e]"
                onClick={() => onRate(true, selections)}
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
