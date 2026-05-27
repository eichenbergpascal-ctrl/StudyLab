"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { joinGroup } from "../../../actions"

interface JoinGroupButtonProps {
  inviteCode: string
}

export function JoinGroupButton({ inviteCode }: JoinGroupButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  async function handleJoin() {
    setIsLoading(true)
    const result = await joinGroup(inviteCode)
    setIsLoading(false)

    if (result.error) {
      toast.error(result.error)
      if (result.id) router.push(`/gruppen/${result.id}`)
      return
    }

    toast.success("Gruppe beigetreten")
    if (result.id) router.push(`/gruppen/${result.id}`)
  }

  return (
    <Button onClick={handleJoin} disabled={isLoading} className="w-full">
      {isLoading ? "Wird beigetreten…" : "Gruppe beitreten"}
    </Button>
  )
}
