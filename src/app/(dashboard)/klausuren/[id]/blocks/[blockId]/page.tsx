import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { BlockActions } from "./_components/BlockActions"
import { SummarySection } from "./_components/SummarySection"

export default async function BlockDetailPage({
  params,
}: {
  params: Promise<{ id: string; blockId: string }>
}) {
  const { id: examId, blockId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id, name")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()

  if (!exam) notFound()

  const { data: block } = await supabase
    .from("blocks")
    .select("*")
    .eq("id", blockId)
    .eq("exam_id", examId)
    .single()

  if (!block) notFound()

  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .eq("block_id", blockId)
    .order("created_at", { ascending: false })

  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <Link
          href={`/klausuren/${examId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
          {exam.name}
        </Link>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-1.5 text-2xl font-semibold tracking-tight text-foreground">
              {block.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Gewichtung: {block.weight_percent} %
            </p>
          </div>
          <BlockActions block={block} examId={examId} />
        </div>

        <div className="flex flex-col gap-6">
          <SummarySection
            summaries={summaries ?? []}
            blockId={blockId}
            examId={examId}
          />
          <PlaceholderSection
            icon={
              <CreditCard className="size-5 text-slate-300" strokeWidth={1.5} />
            }
            title="Karteikarten"
            description="Karteikarten werden automatisch aus deinen Zusammenfassungen generiert."
          />
        </div>
      </div>
    </div>
  )
}

function PlaceholderSection({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-foreground">{title}</h2>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-8 py-10 text-center">
        <div className="mb-3">{icon}</div>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </section>
  )
}
