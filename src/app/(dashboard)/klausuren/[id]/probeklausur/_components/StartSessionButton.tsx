"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { startExamSession } from "../actions"

export function StartSessionButton({
  examId,
  blockId,
  disabled = false,
  label,
  variant = "default",
  size,
}: {
  examId: string
  blockId?: string
  disabled?: boolean
  label: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm"
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    startTransition(async () => {
      const result = await startExamSession(examId, blockId)
      if (result.error === "open_session_exists" && result.sessionId) {
        router.push(`/klausuren/${examId}/probeklausur/session/${result.sessionId}`)
      } else if (result.error) {
        toast.error(result.error)
      } else if (result.sessionId) {
        router.push(`/klausuren/${examId}/probeklausur/session/${result.sessionId}`)
      }
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || isPending}
    >
      {isPending ? "Wird gestartet…" : label}
    </Button>
  )
}
