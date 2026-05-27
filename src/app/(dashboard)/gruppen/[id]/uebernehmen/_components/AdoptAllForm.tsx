"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { adoptAllAsNewExam } from "../../../actions"

interface AdoptAllFormProps {
  groupId: string
  contributorId: string
}

export function AdoptAllForm({ groupId, contributorId }: AdoptAllFormProps) {
  const [examName, setExamName] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [result, setResult] = React.useState<{
    exam_id: string
    cards_adopted: number
    blocks_created: number
  } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!examName.trim()) return

    setIsLoading(true)
    const res = await adoptAllAsNewExam(groupId, contributorId, examName)
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
      return
    }

    setResult({
      exam_id: res.exam_id!,
      cards_adopted: res.cards_adopted ?? 0,
      blocks_created: res.blocks_created ?? 0,
    })
  }

  if (result) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-50">
          <CheckCircle className="size-5 text-green-600" strokeWidth={1.5} />
        </div>
        <h2 className="mb-1 text-base font-medium text-foreground">Übernommen</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {result.cards_adopted} {result.cards_adopted === 1 ? "Karte" : "Karten"} in{" "}
          {result.blocks_created} {result.blocks_created === 1 ? "Block" : "Blöcken"} erstellt.
        </p>
        <div className="flex justify-center gap-2">
          <Link href={`/klausuren/${result.exam_id}`} className={cn(buttonVariants({ size: "sm" }))}>
            Zur Klausur
          </Link>
          <Link href={`/gruppen/${groupId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Zur Gruppe
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4">
        <Label htmlFor="exam-name" className="mb-1.5 block text-sm font-medium">
          Name der neuen Klausur
        </Label>
        <Input
          id="exam-name"
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
          placeholder="z.B. Mathe — geteilte Karten"
          className="w-full"
          autoFocus
        />
      </div>
      <Button type="submit" disabled={isLoading || !examName.trim()} className="w-full">
        {isLoading ? "Wird übernommen…" : "Klausur erstellen"}
      </Button>
    </form>
  )
}
