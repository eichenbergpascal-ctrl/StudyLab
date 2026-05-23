"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import {
  createExamQuestion,
  updateExamQuestion,
  deleteExamQuestion,
} from "../question-actions"
import { ExamQuestionDialog, type ExamQuestionFormData } from "./ExamQuestionDialog"

type ExamQuestion = {
  id: string
  question_type: string
  question_data: Record<string, unknown>
  answer_data: Record<string, unknown>
  is_user_created: boolean
}

type Section = {
  id: string
  title: string
  questionCount: number
  questions: ExamQuestion[]
}

function getQuestionText(q: ExamQuestion): string {
  const d = q.question_data
  if (typeof d.question === "string") return d.question
  if (typeof d.text_with_blanks === "string") return d.text_with_blanks
  if (Array.isArray(d.left)) return (d.left as string[]).join(" · ")
  return "—"
}

const TYPE_LABELS: Record<string, string> = {
  free_text: "Freitext",
  mc: "MC",
  fill_blank: "Lückentext",
  matching: "Zuordnung",
}

function getAnswerPreview(q: ExamQuestion): string {
  const a = q.answer_data
  if (typeof a.sample_answer === "string") return a.sample_answer
  if (typeof a.answer === "string") return a.answer
  if (typeof a.explanation === "string") return a.explanation
  if (Array.isArray(a.blanks)) return (a.blanks as string[]).join(", ")
  return "—"
}

export function ExamSectionRow({
  section,
  examId,
}: {
  section: Section
  examId: string
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [expanded, setExpanded] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState<ExamQuestion | null>(null)
  const [deleteQuestion, setDeleteQuestion] = useState<ExamQuestion | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    const { error } = await supabase.functions.invoke("regenerate-content", {
      body: { section_id: section.id, mode: "exam_questions_only" },
    })
    setIsGenerating(false)
    if (error) {
      toast.error("Generierung fehlgeschlagen. Bitte versuche es erneut.")
      return
    }
    toast.success("Neue Aufgaben wurden generiert.")
    router.refresh()
  }

  async function handleCreate(data: ExamQuestionFormData) {
    setIsPending(true)
    const result = await createExamQuestion(
      examId,
      section.id,
      data.question_type,
      data.question_data,
      data.answer_data,
    )
    setIsPending(false)
    if (result.error) { toast.error(result.error); return }
    setCreateOpen(false)
    toast.success("Aufgabe wurde hinzugefügt.")
    router.refresh()
  }

  async function handleEdit(data: ExamQuestionFormData) {
    if (!editQuestion) return
    setIsPending(true)
    const result = await updateExamQuestion(
      examId,
      editQuestion.id,
      data.question_type,
      data.question_data,
      data.answer_data,
    )
    setIsPending(false)
    if (result.error) { toast.error(result.error); return }
    setEditQuestion(null)
    toast.success("Aufgabe wurde aktualisiert.")
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteQuestion) return
    setIsPending(true)
    const result = await deleteExamQuestion(examId, deleteQuestion.id)
    setIsPending(false)
    if (result.error) { toast.error(result.error); return }
    setDeleteQuestion(null)
    toast.success("Aufgabe wurde gelöscht.")
    router.refresh()
  }

  return (
    <>
      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setExpanded((o) => !o)}
          className="flex flex-1 items-start gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          ) : (
            <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          )}
          <div>
            <p className="text-sm text-foreground">{section.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {section.questionCount === 0 ? "Keine Fragen" : `${section.questionCount} Fragen`}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            <Sparkles className="size-3" strokeWidth={2} />
            {isGenerating ? "Generiere…" : "Generieren"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3" strokeWidth={2} />
            Aufgabe
          </Button>
        </div>
      </div>

      {/* Question list */}
      {expanded && section.questions.length > 0 && (
        <div className="ml-9 mr-4 mb-3 divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/20">
          {section.questions.map((q) => (
            <div key={q.id} className="flex items-start justify-between px-3 py-2.5">
              <div className="min-w-0 flex-1 pr-2">
                <p className="line-clamp-1 text-xs font-medium text-foreground">
                  {getQuestionText(q)}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {getAnswerPreview(q)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {q.is_user_created ? "Manuell" : "KI-generiert"} · {TYPE_LABELS[q.question_type] ?? q.question_type}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <MoreHorizontal className="size-3.5" strokeWidth={2} />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem onClick={() => setEditQuestion(q)}>
                    <Pencil className="size-3.5" strokeWidth={2} />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteQuestion(q)}>
                    <Trash2 className="size-3.5" strokeWidth={2} />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {expanded && section.questions.length === 0 && (
        <div className="ml-9 mr-4 mb-3 rounded-lg border border-dashed border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Noch keine Aufgaben in diesem Abschnitt.</p>
        </div>
      )}

      {/* Create dialog */}
      <ExamQuestionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        isPending={isPending}
        onSubmit={handleCreate}
      />

      {/* Edit dialog */}
      <ExamQuestionDialog
        open={editQuestion !== null}
        onOpenChange={(open) => { if (!open) setEditQuestion(null) }}
        mode="edit"
        initialQuestionType={editQuestion?.question_type as "free_text" | "mc" | "fill_blank" | "matching" | undefined}
        initialQuestionData={editQuestion?.question_data}
        initialAnswerData={editQuestion?.answer_data}
        isPending={isPending}
        onSubmit={handleEdit}
      />

      {/* Delete confirmation */}
      <Dialog
        open={deleteQuestion !== null}
        onOpenChange={(open) => { if (!open) setDeleteQuestion(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe löschen?</DialogTitle>
            <DialogDescription>
              Die Aufgabe wird unwiderruflich gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteQuestion(null)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Wird gelöscht…" : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
