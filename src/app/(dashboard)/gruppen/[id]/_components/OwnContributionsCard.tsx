"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ContributorGroup, ContributionForGroup } from "../../actions"
import { ContributionPreviewDialog } from "./ContributionPreviewDialog"

interface OwnContributionsCardProps {
  ownContribs: ContributorGroup | undefined
  groupId: string
}

function typeLabel(source_type: string): string {
  return source_type === "flashcard" ? "Karteikarte" : "Klausurfrage"
}

function typeSummary(contribs: ContributorGroup["contributions"]): string {
  const fc = contribs.filter((c) => c.source_type === "flashcard").length
  const eq = contribs.filter((c) => c.source_type === "exam_question").length
  const parts: string[] = []
  if (fc > 0) parts.push(`${fc} ${fc === 1 ? "Karteikarte" : "Karteikarten"}`)
  if (eq > 0) parts.push(`${eq} ${eq === 1 ? "Klausurfrage" : "Klausurfragen"}`)
  return parts.join(" · ")
}

export function OwnContributionsCard({ ownContribs, groupId }: OwnContributionsCardProps) {
  const [showAll, setShowAll] = React.useState(false)
  const [selected, setSelected] = React.useState<ContributionForGroup | null>(null)

  const allContribs = ownContribs ? [...ownContribs.contributions].reverse() : []
  const visible = showAll ? allContribs : allContribs.slice(0, 5)

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <ContributionPreviewDialog contribution={selected} onClose={() => setSelected(null)} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Deine Beiträge</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {ownContribs ? typeSummary(ownContribs.contributions) : "Noch keine Karten geteilt"}
          </p>
        </div>
        <Link
          href={`/gruppen/${groupId}/einreichen`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Karten einreichen
        </Link>
      </div>

      {allContribs.length > 0 && (
        <div className="mt-3 flex flex-col divide-y divide-border border-t border-border">
          {visible.map((c) => (
            <div
              key={c.id}
              className="cursor-pointer py-2.5 first:pt-3 hover:bg-slate-50 -mx-1 px-1 rounded"
              onClick={() => setSelected(c)}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex-1 text-sm text-foreground">
                  {c.preview_question.length > 80
                    ? c.preview_question.slice(0, 80) + "…"
                    : c.preview_question}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    c.source_type === "flashcard"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-blue-50 text-blue-600"
                  )}
                >
                  {typeLabel(c.source_type)}
                </span>
              </div>
              {c.block_name && (
                <p className="mt-0.5 text-xs text-muted-foreground">{c.block_name}</p>
              )}
            </div>
          ))}

          {allContribs.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="pt-2.5 text-left text-sm text-blue-600 hover:underline"
            >
              {showAll ? "Weniger anzeigen" : `Alle ${allContribs.length} anzeigen`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
