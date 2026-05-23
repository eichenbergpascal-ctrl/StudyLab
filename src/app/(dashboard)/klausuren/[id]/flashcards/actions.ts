"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createFlashcard(
  examId: string,
  sectionId: string,
  question: string,
  answer: string,
): Promise<{ error?: string }> {
  const q = question.trim()
  const a = answer.trim()
  if (!q || !a) return { error: "Frage und Antwort sind erforderlich." }

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

  const { error } = await supabase.from("flashcards").insert({
    section_id: sectionId,
    question: q,
    answer: a,
    is_user_created: true,
  })
  if (error) return { error: "Karte konnte nicht erstellt werden." }

  revalidatePath(`/klausuren/${examId}/flashcards`)
  revalidatePath("/karteikarten")
  return {}
}

export async function updateFlashcard(
  examId: string,
  flashcardId: string,
  question: string,
  answer: string,
): Promise<{ error?: string }> {
  const q = question.trim()
  const a = answer.trim()
  if (!q || !a) return { error: "Frage und Antwort sind erforderlich." }

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
    .from("flashcards")
    .update({ question: q, answer: a })
    .eq("id", flashcardId)
  if (error) return { error: "Karte konnte nicht aktualisiert werden." }

  revalidatePath(`/klausuren/${examId}/flashcards`)
  revalidatePath("/karteikarten")
  return {}
}

export async function deleteFlashcard(
  examId: string,
  flashcardId: string,
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
    .from("flashcards")
    .delete()
    .eq("id", flashcardId)
  if (error) return { error: "Karte konnte nicht gelöscht werden." }

  revalidatePath(`/klausuren/${examId}/flashcards`)
  revalidatePath("/karteikarten")
  return {}
}
