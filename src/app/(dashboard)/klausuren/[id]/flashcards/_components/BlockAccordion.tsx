"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  FileText,
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
import { createFlashcard, updateFlashcard, deleteFlashcard } from "../actions"
import { FlashcardDialog } from "./FlashcardDialog"

type Flashcard = {
  id: string
  question: string
  answer: string
  is_user_created: boolean
}

type Section = {
  id: string
  title: string
  sort_order: number
  flashcardCount: number
  aiFlashcardCount: number
  lastStudied: string | null
  flashcards: Flashcard[]
}

type SummaryGroup = {
  id: string
  filename: string
  sections: Section[]
}

type Block = {
  id: string
  name: string
  weight_percent: number
  summaries: SummaryGroup[]
  totalCount: number
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

function SectionRow({ section, examId }: { section: Section; examId: string }) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [cardsExpanded, setCardsExpanded] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editCard, setEditCard] = useState<Flashcard | null>(null)
  const [deleteCard, setDeleteCard] = useState<Flashcard | null>(null)

  const aiCount = section.aiFlashcardCount

  async function handleGenerate() {
    setIsGenerating(true)
    const { error } = await supabase.functions.invoke("regenerate-content", {
      body: { section_id: section.id, mode: "flashcards_only" },
    })
    setIsGenerating(false)
    if (error) {
      toast.error("Generierung fehlgeschlagen. Bitte versuche es erneut.")
      return
    }
    toast.success("Neue Karteikarten wurden generiert.")
    router.refresh()
  }

  async function handleCreate(question: string, answer: string) {
    setIsPending(true)
    const result = await createFlashcard(examId, section.id, question, answer)
    setIsPending(false)
    if (result.error) { toast.error(result.error); return }
    setCreateOpen(false)
    toast.success("Karte wurde hinzugefügt.")
  }

  async function handleEdit(question: string, answer: string) {
    if (!editCard) return
    setIsPending(true)
    const result = await updateFlashcard(examId, editCard.id, question, answer)
    setIsPending(false)
    if (result.error) { toast.error(result.error); return }
    setEditCard(null)
    toast.success("Karte wurde aktualisiert.")
  }

  async function handleDelete() {
    if (!deleteCard) return
    setIsPending(true)
    const result = await deleteFlashcard(examId, deleteCard.id)
    setIsPending(false)
    if (result.error) { toast.error(result.error); return }
    setDeleteCard(null)
    toast.success("Karte wurde gelöscht.")
  }

  return (
    <>
      {/* Pool limit banners — shown when AI card count reaches thresholds */}
      {aiCount >= 30 && (
        <div className="mx-4 mt-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
          <strong>{aiCount} KI-Karten</strong> für diesen Abschnitt. Erwäge alte Karten zu löschen, bevor du weitere generierst.
        </div>
      )}
      {aiCount >= 20 && aiCount < 30 && (
        <div className="mx-4 mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Du hast bereits <strong>{aiCount}</strong> KI-generierte Karten für diesen Abschnitt. Möchtest du trotzdem weitere generieren?
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => setCardsExpanded((o) => !o)}
          className="flex flex-1 items-start gap-2 text-left"
        >
          {cardsExpanded ? (
            <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          ) : (
            <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          )}
          <div>
            <p className="text-sm text-foreground">{section.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {section.flashcardCount === 0
                ? "Keine Karteikarten"
                : `${section.flashcardCount} Karten`}
              {section.lastStudied && (
                <> · zuletzt gelernt {formatDate(section.lastStudied)}</>
              )}
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
            Karte
          </Button>
          {section.flashcardCount > 0 && (
            <Link href={`/klausuren/${examId}/flashcards/session?section=${section.id}`}>
              <Button size="sm" variant="outline" className="h-7 text-xs">
                Lernen
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Card list */}
      {cardsExpanded && section.flashcards.length > 0 && (
        <div className="ml-9 mr-4 mb-3 divide-y divide-border/60 rounded-lg border border-border/60 bg-muted/20">
          {section.flashcards.map((card) => (
            <div key={card.id} className="flex items-start justify-between px-3 py-2.5">
              <div className="min-w-0 flex-1 pr-2">
                <p className="line-clamp-1 text-xs font-medium text-foreground">{card.question}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{card.answer}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                  {card.is_user_created ? "Manuell" : "KI-generiert"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <MoreHorizontal className="size-3.5" strokeWidth={2} />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem onClick={() => setEditCard(card)}>
                    <Pencil className="size-3.5" strokeWidth={2} />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteCard(card)}>
                    <Trash2 className="size-3.5" strokeWidth={2} />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {cardsExpanded && section.flashcards.length === 0 && (
        <div className="ml-9 mr-4 mb-3 rounded-lg border border-dashed border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">Noch keine Karten in diesem Abschnitt.</p>
        </div>
      )}

      {/* Create dialog */}
      <FlashcardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        isPending={isPending}
        onSubmit={handleCreate}
      />

      {/* Edit dialog */}
      <FlashcardDialog
        open={editCard !== null}
        onOpenChange={(open) => { if (!open) setEditCard(null) }}
        mode="edit"
        initialQuestion={editCard?.question}
        initialAnswer={editCard?.answer}
        isPending={isPending}
        onSubmit={handleEdit}
      />

      {/* Delete confirmation */}
      <Dialog
        open={deleteCard !== null}
        onOpenChange={(open) => { if (!open) setDeleteCard(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Karte löschen?</DialogTitle>
            <DialogDescription>
              Die Karte und alle zugehörigen Lernfortschritte werden unwiderruflich gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCard(null)}
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

export function BlockAccordion({
  block,
  examId,
}: {
  block: Block
  examId: string
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">{block.name}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {block.totalCount} Karten
          </span>
        </div>
        <div className="flex items-center gap-2">
          {block.totalCount > 0 && (
            <Link
              href={`/klausuren/${examId}/flashcards/session?block=${block.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Button size="sm" variant="outline">
                Lernen
              </Button>
            </Link>
          )}
          {open ? (
            <ChevronDown className="size-4 text-muted-foreground" strokeWidth={2} />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground" strokeWidth={2} />
          )}
        </div>
      </button>

      {open && block.summaries.some((sg) => sg.sections.length > 0) && (
        <div className="border-t border-border">
          {block.summaries.map((summary) => (
            <React.Fragment key={summary.id}>
              <div className="flex items-center gap-1.5 border-b border-border/60 px-4 py-2">
                <FileText className="size-3 shrink-0 text-muted-foreground" strokeWidth={2} />
                <span className="text-xs font-medium text-muted-foreground">{summary.filename}</span>
              </div>
              {summary.sections.map((section, i) => (
                <div
                  key={section.id}
                  className={i < summary.sections.length - 1 ? "border-b border-border/60" : ""}
                >
                  <SectionRow section={section} examId={examId} />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
