import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getContributionsForGroup } from "../../actions"
import { AdoptAllForm } from "./_components/AdoptAllForm"
import { AdoptSelectiveForm } from "./_components/AdoptSelectiveForm"

export const metadata: Metadata = {
  title: "Karten übernehmen",
}

export default async function UebernehmenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ contributor_id?: string; mode?: string }>
}) {
  const { id } = await params
  const { contributor_id, mode } = await searchParams

  if (!contributor_id || (mode !== "all" && mode !== "selective")) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const contributorGroups = await getContributionsForGroup(id)
  const cg = contributorGroups.find((c) => c.contributor_id === contributor_id)
  if (!cg) notFound()

  const blockLabel = `${cg.contributions.length} ${cg.contributions.length === 1 ? "Karte" : "Karten"}`

  if (mode === "all") {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6">
        <div className="max-w-[640px]">
          <Link
            href={`/gruppen/${id}`}
            className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Gruppe
          </Link>

          <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
            Als neue Klausur übernehmen
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {blockLabel} werden als neue Klausur in deinem Konto erstellt.
          </p>

          <AdoptAllForm groupId={id} contributorId={contributor_id} />
        </div>
      </div>
    )
  }

  // mode === "selective" — need user's exams + blocks for dropdowns
  const { data: exams } = await supabase
    .from("exams")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  const examIds = (exams ?? []).map((e) => e.id)
  const { data: blocks } =
    examIds.length > 0
      ? await supabase
          .from("blocks")
          .select("id, name, exam_id")
          .in("exam_id", examIds)
          .order("name", { ascending: true })
      : { data: [] as { id: string; name: string; exam_id: string }[] }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[640px]">
        <Link
          href={`/gruppen/${id}`}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" strokeWidth={2} />
          Gruppe
        </Link>

        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">
          Karten einzeln auswählen
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Wähle Karten aus und weise sie einem Block in einer deiner Klausuren zu.
        </p>

        <AdoptSelectiveForm
          groupId={id}
          contributions={cg.contributions}
          exams={exams ?? []}
          blocks={blocks ?? []}
        />
      </div>
    </div>
  )
}
