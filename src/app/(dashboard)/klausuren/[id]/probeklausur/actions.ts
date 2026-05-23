"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { largestRemainder } from "@/lib/utils/largest-remainder"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function startExamSession(
  examId: string,
  blockId?: string,
): Promise<{ sessionId?: string; error?: string }> {
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

  // Check for existing open session (scoped to Vollklausur or Teilklausur)
  let existingQuery = supabase
    .from("exam_sessions")
    .select("id")
    .eq("exam_id", examId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")

  if (blockId) {
    existingQuery = existingQuery.eq("block_id", blockId)
  } else {
    existingQuery = existingQuery.is("block_id", null)
  }

  const { data: existing } = await existingQuery.maybeSingle()
  if (existing) {
    return { error: "open_session_exists", sessionId: existing.id }
  }

  // Load blocks with all exam question IDs
  let blocksQuery = supabase
    .from("blocks")
    .select(
      "id, weight_percent, summaries(sections(exam_questions(id)))",
    )
    .eq("exam_id", examId)

  if (blockId) {
    blocksQuery = blocksQuery.eq("id", blockId)
  }

  const { data: blocksRaw } = await blocksQuery

  if (!blocksRaw || blocksRaw.length === 0) {
    return { error: "Keine Blöcke gefunden." }
  }

  type BlockPool = { blockId: string; weight: number; questionIds: string[] }
  const blockPools: BlockPool[] = blocksRaw.map((b) => ({
    blockId: b.id,
    weight: b.weight_percent,
    questionIds: b.summaries.flatMap((s) =>
      s.sections.flatMap((sec) =>
        sec.exam_questions.map((eq: { id: string }) => eq.id),
      ),
    ),
  }))

  let questionIds: string[] = []

  if (blockId) {
    // Teilklausur: count = Math.max(3, Math.min(18, Math.round(weight/100 * 18)))
    const pool = blockPools[0]
    const count = Math.max(3, Math.min(18, Math.round((pool.weight / 100) * 18)))
    // If pool has fewer questions than needed, take all available
    questionIds = shuffle(pool.questionIds).slice(0, count)
  } else {
    // Vollklausur: largest-remainder distribution across blocks
    const distribution = largestRemainder(
      blockPools.map((bp) => ({ blockId: bp.blockId, weight: bp.weight })),
    )
    for (const { blockId: bid, count } of distribution) {
      const pool = blockPools.find((bp) => bp.blockId === bid)
      if (!pool) continue
      // If pool is smaller than needed, take all — see spec: "nimm was da ist"
      const taken = shuffle(pool.questionIds).slice(0, count)
      questionIds.push(...taken)
    }
  }

  if (questionIds.length === 0) {
    return {
      error:
        "Keine Prüfungsfragen gefunden. Bitte lade zuerst Zusammenfassungen hoch.",
    }
  }

  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      exam_id: examId,
      block_id: blockId ?? null,
      status: "in_progress",
      question_ids: questionIds,
      answers: {},
    })
    .select("id")
    .single()

  if (sessionError || !session) {
    return { error: "Session konnte nicht erstellt werden." }
  }

  return { sessionId: session.id }
}
