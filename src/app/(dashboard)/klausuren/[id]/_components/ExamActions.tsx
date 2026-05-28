"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

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
import { Tables } from "@/lib/database.types"
import { updateExam, deleteExam } from "../../actions"

type Exam = Tables<"exams">

const schema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  subject: z.string(),
  exam_date: z.string(),
})

type FormValues = z.infer<typeof schema>

export function ExamActions({ exam }: { exam: Exam }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: exam.name,
      subject: exam.subject ?? "",
      exam_date: exam.exam_date ?? "",
    },
  })

  async function onEdit(values: FormValues) {
    const result = await updateExam(exam.id, values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Klausur wurde aktualisiert")
    setEditOpen(false)
  }

  async function onDelete() {
    setIsDeleting(true)
    const result = await deleteExam(exam.id)
    if (result.error) {
      toast.error(result.error)
      setIsDeleting(false)
      return
    }
    toast.success("Klausur wurde gelöscht")
    router.push("/klausuren")
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil strokeWidth={2} />
          <span className="hidden sm:inline">Bearbeiten</span>
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 strokeWidth={2} />
          <span className="hidden sm:inline">Löschen</span>
        </Button>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) reset({ name: exam.name, subject: exam.subject ?? "", exam_date: exam.exam_date ?? "" }) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klausur bearbeiten</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(onEdit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-subject">Fach (optional)</Label>
              <Input id="edit-subject" {...register("subject")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-date">Datum (optional)</Label>
              <Input id="edit-date" type="date" {...register("exam_date")} />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setEditOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird gespeichert…" : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klausur löschen?</DialogTitle>
            <DialogDescription>
              Alle zugehörigen Daten (Blöcke, Zusammenfassungen, Karteikarten)
              werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig
              gemacht werden.
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
