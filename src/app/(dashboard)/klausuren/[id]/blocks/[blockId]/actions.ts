"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createSummaryRecord(
  blockId: string,
  examId: string,
  filename: string
): Promise<{ summaryId?: string; storagePath?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify the block belongs to the current user via the exam chain
  const { data: block } = await supabase
    .from("blocks")
    .select("id, exam_id")
    .eq("id", blockId)
    .single()
  if (!block) return { error: "Block nicht gefunden." }

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", block.exam_id)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Keine Berechtigung." }

  // Insert with a placeholder storage_path, then update with the real one once we have the ID
  const { data: summary, error: insertError } = await supabase
    .from("summaries")
    .insert({
      block_id: blockId,
      filename,
      storage_path: "_pending",
      processing_status: "pending",
    })
    .select("id")
    .single()

  if (insertError || !summary) {
    return { error: "Zusammenfassung konnte nicht erstellt werden." }
  }

  const storagePath = `${user.id}/${summary.id}.pdf`

  const { error: updateError } = await supabase
    .from("summaries")
    .update({ storage_path: storagePath })
    .eq("id", summary.id)

  if (updateError) {
    // Clean up the orphaned record
    await supabase.from("summaries").delete().eq("id", summary.id)
    return { error: "Zusammenfassung konnte nicht erstellt werden." }
  }

  return { summaryId: summary.id, storagePath }
}

export async function deleteSummary(
  summaryId: string,
  examId: string,
  blockId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch summary and verify ownership through the chain
  const { data: summary } = await supabase
    .from("summaries")
    .select("id, storage_path, block_id")
    .eq("id", summaryId)
    .single()
  if (!summary) return { error: "Zusammenfassung nicht gefunden." }

  const { data: block } = await supabase
    .from("blocks")
    .select("id, exam_id")
    .eq("id", summary.block_id)
    .single()
  if (!block) return { error: "Block nicht gefunden." }

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", block.exam_id)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Keine Berechtigung." }

  // Delete from storage first — ignore errors (file may not exist if upload failed mid-way)
  await supabase.storage.from("summaries").remove([summary.storage_path])

  // Delete the DB record
  const { error: dbError } = await supabase
    .from("summaries")
    .delete()
    .eq("id", summaryId)
  if (dbError) return { error: "Zusammenfassung konnte nicht gelöscht werden." }

  revalidatePath(`/klausuren/${examId}/blocks/${blockId}`)
  return {}
}

export async function retrySummaryProcessing(
  summaryId: string,
  examId: string,
  blockId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Verify ownership through the chain
  const { data: summary } = await supabase
    .from("summaries")
    .select("id, block_id")
    .eq("id", summaryId)
    .single()
  if (!summary) return { error: "Zusammenfassung nicht gefunden." }

  const { data: block } = await supabase
    .from("blocks")
    .select("id, exam_id")
    .eq("id", summary.block_id)
    .single()
  if (!block) return { error: "Block nicht gefunden." }

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", block.exam_id)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Keine Berechtigung." }

  // Delete existing sections — cascades to flashcards and exam_questions
  await supabase.from("sections").delete().eq("summary_id", summaryId)

  // Reset summary state
  const { error: resetError } = await supabase
    .from("summaries")
    .update({
      processing_status: "pending",
      processing_error: null,
      sections_processed: 0,
      sections_total: null,
      parsed_content: null,
    })
    .eq("id", summaryId)

  if (resetError) return { error: "Zurücksetzen fehlgeschlagen." }

  revalidatePath(`/klausuren/${examId}/blocks/${blockId}`)
  return {}
}

export async function replaceSummaryPdf(
  summaryId: string,
  examId: string,
  blockId: string
): Promise<{ storagePath?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: summary } = await supabase
    .from("summaries")
    .select("id, storage_path, processing_status, block_id")
    .eq("id", summaryId)
    .single()
  if (!summary) return { error: "Zusammenfassung nicht gefunden." }
  if (summary.processing_status !== "completed")
    return { error: "Nur abgeschlossene Zusammenfassungen können ersetzt werden." }

  const { data: block } = await supabase
    .from("blocks")
    .select("id, exam_id")
    .eq("id", summary.block_id)
    .single()
  if (!block) return { error: "Block nicht gefunden." }

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", block.exam_id)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Keine Berechtigung." }

  return { storagePath: summary.storage_path }
}

export async function completePdfReplace(
  summaryId: string,
  examId: string,
  blockId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: summary } = await supabase
    .from("summaries")
    .select("id, block_id")
    .eq("id", summaryId)
    .single()
  if (!summary) return { error: "Zusammenfassung nicht gefunden." }

  const { data: block } = await supabase
    .from("blocks")
    .select("id, exam_id")
    .eq("id", summary.block_id)
    .single()
  if (!block) return { error: "Block nicht gefunden." }

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", block.exam_id)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Keine Berechtigung." }

  const { error: updateError } = await supabase
    .from("summaries")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", summaryId)
  if (updateError) return { error: "Aktualisierung fehlgeschlagen." }

  revalidatePath(`/klausuren/${examId}/blocks/${blockId}`)
  return {}
}
