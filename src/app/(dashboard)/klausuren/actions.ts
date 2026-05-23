"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type ExamFormData = {
  name: string
  subject: string
  exam_date: string
}

export async function createExam(
  data: ExamFormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { error } = await supabase.from("exams").insert({
    user_id: user.id,
    name: data.name.trim(),
    subject: data.subject.trim() || null,
    exam_date: data.exam_date || null,
  })

  if (error) return { error: "Klausur konnte nicht erstellt werden." }

  revalidatePath("/klausuren")
  revalidatePath("/")
  return {}
}

export async function updateExam(
  id: string,
  data: ExamFormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { error } = await supabase
    .from("exams")
    .update({
      name: data.name.trim(),
      subject: data.subject.trim() || null,
      exam_date: data.exam_date || null,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: "Klausur konnte nicht aktualisiert werden." }

  revalidatePath("/klausuren")
  revalidatePath(`/klausuren/${id}`)
  revalidatePath("/")
  return {}
}

export async function deleteExam(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { error } = await supabase
    .from("exams")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: "Klausur konnte nicht gelöscht werden." }

  revalidatePath("/klausuren")
  revalidatePath("/")
  return {}
}
