"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startSectionExamSession } from "../actions"

export function StartSectionButton({
  examId,
  sectionId,
  disabled = false,
}: {
  examId: string
  sectionId: string
  disabled?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const result = await startSectionExamSession(examId, sectionId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.sessionId) {
        router.push(`/klausuren/${examId}/probeklausur/session/${result.sessionId}`)
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2"
      onClick={handleClick}
      disabled={disabled || isPending}
    >
      <CheckSquare className="size-3.5 shrink-0" strokeWidth={2} />
      {isPending ? "Wird gestartet…" : "Klausuraufgaben üben"}
    </Button>
  )
}
