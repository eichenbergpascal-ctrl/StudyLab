"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Trash2, LogOut } from "lucide-react"
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
import { leaveGroup, deleteGroup } from "../../actions"

interface GroupActionsProps {
  groupId: string
  isOwner: boolean
}

export function GroupActions({ groupId, isOwner }: GroupActionsProps) {
  const router = useRouter()
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleLeave() {
    setIsLoading(true)
    const result = await leaveGroup(groupId)
    setIsLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Gruppe verlassen")
    setLeaveOpen(false)
    router.push("/gruppen")
  }

  async function handleDelete() {
    setIsLoading(true)
    const result = await deleteGroup(groupId)
    setIsLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Gruppe gelöscht")
    setDeleteOpen(false)
    router.push("/gruppen")
  }

  return (
    <>
      {isOwner ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
          Gruppe löschen
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLeaveOpen(true)}
        >
          <LogOut className="size-3.5" strokeWidth={2} />
          Gruppe verlassen
        </Button>
      )}

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gruppe verlassen?</DialogTitle>
            <DialogDescription>
              Du verlässt die Gruppe. Du kannst nur über den Einladungslink
              wieder beitreten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeaveOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button onClick={handleLeave} disabled={isLoading}>
              {isLoading ? "Wird verarbeitet…" : "Verlassen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gruppe löschen?</DialogTitle>
            <DialogDescription>
              Die Gruppe wird unwiderruflich gelöscht. Alle Mitglieder verlieren
              den Zugang und alle Beiträge werden entfernt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Wird gelöscht…" : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
