"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialQuestion?: string
  initialAnswer?: string
  isPending: boolean
  onSubmit: (question: string, answer: string) => void
}

export function FlashcardDialog({
  open,
  onOpenChange,
  mode,
  initialQuestion = "",
  initialAnswer = "",
  isPending,
  onSubmit,
}: Props) {
  const [question, setQuestion] = useState(initialQuestion)
  const [answer, setAnswer] = useState(initialAnswer)

  useEffect(() => {
    if (open) {
      setQuestion(initialQuestion)
      setAnswer(initialAnswer)
    }
  }, [open, initialQuestion, initialAnswer])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Karte hinzufügen" : "Karte bearbeiten"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fc-question">Frage</Label>
            <textarea
              id="fc-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Frage eingeben…"
              rows={3}
              className="resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fc-answer">Antwort</Label>
            <textarea
              id="fc-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Musterlösung eingeben…"
              rows={4}
              className="resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
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
            onClick={() => onSubmit(question, answer)}
            disabled={isPending || !question.trim() || !answer.trim()}
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
