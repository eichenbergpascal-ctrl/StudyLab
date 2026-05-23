"use client"

import * as React from "react"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Tables } from "@/lib/database.types"
import { createBlock, updateBlock } from "../blocks/actions"

type Block = Tables<"blocks">

const schema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  weight_percent: z.number().min(0, "Mindestens 0").max(100, "Maximal 100"),
})

type FormValues = z.infer<typeof schema>

type Props = {
  examId: string
  block?: Block
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BlockFormDialog({ examId, block, open, onOpenChange }: Props) {
  const isEdit = !!block

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: block?.name ?? "",
      weight_percent: block?.weight_percent ?? 0,
    },
  })

  async function onSubmit(values: FormValues) {
    const result = isEdit
      ? await updateBlock(block!.id, examId, values)
      : await createBlock(examId, values)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Block wurde aktualisiert" : "Block wurde erstellt")
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          reset({
            name: block?.name ?? "",
            weight_percent: block?.weight_percent ?? 0,
          })
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Block bearbeiten" : "Block hinzufügen"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-name">Name *</Label>
            <Input
              id="block-name"
              placeholder="z.B. Lineare Algebra"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-weight">Gewichtung (%) *</Label>
            <Input
              id="block-weight"
              type="number"
              min={0}
              max={100}
              aria-invalid={!!errors.weight_percent}
              {...register("weight_percent", { valueAsNumber: true })}
            />
            {errors.weight_percent && (
              <p className="text-xs text-destructive">
                {errors.weight_percent.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
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
  )
}
