"use client"

import * as React from "react"
import Link from "next/link"
import { BookOpen, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tables } from "@/lib/database.types"
import { BlockFormDialog } from "./BlockFormDialog"

type Block = Tables<"blocks">

export function BlockList({
  blocks,
  examId,
}: {
  blocks: Block[]
  examId: string
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">
          Themenblöcke
        </h2>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" strokeWidth={2} />
          Block hinzufügen
        </Button>
      </div>

      {blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-8 py-10 text-center">
          <div className="mb-3">
            <BookOpen className="size-5 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            Noch keine Themenblöcke angelegt. Strukturiere deine Klausur in
            Themenblöcke.
          </p>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" strokeWidth={2} />
            Block hinzufügen
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {blocks.map((block) => (
            <Link
              key={block.id}
              href={`/klausuren/${examId}/blocks/${block.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-shadow hover:shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {block.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  0 Zusammenfassungen
                </p>
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {block.weight_percent} %
              </span>
            </Link>
          ))}
        </div>
      )}

      <BlockFormDialog
        examId={examId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  )
}
