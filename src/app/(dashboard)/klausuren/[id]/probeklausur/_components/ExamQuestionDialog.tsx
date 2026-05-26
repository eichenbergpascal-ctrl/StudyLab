"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type QuestionType =
  | "free_text"
  | "mc"
  | "fill_blank"
  | "matching"
  | "true_false"
  | "ordering"
  | "calculation"

export type ExamQuestionFormData = {
  question_type: QuestionType
  question_data: Record<string, unknown>
  answer_data: Record<string, unknown>
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialQuestionType?: QuestionType
  initialQuestionData?: Record<string, unknown>
  initialAnswerData?: Record<string, unknown>
  isPending: boolean
  onSubmit: (data: ExamQuestionFormData) => void
}

const TYPE_LABELS: Record<QuestionType, string> = {
  free_text: "Freitext",
  mc: "Multiple Choice",
  fill_blank: "Lückentext",
  matching: "Zuordnung",
  true_false: "Wahr/Falsch",
  ordering: "Reihenfolge",
  calculation: "Rechenaufgabe",
}

const TYPES: QuestionType[] = [
  "free_text",
  "mc",
  "fill_blank",
  "matching",
  "true_false",
  "ordering",
  "calculation",
]

const TEXTAREA =
  "resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 w-full"

export function ExamQuestionDialog({
  open,
  onOpenChange,
  mode,
  initialQuestionType,
  initialQuestionData,
  initialAnswerData,
  isPending,
  onSubmit,
}: Props) {
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialQuestionType ?? "free_text",
  )

  // free_text
  const [ftQuestion, setFtQuestion] = useState("")
  const [ftAnswer, setFtAnswer] = useState("")

  // mc
  const [mcQuestion, setMcQuestion] = useState("")
  const [mcOptions, setMcOptions] = useState(["", "", "", ""])
  const [mcCorrectIndex, setMcCorrectIndex] = useState<number | null>(null)
  const [mcExplanation, setMcExplanation] = useState("")

  // fill_blank
  const [fbText, setFbText] = useState("")
  const [fbBlanks, setFbBlanks] = useState<string[]>([])
  const [fbExplanation, setFbExplanation] = useState("")

  // matching
  const [matchPairs, setMatchPairs] = useState([
    { left: "", right: "" },
    { left: "", right: "" },
    { left: "", right: "" },
  ])
  const [matchExplanation, setMatchExplanation] = useState("")

  // true_false
  const [tfStatement, setTfStatement] = useState("")
  const [tfIsTrue, setTfIsTrue] = useState<boolean | null>(null)
  const [tfExplanation, setTfExplanation] = useState("")

  // ordering
  const [ordInstruction, setOrdInstruction] = useState("")
  const [ordItems, setOrdItems] = useState(["", ""])
  const [ordExplanation, setOrdExplanation] = useState("")

  // calculation
  const [calcQuestion, setCalcQuestion] = useState("")
  const [calcFormulaHint, setCalcFormulaHint] = useState("")
  const [calcCorrectValue, setCalcCorrectValue] = useState("")
  const [calcTolerance, setCalcTolerance] = useState("")
  const [calcUnit, setCalcUnit] = useState("")
  const [calcSolutionSteps, setCalcSolutionSteps] = useState([""])
  const [calcExplanation, setCalcExplanation] = useState("")

  const blanksCount = useMemo(() => {
    const matches = [...fbText.matchAll(/\{\{(\d+)\}\}/g)]
    return new Set(matches.map((m) => parseInt(m[1]))).size
  }, [fbText])

  useEffect(() => {
    setFbBlanks((prev) => {
      if (prev.length === blanksCount) return prev
      const next = [...prev]
      while (next.length < blanksCount) next.push("")
      return next.slice(0, blanksCount)
    })
  }, [blanksCount])

  // Initialize state when dialog opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return
    const type = initialQuestionType ?? "free_text"
    setQuestionType(type)

    // Reset all fields
    setFtQuestion("")
    setFtAnswer("")
    setMcQuestion("")
    setMcOptions(["", "", "", ""])
    setMcCorrectIndex(null)
    setMcExplanation("")
    setFbText("")
    setFbBlanks([])
    setFbExplanation("")
    setMatchPairs([
      { left: "", right: "" },
      { left: "", right: "" },
      { left: "", right: "" },
    ])
    setMatchExplanation("")
    setTfStatement("")
    setTfIsTrue(null)
    setTfExplanation("")
    setOrdInstruction("")
    setOrdItems(["", ""])
    setOrdExplanation("")
    setCalcQuestion("")
    setCalcFormulaHint("")
    setCalcCorrectValue("")
    setCalcTolerance("")
    setCalcUnit("")
    setCalcSolutionSteps([""])
    setCalcExplanation("")

    const qd = initialQuestionData ?? {}
    const ad = initialAnswerData ?? {}

    if (type === "free_text") {
      setFtQuestion((qd.question as string) ?? "")
      setFtAnswer((ad.sample_answer as string) ?? "")
    } else if (type === "mc") {
      setMcQuestion((qd.question as string) ?? "")
      setMcOptions((qd.options as string[]) ?? ["", "", "", ""])
      const ci = ad.correct_index
      setMcCorrectIndex(typeof ci === "number" ? ci : null)
      setMcExplanation((ad.explanation as string) ?? "")
    } else if (type === "fill_blank") {
      setFbText((qd.text_with_blanks as string) ?? "")
      setFbBlanks((ad.blanks as string[]) ?? [])
      setFbExplanation((ad.explanation as string) ?? "")
    } else if (type === "matching") {
      const left = (qd.left as string[]) ?? ["", "", ""]
      const right = (qd.right as string[]) ?? ["", "", ""]
      setMatchPairs(left.map((l, i) => ({ left: l, right: right[i] ?? "" })))
      setMatchExplanation((ad.explanation as string) ?? "")
    } else if (type === "true_false") {
      setTfStatement((qd.statement as string) ?? "")
      const it = ad.is_true
      setTfIsTrue(typeof it === "boolean" ? it : null)
      setTfExplanation((ad.explanation as string) ?? "")
    } else if (type === "ordering") {
      setOrdInstruction((qd.instruction as string) ?? "")
      setOrdItems((qd.items as string[]) ?? ["", ""])
      setOrdExplanation((ad.explanation as string) ?? "")
    } else if (type === "calculation") {
      setCalcQuestion((qd.question as string) ?? "")
      setCalcFormulaHint((qd.formula_hint as string) ?? "")
      const cv = ad.correct_value
      setCalcCorrectValue(cv != null ? String(cv) : "")
      const tol = ad.tolerance
      setCalcTolerance(tol != null ? String(tol) : "")
      setCalcUnit((ad.unit as string) ?? "")
      setCalcSolutionSteps((ad.solution_steps as string[]) ?? [""])
      setCalcExplanation((ad.explanation as string) ?? "")
    }
  }, [open])

  const isSubmitDisabled = useMemo(() => {
    if (questionType === "free_text") return !ftQuestion.trim() || !ftAnswer.trim()
    if (questionType === "mc")
      return (
        !mcQuestion.trim() ||
        mcOptions.some((o) => !o.trim()) ||
        mcCorrectIndex === null
      )
    if (questionType === "fill_blank")
      return !fbText.trim() || blanksCount === 0 || fbBlanks.some((b) => !b.trim())
    if (questionType === "matching")
      return matchPairs.filter((p) => p.left.trim() && p.right.trim()).length < 2
    if (questionType === "true_false")
      return !tfStatement.trim() || tfIsTrue === null
    if (questionType === "ordering")
      return !ordInstruction.trim() || ordItems.filter((i) => i.trim()).length < 2
    if (questionType === "calculation")
      return (
        !calcQuestion.trim() ||
        !calcCorrectValue.trim() ||
        calcSolutionSteps.filter((s) => s.trim()).length === 0
      )
    return true
  }, [
    questionType,
    ftQuestion,
    ftAnswer,
    mcQuestion,
    mcOptions,
    mcCorrectIndex,
    fbText,
    blanksCount,
    fbBlanks,
    matchPairs,
    tfStatement,
    tfIsTrue,
    ordInstruction,
    ordItems,
    calcQuestion,
    calcCorrectValue,
    calcSolutionSteps,
  ])

  function handleSubmit() {
    if (questionType === "free_text") {
      onSubmit({
        question_type: "free_text",
        question_data: { question: ftQuestion.trim() },
        answer_data: { sample_answer: ftAnswer.trim(), key_points: [] },
      })
    } else if (questionType === "mc") {
      onSubmit({
        question_type: "mc",
        question_data: { question: mcQuestion.trim(), options: mcOptions.map((o) => o.trim()) },
        answer_data: { correct_index: mcCorrectIndex!, explanation: mcExplanation.trim() },
      })
    } else if (questionType === "fill_blank") {
      onSubmit({
        question_type: "fill_blank",
        question_data: { text_with_blanks: fbText.trim(), blanks_count: blanksCount },
        answer_data: { blanks: fbBlanks.map((b) => b.trim()), explanation: fbExplanation.trim() },
      })
    } else if (questionType === "matching") {
      onSubmit({
        question_type: "matching",
        question_data: {
          left: matchPairs.map((p) => p.left.trim()),
          right: matchPairs.map((p) => p.right.trim()),
        },
        answer_data: {
          mapping: matchPairs.map((_, i) => i),
          explanation: matchExplanation.trim(),
        },
      })
    } else if (questionType === "true_false") {
      onSubmit({
        question_type: "true_false",
        question_data: { statement: tfStatement.trim() },
        answer_data: { is_true: tfIsTrue!, explanation: tfExplanation.trim() },
      })
    } else if (questionType === "ordering") {
      const items = ordItems.filter((i) => i.trim()).map((i) => i.trim())
      onSubmit({
        question_type: "ordering",
        question_data: { instruction: ordInstruction.trim(), items },
        answer_data: {
          correct_order: items.map((_, i) => i),
          explanation: ordExplanation.trim(),
        },
      })
    } else if (questionType === "calculation") {
      const steps = calcSolutionSteps.filter((s) => s.trim()).map((s) => s.trim())
      const answerData: Record<string, unknown> = {
        correct_value: parseFloat(calcCorrectValue),
        solution_steps: steps,
        explanation: calcExplanation.trim(),
      }
      if (calcTolerance.trim()) answerData.tolerance = parseFloat(calcTolerance)
      if (calcUnit.trim()) answerData.unit = calcUnit.trim()
      const questionData: Record<string, unknown> = { question: calcQuestion.trim() }
      if (calcFormulaHint.trim()) questionData.formula_hint = calcFormulaHint.trim()
      onSubmit({ question_type: "calculation", question_data: questionData, answer_data: answerData })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Aufgabe hinzufügen" : "Aufgabe bearbeiten"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Type picker */}
          <div className="flex flex-col gap-1.5">
            <Label>Fragetyp</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={questionType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuestionType(type)}
                  disabled={mode === "edit"}
                  className="text-xs"
                >
                  {TYPE_LABELS[type]}
                </Button>
              ))}
            </div>
          </div>

          {/* Freitext */}
          {questionType === "free_text" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ft-question">Frage</Label>
                <textarea
                  id="ft-question"
                  value={ftQuestion}
                  onChange={(e) => setFtQuestion(e.target.value)}
                  placeholder="Frage eingeben…"
                  rows={3}
                  className={TEXTAREA}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ft-answer">Musterlösung</Label>
                <textarea
                  id="ft-answer"
                  value={ftAnswer}
                  onChange={(e) => setFtAnswer(e.target.value)}
                  placeholder="Musterlösung eingeben…"
                  rows={4}
                  className={TEXTAREA}
                />
              </div>
            </>
          )}

          {/* Multiple Choice */}
          {questionType === "mc" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mc-question">Frage</Label>
                <textarea
                  id="mc-question"
                  value={mcQuestion}
                  onChange={(e) => setMcQuestion(e.target.value)}
                  placeholder="Frage eingeben…"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Optionen — Kreis anklicken für richtige Antwort</Label>
                {mcOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mc-correct"
                      checked={mcCorrectIndex === i}
                      onChange={() => setMcCorrectIndex(i)}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const next = [...mcOptions]
                        next[i] = e.target.value
                        setMcOptions(next)
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mc-explanation">Erklärung (optional)</Label>
                <textarea
                  id="mc-explanation"
                  value={mcExplanation}
                  onChange={(e) => setMcExplanation(e.target.value)}
                  placeholder="Warum ist diese Antwort richtig?"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
            </>
          )}

          {/* Lückentext */}
          {questionType === "fill_blank" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fb-text">Text mit Lücken</Label>
                <textarea
                  id="fb-text"
                  value={fbText}
                  onChange={(e) => setFbText(e.target.value)}
                  placeholder={"Die Hauptstadt von Deutschland ist {{1}} und liegt im {{2}}."}
                  rows={4}
                  className={TEXTAREA}
                />
                <p className="text-xs text-muted-foreground">
                  {"Lücken mit {{1}}, {{2}} usw. markieren"}
                </p>
              </div>
              {blanksCount > 0 && (
                <div className="flex flex-col gap-2">
                  <Label>Lösungswörter</Label>
                  {fbBlanks.map((blank, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-10 shrink-0 text-xs text-muted-foreground">
                        {`{{${i + 1}}}`}
                      </span>
                      <Input
                        value={blank}
                        onChange={(e) => {
                          const next = [...fbBlanks]
                          next[i] = e.target.value
                          setFbBlanks(next)
                        }}
                        placeholder="Lösung"
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fb-explanation">Erklärung (optional)</Label>
                <textarea
                  id="fb-explanation"
                  value={fbExplanation}
                  onChange={(e) => setFbExplanation(e.target.value)}
                  placeholder="Zusätzliche Erklärung…"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
            </>
          )}

          {/* Zuordnung */}
          {questionType === "matching" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Paare</Label>
                {matchPairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={pair.left}
                      onChange={(e) => {
                        const next = [...matchPairs]
                        next[i] = { ...next[i], left: e.target.value }
                        setMatchPairs(next)
                      }}
                      placeholder="Begriff"
                      className="h-8 text-sm"
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">→</span>
                    <Input
                      value={pair.right}
                      onChange={(e) => {
                        const next = [...matchPairs]
                        next[i] = { ...next[i], right: e.target.value }
                        setMatchPairs(next)
                      }}
                      placeholder="Zuordnung"
                      className="h-8 text-sm"
                    />
                    {matchPairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setMatchPairs((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1 text-xs text-muted-foreground"
                  onClick={() =>
                    setMatchPairs((prev) => [...prev, { left: "", right: "" }])
                  }
                  disabled={matchPairs.length >= 6}
                >
                  <Plus className="size-3" strokeWidth={2} />
                  Paar hinzufügen
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="match-explanation">Erklärung (optional)</Label>
                <textarea
                  id="match-explanation"
                  value={matchExplanation}
                  onChange={(e) => setMatchExplanation(e.target.value)}
                  placeholder="Zusätzliche Erklärung…"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
            </>
          )}

          {/* Wahr/Falsch */}
          {questionType === "true_false" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tf-statement">Aussage</Label>
                <textarea
                  id="tf-statement"
                  value={tfStatement}
                  onChange={(e) => setTfStatement(e.target.value)}
                  placeholder="Aussage eingeben, die wahr oder falsch ist…"
                  rows={3}
                  className={TEXTAREA}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Richtige Antwort</Label>
                <div className="flex gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="tf-answer"
                      checked={tfIsTrue === true}
                      onChange={() => setTfIsTrue(true)}
                      className="h-4 w-4 accent-primary"
                    />
                    Wahr
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="tf-answer"
                      checked={tfIsTrue === false}
                      onChange={() => setTfIsTrue(false)}
                      className="h-4 w-4 accent-primary"
                    />
                    Falsch
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tf-explanation">Erklärung (optional)</Label>
                <textarea
                  id="tf-explanation"
                  value={tfExplanation}
                  onChange={(e) => setTfExplanation(e.target.value)}
                  placeholder="Warum ist die Aussage wahr/falsch?"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
            </>
          )}

          {/* Reihenfolge */}
          {questionType === "ordering" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ord-instruction">Instruktion</Label>
                <textarea
                  id="ord-instruction"
                  value={ordInstruction}
                  onChange={(e) => setOrdInstruction(e.target.value)}
                  placeholder="Was soll in die richtige Reihenfolge gebracht werden?"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Elemente in der richtigen Reihenfolge eingeben</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Elemente so eingeben wie sie in korrekter Reihenfolge auftreten.
                </p>
                {ordItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-xs font-medium text-muted-foreground">
                      {i + 1}.
                    </span>
                    <Input
                      value={item}
                      onChange={(e) => {
                        const next = [...ordItems]
                        next[i] = e.target.value
                        setOrdItems(next)
                      }}
                      placeholder={`Element ${i + 1}`}
                      className="h-8 text-sm"
                    />
                    {ordItems.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setOrdItems((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1 text-xs text-muted-foreground"
                  onClick={() => setOrdItems((prev) => [...prev, ""])}
                  disabled={ordItems.length >= 8}
                >
                  <Plus className="size-3" strokeWidth={2} />
                  Element hinzufügen
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ord-explanation">Erklärung (optional)</Label>
                <textarea
                  id="ord-explanation"
                  value={ordExplanation}
                  onChange={(e) => setOrdExplanation(e.target.value)}
                  placeholder="Zusätzliche Erklärung…"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
            </>
          )}

          {/* Rechenaufgabe */}
          {questionType === "calculation" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="calc-question">Frage</Label>
                <textarea
                  id="calc-question"
                  value={calcQuestion}
                  onChange={(e) => setCalcQuestion(e.target.value)}
                  placeholder="Rechenaufgabe eingeben…"
                  rows={3}
                  className={TEXTAREA}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="calc-formula">Formelhinweis (optional)</Label>
                <Input
                  id="calc-formula"
                  value={calcFormulaHint}
                  onChange={(e) => setCalcFormulaHint(e.target.value)}
                  placeholder="Relevante Formel als Hilfestellung…"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor="calc-value">Korrekter Wert</Label>
                  <Input
                    id="calc-value"
                    type="number"
                    value={calcCorrectValue}
                    onChange={(e) => setCalcCorrectValue(e.target.value)}
                    placeholder="z.B. 42.5"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex w-28 flex-col gap-1.5">
                  <Label htmlFor="calc-unit">Einheit (optional)</Label>
                  <Input
                    id="calc-unit"
                    value={calcUnit}
                    onChange={(e) => setCalcUnit(e.target.value)}
                    placeholder="z.B. €"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex w-28 flex-col gap-1.5">
                  <Label htmlFor="calc-tolerance">Toleranz (optional)</Label>
                  <Input
                    id="calc-tolerance"
                    type="number"
                    value={calcTolerance}
                    onChange={(e) => setCalcTolerance(e.target.value)}
                    placeholder="± 0.1"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Lösungsschritte</Label>
                {calcSolutionSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-xs font-medium text-muted-foreground">
                      {i + 1}.
                    </span>
                    <Input
                      value={step}
                      onChange={(e) => {
                        const next = [...calcSolutionSteps]
                        next[i] = e.target.value
                        setCalcSolutionSteps(next)
                      }}
                      placeholder={`Schritt ${i + 1}`}
                      className="h-8 text-sm"
                    />
                    {calcSolutionSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setCalcSolutionSteps((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1 text-xs text-muted-foreground"
                  onClick={() => setCalcSolutionSteps((prev) => [...prev, ""])}
                >
                  <Plus className="size-3" strokeWidth={2} />
                  Schritt hinzufügen
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="calc-explanation">Erklärung (optional)</Label>
                <textarea
                  id="calc-explanation"
                  value={calcExplanation}
                  onChange={(e) => setCalcExplanation(e.target.value)}
                  placeholder="Zusätzliche Erklärung…"
                  rows={2}
                  className={TEXTAREA}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isSubmitDisabled}
          >
            {isPending
              ? "Wird gespeichert…"
              : mode === "create"
                ? "Hinzufügen"
                : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
