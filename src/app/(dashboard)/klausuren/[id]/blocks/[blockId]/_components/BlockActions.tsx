"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tables } from "@/lib/database.types"
import { deleteBlock } from "../../actions"
import { BlockFormDialog } from "../../../_components/BlockFormDialog"

type Block = Tables<"blocks">

export function BlockActions({
  block,
  examId,
}: {
  block: Block
  examId: string
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function onDelete() {
    setIsDeleting(true)
    const result = await deleteBlock(block.id, examId)
    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }
    toast.success("Block wurde gelöscht")
    router.push(`/klausuren/${examId}`)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil strokeWidth={2} />
          Bearbeiten
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 strokeWidth={2} />
          Löschen
        </Button>
      </div>

      <BlockFormDialog
        examId={examId}
        block={block}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block löschen?</DialogTitle>
            <DialogDescription>
              Block wirklich löschen? Alle zugehörigen Zusammenfassungen und
              Karteikarten werden gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Wird gelöscht…" : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
