"use client"

import * as React from "react"
import { Plus } from "lucide-react"
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
import { createExam } from "../actions"

const schema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  subject: z.string(),
  exam_date: z.string(),
})

type FormValues = z.infer<typeof schema>

export function CreateExamButton() {
  const [open, setOpen] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", subject: "", exam_date: "" },
  })

  async function onSubmit(values: FormValues) {
    const result = await createExam(values)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success("Klausur wurde erstellt")
    setOpen(false)
    reset()
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) reset()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus strokeWidth={2} />
        Klausur erstellen
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Klausur</DialogTitle>
          <DialogDescription>
            Name ist erforderlich. Fach und Datum sind optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name">Name *</Label>
            <Input
              id="create-name"
              placeholder="z.B. Mathematik 1"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-subject">Fach (optional)</Label>
            <Input
              id="create-subject"
              placeholder="z.B. Informatik"
              {...register("subject")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-date">Datum (optional)</Label>
            <Input id="create-date" type="date" {...register("exam_date")} />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Wird erstellt…" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
