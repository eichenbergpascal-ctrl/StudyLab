import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getGroupDetail, getContributionsForGroup } from "../actions"
import { InviteLinkCopy } from "./_components/InviteLinkCopy"
import { GroupActions } from "./_components/GroupActions"
import { OwnContributionsCard } from "./_components/OwnContributionsCard"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Gruppe",
}

export default async function GruppenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [group, contributorGroups] = await Promise.all([
    getGroupDetail(id),
    getContributionsForGroup(id),
  ])
  if (!group) notFound()

  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : "https"
  const inviteUrl = `${protocol}://${host}/gruppen/beitreten/${group.invite_code}`

  const ownContribs = contributorGroups.find((cg) => cg.contributor_id === user.id)
  const otherContribs = contributorGroups.filter((cg) => cg.contributor_id !== user.id)

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <Link
          href="/gruppen"
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          Lerngruppen
        </Link>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
              {group.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {group.member_count}{" "}
              {group.member_count === 1 ? "Mitglied" : "Mitglieder"}
            </p>
          </div>
          <GroupActions groupId={group.id} isOwner={group.is_owner} />
        </div>

        <div className="flex flex-col gap-4">
          {/* Einladungslink */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-sm font-medium text-foreground">
              Einladungslink
            </p>
            <InviteLinkCopy inviteUrl={inviteUrl} />
          </div>

          {/* Mitglieder */}
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Mitglieder</p>
            <div className="flex flex-col divide-y divide-border">
              {group.members.map((member, idx) => {
                const isCurrentUser = member.user_id === user.id
                const isOwner = member.user_id === group.owner_id
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm text-foreground">
                      {isCurrentUser ? "Du" : `Mitglied ${idx + 1}`}
                    </span>
                    {isOwner && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        Eigentümer
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Eigene Beiträge */}
          <OwnContributionsCard ownContribs={ownContribs} groupId={id} />

          {/* Beiträge anderer Mitglieder */}
          {otherContribs.map((cg) => {
            const memberIdx = group.members.findIndex(
              (m) => m.user_id === cg.contributor_id
            )
            const displayName = `Mitglied ${memberIdx + 1}`

            const fcCount = cg.contributions.filter((c) => c.source_type === "flashcard").length
            const eqCount = cg.contributions.filter((c) => c.source_type === "exam_question").length
            const typeParts: string[] = []
            if (fcCount > 0) typeParts.push(`${fcCount} ${fcCount === 1 ? "Karteikarte" : "Karteikarten"}`)
            if (eqCount > 0) typeParts.push(`${eqCount} ${eqCount === 1 ? "Klausurfrage" : "Klausurfragen"}`)

            return (
              <div
                key={cg.contributor_id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-3 flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  {cg.unadopted_count > 0 && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {cg.unadopted_count} neu
                    </span>
                  )}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  {typeParts.join(" · ") || `${cg.contributions.length} Karten`}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/gruppen/${id}/uebernehmen?contributor_id=${cg.contributor_id}&mode=all`}
                    className={cn(buttonVariants({ size: "sm" }))}
                  >
                    Als neue Klausur
                  </Link>
                  <Link
                    href={`/gruppen/${id}/uebernehmen?contributor_id=${cg.contributor_id}&mode=selective`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Einzeln auswählen
                  </Link>
                </div>
              </div>
            )
          })}

          {otherContribs.length === 0 && contributorGroups.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Noch keine Karten geteilt. Lade Mitglieder ein und reiche Karten ein.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
