"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface InviteLinkCopyProps {
  inviteUrl: string
}

export function InviteLinkCopy({ inviteUrl }: InviteLinkCopyProps) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      toast.success("Link kopiert")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Kopieren fehlgeschlagen")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 truncate rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-muted-foreground">
        {inviteUrl}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="shrink-0"
      >
        {copied ? (
          <Check className="size-3.5 text-green-600" strokeWidth={2} />
        ) : (
          <Copy className="size-3.5" strokeWidth={2} />
        )}
        {copied ? "Kopiert" : "Kopieren"}
      </Button>
    </div>
  )
}
