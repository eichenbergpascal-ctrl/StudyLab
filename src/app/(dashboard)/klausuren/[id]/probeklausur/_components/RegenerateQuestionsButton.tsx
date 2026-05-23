"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function RegenerateQuestionsButton({
  sectionId,
  sectionTitle,
  mode = "exam_questions_only",
}: {
  sectionId: string
  sectionTitle: string
  mode?: "exam_questions_only" | "flashcards_only"
}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleClick() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error("Nicht eingeloggt.")
        return
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const res = await fetch(`${supabaseUrl}/functions/v1/regenerate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ section_id: sectionId, mode }),
      })

      if (!res.ok) {
        toast.error(`Generierung für "${sectionTitle}" fehlgeschlagen.`)
        return
      }

      const data = (await res.json()) as { ok?: boolean; count?: number }
      toast.success(
        `${data.count ?? 0} neue Aufgaben für "${sectionTitle}" generiert.`,
      )
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
    >
      <RefreshCw
        className={`size-3 ${isLoading ? "animate-spin" : ""}`}
        strokeWidth={2}
      />
      {isLoading ? "Generiert…" : "Nachgenerieren"}
    </button>
  )
}
