import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyCardsForSubmission } from "../../actions"
import { CardSubmissionForm } from "./_components/CardSubmissionForm"

export const metadata: Metadata = {
  title: "Karten einreichen",
}

export default async function EinreichenPage({
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

  const blocks = await getMyCardsForSubmission(id)

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <Link
          href={`/gruppen/${id}`}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          Gruppe
        </Link>

        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
          Karten einreichen
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Wähle die Karten aus, die du mit der Gruppe teilen möchtest.
        </p>

        {blocks.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Du hast noch keine Karten. Erstelle zuerst Karteikarten oder Klausurfragen.
            </p>
          </div>
        ) : (
          <CardSubmissionForm groupId={id} blocks={blocks} />
        )}
      </div>
    </div>
  )
}
