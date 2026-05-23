"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const blockSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  weight_percent: z.number().min(0).max(100),
})

export type BlockFormData = z.infer<typeof blockSchema>

export async function createBlock(
  examId: string,
  data: BlockFormData
): Promise<{ error?: string }> {
  const parsed = blockSchema.safeParse(data)
  if (!parsed.success) return { error: "Ungültige Eingabe." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Klausur nicht gefunden." }

  const { error } = await supabase.from("blocks").insert({
    exam_id: examId,
    name: parsed.data.name.trim(),
    weight_percent: parsed.data.weight_percent,
  })

  if (error) return { error: "Block konnte nicht erstellt werden." }

  revalidatePath(`/klausuren/${examId}`)
  return {}
}

export async function updateBlock(
  blockId: string,
  examId: string,
  data: BlockFormData
): Promise<{ error?: string }> {
  const parsed = blockSchema.safeParse(data)
  if (!parsed.success) return { error: "Ungültige Eingabe." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Klausur nicht gefunden." }

  const { error } = await supabase
    .from("blocks")
    .update({
      name: parsed.data.name.trim(),
      weight_percent: parsed.data.weight_percent,
    })
    .eq("id", blockId)
    .eq("exam_id", examId)

  if (error) return { error: "Block konnte nicht aktualisiert werden." }

  revalidatePath(`/klausuren/${examId}`)
  revalidatePath(`/klausuren/${examId}/blocks/${blockId}`)
  return {}
}

export async function deleteBlock(
  blockId: string,
  examId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: exam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", examId)
    .eq("user_id", user.id)
    .single()
  if (!exam) return { error: "Klausur nicht gefunden." }

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("id", blockId)
    .eq("exam_id", examId)

  if (error) return { error: "Block konnte nicht gelöscht werden." }

  revalidatePath(`/klausuren/${examId}`)
  return {}
}
