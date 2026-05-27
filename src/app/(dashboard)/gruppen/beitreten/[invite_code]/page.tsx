import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { JoinGroupButton } from "./_components/JoinGroupButton"

export const metadata: Metadata = {
  title: "Gruppe beitreten",
}

export default async function BeitretenPage({
  params,
}: {
  params: Promise<{ invite_code: string }>
}) {
  const { invite_code } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: preview } = await supabase.rpc(
    "get_group_preview_by_invite_code",
    { p_invite_code: invite_code.toUpperCase() }
  )

  const group = preview?.[0] ?? null

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-8">
      <div className="w-full max-w-sm">
        {group ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-50">
              <Users className="size-5 text-blue-500" strokeWidth={1.5} />
            </div>
            <h1 className="mb-1 text-xl font-semibold text-foreground">
              {group.name}
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {Number(group.member_count)}{" "}
              {Number(group.member_count) === 1 ? "Mitglied" : "Mitglieder"}
            </p>
            <JoinGroupButton inviteCode={invite_code.toUpperCase()} />
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <h1 className="mb-2 text-base font-medium text-foreground">
              Ungültiger Einladungslink
            </h1>
            <p className="text-sm text-muted-foreground">
              Dieser Link ist nicht gültig oder die Gruppe existiert nicht mehr.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
