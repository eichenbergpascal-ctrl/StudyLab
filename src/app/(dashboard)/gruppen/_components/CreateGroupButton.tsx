"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createGroup } from "../actions"

export function CreateGroupButton() {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)
    const result = await createGroup(name)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success("Gruppe wurde erstellt")
    setOpen(false)
    setName("")
    if (result.id) router.push(`/gruppen/${result.id}`)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) setName("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus strokeWidth={2} />
        Gruppe erstellen
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Lerngruppe</DialogTitle>
          <DialogDescription>
            Wähle einen Namen für deine Lerngruppe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-name">Name *</Label>
            <Input
              id="group-name"
              placeholder="z.B. Mathe-Gruppe WS 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? "Wird erstellt…" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
