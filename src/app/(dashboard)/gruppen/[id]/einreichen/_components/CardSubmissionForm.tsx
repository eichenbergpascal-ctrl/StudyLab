"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { submitContributions } from "../../../actions"
import type { BlockForSubmission, SubmitItem } from "../../../actions"

function typeLabel(source_type: string): string {
  return source_type === "flashcard" ? "Karteikarte" : "Klausurfrage"
}

interface CardSubmissionFormProps {
  groupId: string
  blocks: BlockForSubmission[]
}

export function CardSubmissionForm({ groupId, blocks }: CardSubmissionFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [expandedBlocks, setExpandedBlocks] = React.useState<Set<string>>(
    () => new Set(blocks.map((b) => b.id))
  )

  // selected: Set of "source_type:source_id"
  const [selected, setSelected] = React.useState<Set<string>>(() => {
    const pre = new Set<string>()
    for (const block of blocks) {
      for (const section of block.sections) {
        for (const card of section.cards) {
          if (card.already_submitted) {
            pre.add(`${card.source_type}:${card.id}`)
          }
        }
      }
    }
    return pre
  })

  function toggleBlock(block: BlockForSubmission) {
    const allIds = block.sections.flatMap((s) =>
      s.cards.map((c) => `${c.source_type}:${c.id}`)
    )
    const allSelected = allIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const id of allIds) next.delete(id)
      } else {
        for (const id of allIds) next.add(id)
      }
      return next
    })
  }

  function toggleSection(block: BlockForSubmission, sectionId: string) {
    const section = block.sections.find((s) => s.id === sectionId)
    if (!section) return
    const allIds = section.cards.map((c) => `${c.source_type}:${c.id}`)
    const allSelected = allIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const id of allIds) next.delete(id)
      } else {
        for (const id of allIds) next.add(id)
      }
      return next
    })
  }

  function toggleCard(sourceType: string, cardId: string) {
    const key = `${sourceType}:${cardId}`
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function getBlockState(block: BlockForSubmission): "all" | "none" | "partial" {
    const allIds = block.sections.flatMap((s) =>
      s.cards.map((c) => `${c.source_type}:${c.id}`)
    )
    const selectedCount = allIds.filter((id) => selected.has(id)).length
    if (selectedCount === 0) return "none"
    if (selectedCount === allIds.length) return "all"
    return "partial"
  }

  function getSectionState(section: BlockForSubmission["sections"][number]): "all" | "none" | "partial" {
    const allIds = section.cards.map((c) => `${c.source_type}:${c.id}`)
    const selectedCount = allIds.filter((id) => selected.has(id)).length
    if (selectedCount === 0) return "none"
    if (selectedCount === allIds.length) return "all"
    return "partial"
  }

  async function handleSubmit() {
    const items: SubmitItem[] = []
    for (const block of blocks) {
      for (const section of block.sections) {
        for (const card of section.cards) {
          const key = `${card.source_type}:${card.id}`
          if (selected.has(key) && !card.already_submitted) {
            items.push({
              source_type: card.source_type,
              source_id: card.id,
              preview_question: card.preview_question,
            })
          }
        }
      }
    }

    if (!items.length) {
      toast.info("Keine neuen Karten ausgewählt.")
      return
    }

    setIsLoading(true)
    const result = await submitContributions(groupId, items)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(`${items.length} ${items.length === 1 ? "Karte" : "Karten"} eingereicht`)
    router.push(`/gruppen/${groupId}`)
  }

  const newCount = (() => {
    let count = 0
    for (const block of blocks) {
      for (const section of block.sections) {
        for (const card of section.cards) {
          const key = `${card.source_type}:${card.id}`
          if (selected.has(key) && !card.already_submitted) count++
        }
      }
    }
    return count
  })()

  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block) => {
        const blockState = getBlockState(block)
        const isExpanded = expandedBlocks.has(block.id)

        return (
          <div key={block.id} className="rounded-lg border border-border bg-card">
            {/* Block header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={blockState === "all"}
                ref={(el) => {
                  if (el) el.indeterminate = blockState === "partial"
                }}
                onChange={() => toggleBlock(block)}
                className="size-4 cursor-pointer accent-blue-600"
              />
              <button
                type="button"
                onClick={() =>
                  setExpandedBlocks((prev) => {
                    const next = new Set(prev)
                    if (next.has(block.id)) {
                      next.delete(block.id)
                    } else {
                      next.add(block.id)
                    }
                    return next
                  })
                }
                className="flex flex-1 items-center gap-1.5 text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                )}
                <span className="text-sm font-medium text-foreground">{block.name}</span>
                <span className="text-xs text-muted-foreground">({block.exam_name})</span>
              </button>
            </div>

            {/* Sections */}
            {isExpanded && (
              <div className="border-t border-border">
                {block.sections.map((section) => {
                  const sectionState = getSectionState(section)
                  return (
                    <div key={section.id} className="border-b border-border last:border-b-0">
                      {/* Section header */}
                      <div className="flex items-center gap-3 px-4 py-2.5 pl-10">
                        <input
                          type="checkbox"
                          checked={sectionState === "all"}
                          ref={(el) => {
                            if (el) el.indeterminate = sectionState === "partial"
                          }}
                          onChange={() => toggleSection(block, section.id)}
                          className="size-4 cursor-pointer accent-blue-600"
                        />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {section.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({section.cards.length})
                        </span>
                      </div>

                      {/* Cards */}
                      {section.cards.map((card) => {
                        const key = `${card.source_type}:${card.id}`
                        const isChecked = selected.has(key)
                        return (
                          <label
                            key={card.id}
                            className="flex cursor-pointer items-center gap-3 px-4 py-2 pl-[3.75rem] hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCard(card.source_type, card.id)}
                              className="size-4 cursor-pointer accent-blue-600"
                            />
                            <span className="flex-1 truncate text-sm text-foreground">
                              {card.preview_question}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                card.source_type === "flashcard"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {typeLabel(card.source_type)}
                            </span>
                            {card.already_submitted && (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                bereits geteilt
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted-foreground">
          {newCount > 0
            ? `${newCount} neue ${newCount === 1 ? "Karte" : "Karten"} werden eingereicht`
            : "Keine neuen Karten ausgewählt"}
        </span>
        <Button onClick={handleSubmit} disabled={isLoading || newCount === 0}>
          {isLoading ? "Wird eingereicht…" : "Einreichen"}
        </Button>
      </div>
    </div>
  )
}
