import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { getMyGroups } from "./actions"
import { CreateGroupButton } from "./_components/CreateGroupButton"

export const metadata: Metadata = {
  title: "Lerngruppen",
}

export default async function GruppenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const groups = await getMyGroups()

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
              Lerngruppen
            </h1>
            <p className="text-sm text-muted-foreground">
              {groups.length} {groups.length === 1 ? "Gruppe" : "Gruppen"}
            </p>
          </div>
          <CreateGroupButton />
        </div>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card px-8 py-16 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="size-5 text-slate-400" strokeWidth={1.5} />
            </div>
            <h2 className="mb-1 text-base font-medium text-foreground">
              Noch keine Lerngruppen
            </h2>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Erstelle eine Gruppe oder tritt einer bestehenden über einen
              Einladungslink bei.
            </p>
            <CreateGroupButton />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/gruppen/${group.id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3.5 transition-colors hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {group.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {group.member_count}{" "}
                    {group.member_count === 1 ? "Mitglied" : "Mitglieder"}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    group.role === "owner"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {group.role === "owner" ? "Eigentümer" : "Mitglied"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
