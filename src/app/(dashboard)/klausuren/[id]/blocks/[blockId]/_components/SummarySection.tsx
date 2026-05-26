"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Tables } from "@/lib/database.types"
import { completePdfReplace, createSummaryRecord, deleteSummary, replaceSummaryPdf, retrySummaryProcessing } from "../actions"

type Summary = Tables<"summaries">

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

function StatusBadge({
  summary,
  onRetry,
}: {
  summary: Summary
  onRetry: (id: string) => void
}) {
  const { processing_status, sections_processed, sections_total, processing_error } = summary

  if (processing_status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-600">
        <CheckCircle2 className="size-3" strokeWidth={2} />
        Verarbeitet
      </span>
    )
  }

  if (processing_status === "failed") {
    return (
      <div className="flex flex-col items-end gap-1">
        <span
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-600"
          title={processing_error ?? undefined}
        >
          <AlertCircle className="size-3" strokeWidth={2} />
          Fehlgeschlagen
        </span>
        <button
          onClick={() => onRetry(summary.id)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="size-3" strokeWidth={2} />
          Erneut verarbeiten
        </button>
      </div>
    )
  }

  if (processing_status === "generating") {
    const progress =
      sections_total != null
        ? `(${sections_processed}/${sections_total} Abschnitte)`
        : ""
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
        <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        Generiere Aufgaben {progress}
      </span>
    )
  }

  if (processing_status === "parsing") {
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
        <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        Wird analysiert…
      </span>
    )
  }

  // pending — no badge
  return null
}

function triggerProcessing(summaryId: string, accessToken: string): void {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  fetch(`${supabaseUrl}/functions/v1/process-summary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ summaryId }),
  }).catch(() => {})
}

export function SummarySection({
  summaries: initialSummaries,
  blockId,
  examId,
}: {
  summaries: Summary[]
  blockId: string
  examId: string
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const replaceInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmReplaceId, setConfirmReplaceId] = useState<string | null>(null)
  const [pendingReplaceFile, setPendingReplaceFile] = useState<File | null>(null)
  const [summaries, setSummaries] = useState<Summary[]>(initialSummaries)

  // Merge server props into local state: preserve Realtime-updated fields for
  // existing summaries, add newly uploaded ones, remove deleted ones.
  useEffect(() => {
    setSummaries((prev) => {
      const prevMap = new Map(prev.map((s) => [s.id, s]))
      return initialSummaries.map((s) => prevMap.get(s.id) ?? s)
    })
  }, [initialSummaries])

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const ids = summaries.map((s) => s.id)
    if (ids.length === 0) return

    const channel = supabase
      .channel(`summaries-${blockId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "summaries",
          filter: `id=in.(${ids.join(",")})`,
        },
        (payload) => {
          const updated = payload.new as Summary
          setSummaries((prev) =>
            prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // Re-subscribe when the set of summary IDs changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaries.map((s) => s.id).join(","), blockId])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    if (file.type !== "application/pdf") {
      toast.error("Nur PDF-Dateien sind erlaubt.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Die Datei ist zu groß. Maximal 20 MB erlaubt.")
      return
    }

    setIsUploading(true)
    try {
      const result = await createSummaryRecord(blockId, examId, file.name)
      if (result.error || !result.summaryId || !result.storagePath) {
        toast.error(result.error ?? "Fehler beim Erstellen des Eintrags.")
        return
      }

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from("summaries")
        .upload(result.storagePath, file, { contentType: "application/pdf" })

      if (uploadError) {
        await deleteSummary(result.summaryId, examId, blockId)
        toast.error("Upload fehlgeschlagen. Bitte erneut versuchen.")
        return
      }

      toast.success("PDF wird verarbeitet…")
      router.refresh()

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        triggerProcessing(result.summaryId, session.access_token)
      }
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRetry(summaryId: string) {
    setRetryingId(summaryId)
    try {
      const result = await retrySummaryProcessing(summaryId, examId, blockId)
      if (result.error) {
        toast.error(result.error)
        return
      }

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        triggerProcessing(summaryId, session.access_token)
      }

      setSummaries((prev) =>
        prev.map((s) =>
          s.id === summaryId
            ? {
                ...s,
                processing_status: "pending",
                processing_error: null,
                sections_processed: 0,
                sections_total: null,
              }
            : s
        )
      )
    } finally {
      setRetryingId(null)
    }
  }

  function handleReplaceClick(summaryId: string) {
    setConfirmReplaceId(summaryId)
    setPendingReplaceFile(null)
  }

  function handleReplaceFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (file.type !== "application/pdf") {
      toast.error("Nur PDF-Dateien sind erlaubt.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Die Datei ist zu groß. Maximal 20 MB erlaubt.")
      return
    }
    setPendingReplaceFile(file)
  }

  async function handleConfirmReplace() {
    if (!confirmReplaceId || !pendingReplaceFile) return
    const summaryId = confirmReplaceId
    const file = pendingReplaceFile
    setConfirmReplaceId(null)
    setPendingReplaceFile(null)
    setReplacingId(summaryId)

    try {
      const result = await replaceSummaryPdf(summaryId, examId, blockId)
      if (result.error || !result.storagePath) {
        toast.error(result.error ?? "Fehler beim Ersetzen.")
        return
      }

      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from("summaries")
        .upload(result.storagePath, file, {
          contentType: "application/pdf",
          upsert: true,
        })

      if (uploadError) {
        toast.error("Upload fehlgeschlagen. Bitte erneut versuchen.")
        return
      }

      const finalizeResult = await completePdfReplace(summaryId, examId, blockId)
      if (finalizeResult.error) {
        toast.error(finalizeResult.error)
        return
      }

      toast.success("PDF wurde ersetzt.")
    } finally {
      setReplacingId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return
    const idToDelete = confirmDeleteId
    setConfirmDeleteId(null)
    setDeletingId(idToDelete)

    const result = await deleteSummary(idToDelete, examId, blockId)
    setDeletingId(null)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Zusammenfassung wurde gelöscht.")
    router.refresh()
  }

  const summaryToDelete = summaries.find((s) => s.id === confirmDeleteId)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Zusammenfassungen
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          ) : (
            <Upload className="size-4" strokeWidth={2} />
          )}
          {isUploading ? "Wird hochgeladen…" : "PDF hochladen"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={handleReplaceFileSelect}
        />
      </div>

      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-8 py-10 text-center">
          <FileText className="mb-3 size-8 text-slate-300" strokeWidth={1.5} />
          <p className="max-w-sm text-sm text-muted-foreground">
            Noch keine Zusammenfassungen hochgeladen. Lade ein PDF hoch, um
            loszulegen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
          {summaries.map((summary, i) => (
            <div
              key={summary.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                i > 0 && "border-t border-border"
              )}
            >
              <FileText
                className="size-4 shrink-0 text-slate-400"
                strokeWidth={2}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/klausuren/${examId}/blocks/${blockId}/viewer/${summary.id}`}
                  className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  {summary.filename}
                </Link>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(summary.created_at)}
                </div>
              </div>
              <StatusBadge
                summary={summary}
                onRetry={handleRetry}
              />
              {summary.processing_status === "completed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleReplaceClick(summary.id)}
                  disabled={replacingId === summary.id}
                  aria-label="Bearbeitete Version hochladen"
                  title="Bearbeitete Version hochladen"
                >
                  {replacingId === summary.id ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Upload className="size-4" strokeWidth={2} />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmDeleteId(summary.id)}
                disabled={deletingId === summary.id || retryingId === summary.id || replacingId === summary.id}
                aria-label="Zusammenfassung löschen"
              >
                {deletingId === summary.id ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Trash2 className="size-4" strokeWidth={2} />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!confirmReplaceId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmReplaceId(null)
            setPendingReplaceFile(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PDF ersetzen</DialogTitle>
            <DialogDescription>
              Dies ersetzt nur die PDF-Datei. Deine Karteikarten und Aufgaben bleiben erhalten.
              Stelle sicher, dass es sich um die bearbeitete Version der gleichen Zusammenfassung handelt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {pendingReplaceFile ? (
              <p className="text-sm text-foreground">
                Ausgewählt:{" "}
                <span className="font-medium">{pendingReplaceFile.name}</span>
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => replaceInputRef.current?.click()}
              >
                <Upload className="size-4" strokeWidth={2} />
                PDF auswählen
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmReplaceId(null)
                setPendingReplaceFile(null)
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleConfirmReplace}
              disabled={!pendingReplaceFile}
            >
              Ersetzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zusammenfassung löschen?</DialogTitle>
            <DialogDescription>
              {summaryToDelete
                ? `"${summaryToDelete.filename}" wird unwiderruflich gelöscht. Alle zugehörigen Karteikarten und Aufgaben werden ebenfalls entfernt.`
                : "Die Zusammenfassung wird unwiderruflich gelöscht."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
