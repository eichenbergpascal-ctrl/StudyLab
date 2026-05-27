"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { adoptSelective } from "../../../actions"
import type { ContributionForGroup } from "../../../actions"
import { ContributionPreviewDialog } from "../../_components/ContributionPreviewDialog"

interface AdoptSelectiveFormProps {
  groupId: string
  contributions: ContributionForGroup[]
  exams: { id: string; name: string }[]
  blocks: { id: string; name: string; exam_id: string }[]
}

export function AdoptSelectiveForm({
  groupId,
  contributions,
  exams,
  blocks,
}: AdoptSelectiveFormProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [targetExamId, setTargetExamId] = React.useState("")
  const [targetBlockId, setTargetBlockId] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [result, setResult] = React.useState<{ cards_adopted: number } | null>(null)
  const [preview, setPreview] = React.useState<ContributionForGroup | null>(null)

  const availableBlocks = blocks.filter((b) => b.exam_id === targetExamId)

  function toggleContrib(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (selected.size === contributions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(contributions.map((c) => c.id)))
    }
  }

  // Group contributions by block for display
  const byBlock = new Map<string, ContributionForGroup[]>()
  for (const c of contributions) {
    const blockKey = c.block_name || "Ohne Block"
    const arr = byBlock.get(blockKey) ?? []
    arr.push(c)
    byBlock.set(blockKey, arr)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected.size || !targetExamId || !targetBlockId) return

    const items = Array.from(selected).map((id) => ({ contribution_id: id }))
    setIsLoading(true)
    const res = await adoptSelective(items, targetExamId, targetBlockId)
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    setResult({ cards_adopted: res.cards_adopted ?? 0 })
  }

  if (result) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="size-5 text-green-600" strokeWidth={1.5} />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">Übernommen</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {result.cards_adopted} {result.cards_adopted === 1 ? "Karte" : "Karten"} hinzugefügt.
        </p>
        <div className="flex justify-center gap-2">
          <Link href="/klausuren" className={cn(buttonVariants({ size: "sm" }))}>
            Zu den Klausuren
          </Link>
          <Link href={`/gruppen/${groupId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Zur Gruppe
          </Link>
        </div>
      </div>
    )
  }

  const allSelected = selected.size === contributions.length
  const someSelected = selected.size > 0 && !allSelected

  return (
    <>
      <ContributionPreviewDialog contribution={preview} onClose={() => setPreview(null)} />
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Card selection */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected
            }}
            onChange={toggleAll}
            className="size-4 cursor-pointer accent-blue-600"
          />
          <span className="text-sm font-medium text-foreground">Alle auswählen</span>
          {selected.size > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {selected.size} ausgewählt
            </span>
          )}
        </div>

        {Array.from(byBlock.entries()).map(([blockName, contribs]) => (
          <div key={blockName} className="border-b border-border last:border-b-0">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {blockName}
            </div>
            {contribs.map((c) => (
              <div
                key={c.id}
                className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-slate-50"
                onClick={() => setPreview(c)}
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleContrib(c.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="size-4 cursor-pointer accent-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-foreground">{c.preview_question}</p>
                  <p className="text-xs text-muted-foreground">{c.section_title}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Target selection */}
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Ziel</p>

        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Du hast noch keine Klausuren. Erstelle zuerst eine Klausur.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <Label htmlFor="target-exam" className="mb-1.5 block text-xs text-muted-foreground">
                Klausur
              </Label>
              <select
                id="target-exam"
                value={targetExamId}
                onChange={(e) => {
                  setTargetExamId(e.target.value)
                  setTargetBlockId("")
                }}
                className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Klausur auswählen</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>

            {targetExamId && (
              <div>
                <Label htmlFor="target-block" className="mb-1.5 block text-xs text-muted-foreground">
                  Block
                </Label>
                {availableBlocks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Diese Klausur hat noch keine Blöcke.
                  </p>
                ) : (
                  <select
                    id="target-block"
                    value={targetBlockId}
                    onChange={(e) => setTargetBlockId(e.target.value)}
                    className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Block auswählen</option>
                    {availableBlocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={
          isLoading ||
          selected.size === 0 ||
          !targetExamId ||
          !targetBlockId
        }
      >
        {isLoading
          ? "Wird übernommen…"
          : `${selected.size > 0 ? selected.size : ""} ${selected.size === 1 ? "Karte" : "Karten"} übernehmen`}
      </Button>
    </form>
    </>
  )
}
