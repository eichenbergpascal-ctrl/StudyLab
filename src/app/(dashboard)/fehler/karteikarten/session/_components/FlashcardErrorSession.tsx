"use client"

import { useState, useCallback, useMemo } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { ArrowLeft, AlertCircle, Check, X } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Flashcard = {
  id: string
  question: string
  answer: string
}

type Phase = "question" | "review" | "end"

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

export function FlashcardErrorSession({
  flashcards: initial,
  userId,
}: {
  flashcards: Flashcard[]
  userId: string
}) {
  const [cards] = useState(() => shuffle(initial))
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>(initial.length === 0 ? "end" : "question")
  const [userAnswer, setUserAnswer] = useState("")
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const [isRating, setIsRating] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const currentCard = cards[index]
  const total = cards.length

  const rate = useCallback(
    async (isCorrect: boolean) => {
      if (isRating) return
      setIsRating(true)

      await supabase.from("attempts").insert({
        user_id: userId,
        flashcard_id: currentCard.id,
        is_correct: isCorrect,
        session_type: "error_session" as const,
      })

      if (isCorrect) setCorrect((c) => c + 1)
      else setIncorrect((c) => c + 1)

      if (index + 1 >= total) {
        setPhase("end")
      } else {
        setIndex((i) => i + 1)
        setPhase("question")
        setUserAnswer("")
      }

      setIsRating(false)
    },
    [currentCard, index, total, userId, supabase, isRating],
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
            {total === 0 ? "Keine Fehler-Karten" : "Session abgeschlossen"}
          </h2>
          {total === 0 ? (
            <p className="mb-8 text-sm text-muted-foreground">
              Keine fehlerhaften Karteikarten im Pool.
            </p>
          ) : (
            <div className="mb-8">
              <p className="mb-6 text-sm text-muted-foreground">{total} Karten abgeschlossen</p>
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
                  {remaining} {remaining === 1 ? "Karte verbleibt" : "Karten verbleiben"} im Fehler-Pool.
                </p>
              )}
              {remaining === 0 && (
                <p className="text-sm text-[#36A06E]">
                  Alle Karten richtig — Fehler-Pool geleert!
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
            Karte {index + 1} von {total}
          </span>
        </div>

        <div className="mb-8 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="mb-4 rounded-xl border border-border bg-card px-6 py-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Frage
          </p>
          <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
            <ReactMarkdown {...MD_PLUGINS}>{currentCard.question}</ReactMarkdown>
          </div>
        </div>

        {phase === "question" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Deine Antwort
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Schreib deine Antwort hier…"
                rows={4}
                className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setPhase("review")}>Lösung anzeigen</Button>
            </div>
          </div>
        )}

        {phase === "review" && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card px-6 py-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Deine Antwort
              </p>
              {userAnswer.trim() ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">{userAnswer}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Antwort eingegeben</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card px-6 py-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Musterlösung
              </p>
              <div className="prose prose-sm max-w-none text-foreground [&_table]:text-sm">
                <ReactMarkdown {...MD_PLUGINS}>{currentCard.answer}</ReactMarkdown>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                disabled={isRating}
                className="border-[#DC4A4A]/30 text-[#DC4A4A] hover:border-[#DC4A4A]/50 hover:bg-[#DC4A4A]/10 hover:text-[#DC4A4A]"
                onClick={() => rate(false)}
              >
                <X className="size-4" strokeWidth={2} />
                Falsch
              </Button>
              <Button
                disabled={isRating}
                className="bg-[#36A06E] text-white hover:bg-[#2d8a5e]"
                onClick={() => rate(true)}
              >
                <Check className="size-4" strokeWidth={2} />
                Richtig
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
