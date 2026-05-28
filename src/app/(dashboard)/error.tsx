"use client"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-full items-center justify-center px-4 py-4 md:px-8 md:py-6">
      <div className="w-full max-w-sm rounded-lg border border-[#E3E8ED] bg-white p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <AlertCircle
          className="mx-auto mb-4 size-10 text-muted-foreground"
          strokeWidth={1.5}
        />
        <h2 className="mb-1 text-base font-semibold text-foreground">
          Etwas ist schiefgelaufen
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
        </p>
        <Button onClick={reset} variant="outline" size="sm">
          Erneut versuchen
        </Button>
      </div>
    </div>
  )
}
