"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Json, Database } from "@/lib/database.types"
import { largestRemainder } from "@/lib/utils/largest-remainder"

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const bytes = randomBytes(6)
  return Array.from(bytes, (b) => chars[b % 36]).join("")
}

export async function createGroup(
  name: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const invite_code = generateInviteCode()

  const { data: group, error } = await supabase
    .from("study_groups")
    .insert({ name: name.trim(), owner_id: user.id, invite_code })
    .select("id")
    .single()

  if (error || !group) return { error: "Gruppe konnte nicht erstellt werden." }

  await supabase
    .from("study_group_members")
    .insert({ group_id: group.id, user_id: user.id })

  revalidatePath("/gruppen")
  return { id: group.id }
}

export async function joinGroup(
  invite_code: string
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: groupId, error: lookupError } = await supabase.rpc(
    "get_group_id_by_invite_code",
    { p_invite_code: invite_code.toUpperCase() }
  )

  if (lookupError || !groupId) return { error: "Ungültiger Einladungslink." }

  const { data: existing } = await supabase
    .from("study_group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    return { error: "Du bist bereits Mitglied dieser Gruppe.", id: groupId }
  }

  const { error } = await supabase
    .from("study_group_members")
    .insert({ group_id: groupId, user_id: user.id })

  if (error) return { error: "Beitritt fehlgeschlagen." }

  revalidatePath("/gruppen")
  return { id: groupId }
}

export async function leaveGroup(
  group_id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: group } = await supabase
    .from("study_groups")
    .select("owner_id")
    .eq("id", group_id)
    .single()

  if (group?.owner_id === user.id) {
    return {
      error:
        "Als Eigentümer kannst du die Gruppe nicht verlassen. Lösche die Gruppe stattdessen.",
    }
  }

  const { error } = await supabase
    .from("study_group_members")
    .delete()
    .eq("group_id", group_id)
    .eq("user_id", user.id)

  if (error) return { error: "Gruppe konnte nicht verlassen werden." }

  revalidatePath("/gruppen")
  revalidatePath(`/gruppen/${group_id}`)
  return {}
}

export async function deleteGroup(
  group_id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { error } = await supabase
    .from("study_groups")
    .delete()
    .eq("id", group_id)
    .eq("owner_id", user.id)

  if (error) return { error: "Gruppe konnte nicht gelöscht werden." }

  revalidatePath("/gruppen")
  return {}
}

export type GroupSummary = {
  id: string
  name: string
  invite_code: string
  owner_id: string
  created_at: string
  member_count: number
  role: "owner" | "member"
}

export async function getMyGroups(): Promise<GroupSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: myMemberships } = await supabase
    .from("study_group_members")
    .select("group_id")
    .eq("user_id", user.id)

  const groupIds = myMemberships?.map((m) => m.group_id) ?? []
  if (!groupIds.length) return []

  const { data: groups } = await supabase
    .from("study_groups")
    .select("id, name, invite_code, owner_id, created_at")
    .in("id", groupIds)
    .order("created_at", { ascending: false })

  const { data: allMembers } = await supabase
    .from("study_group_members")
    .select("group_id")
    .in("group_id", groupIds)

  const countMap = (allMembers ?? []).reduce(
    (acc, m) => {
      acc[m.group_id] = (acc[m.group_id] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (groups ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    invite_code: g.invite_code,
    owner_id: g.owner_id,
    created_at: g.created_at,
    member_count: countMap[g.id] ?? 0,
    role: g.owner_id === user.id ? "owner" : "member",
  }))
}

export type GroupMember = {
  user_id: string
  joined_at: string
}

export type ContributionCount = {
  contributor_id: string
  count: number
}

export type GroupDetail = {
  id: string
  name: string
  invite_code: string
  owner_id: string
  created_at: string
  members: GroupMember[]
  contribution_counts: ContributionCount[]
  is_owner: boolean
  member_count: number
}

// ─── Phase-2 types ────────────────────────────────────────────────────────────

export type SubmitItem = {
  source_type: "flashcard" | "exam_question"
  source_id: string
  preview_question: string
}

export type CardForSubmission = {
  id: string
  source_type: "flashcard" | "exam_question"
  preview_question: string
  already_submitted: boolean
}

export type SectionForSubmission = {
  id: string
  title: string
  cards: CardForSubmission[]
}

export type BlockForSubmission = {
  id: string
  name: string
  exam_name: string
  sections: SectionForSubmission[]
}

export type ContributionForGroup = {
  id: string
  source_type: string
  source_id: string
  preview_question: string
  block_name: string
  section_title: string
  card_data: Json
  created_at: string
}

export type ContributorGroup = {
  contributor_id: string
  contributions: ContributionForGroup[]
  unadopted_count: number
}

export type AdoptResult = {
  error?: string
  exam_id?: string
  cards_adopted?: number
  blocks_created?: number
}

// ─── submitContributions ─────────────────────────────────────────────────────

export async function submitContributions(
  group_id: string,
  items: SubmitItem[]
): Promise<{ error?: string }> {
  if (!items.length) return {}
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  type CardMeta = { block_name: string; section_title: string; card_data: Json }
  const metaMap = new Map<string, CardMeta>()

  const flashcardIds = items
    .filter((i) => i.source_type === "flashcard")
    .map((i) => i.source_id)

  if (flashcardIds.length) {
    const { data: cards } = await supabase
      .from("flashcards")
      .select("id, question, answer, section_id")
      .in("id", flashcardIds)

    const sectionIds = [...new Set((cards ?? []).map((c) => c.section_id))]
    const { data: sections } = await supabase
      .from("sections")
      .select("id, title, summary_id")
      .in("id", sectionIds)

    const summaryIds = [...new Set((sections ?? []).map((s) => s.summary_id))]
    const { data: summaries } = await supabase
      .from("summaries")
      .select("id, block_id")
      .in("id", summaryIds)

    const blockIds = [...new Set((summaries ?? []).map((s) => s.block_id))]
    const { data: blocks } = await supabase
      .from("blocks")
      .select("id, name")
      .in("id", blockIds)

    const sectionMap = new Map((sections ?? []).map((s) => [s.id, s]))
    const summaryMap = new Map((summaries ?? []).map((s) => [s.id, s]))
    const blockMap = new Map((blocks ?? []).map((b) => [b.id, b]))

    for (const card of cards ?? []) {
      const section = sectionMap.get(card.section_id)
      const summary = section ? summaryMap.get(section.summary_id) : null
      const block = summary ? blockMap.get(summary.block_id) : null
      metaMap.set(card.id, {
        block_name: block?.name ?? "",
        section_title: section?.title ?? "",
        card_data: { type: "flashcard", question: card.question, answer: card.answer },
      })
    }
  }

  const questionIds = items
    .filter((i) => i.source_type === "exam_question")
    .map((i) => i.source_id)

  if (questionIds.length) {
    const { data: questions } = await supabase
      .from("exam_questions")
      .select("id, question_type, question_data, answer_data, section_id")
      .in("id", questionIds)

    const sectionIds = [...new Set((questions ?? []).map((q) => q.section_id))]
    const { data: sections } = await supabase
      .from("sections")
      .select("id, title, summary_id")
      .in("id", sectionIds)

    const summaryIds = [...new Set((sections ?? []).map((s) => s.summary_id))]
    const { data: summaries } = await supabase
      .from("summaries")
      .select("id, block_id")
      .in("id", summaryIds)

    const blockIds = [...new Set((summaries ?? []).map((s) => s.block_id))]
    const { data: blocks } = await supabase
      .from("blocks")
      .select("id, name")
      .in("id", blockIds)

    const sectionMap = new Map((sections ?? []).map((s) => [s.id, s]))
    const summaryMap = new Map((summaries ?? []).map((s) => [s.id, s]))
    const blockMap = new Map((blocks ?? []).map((b) => [b.id, b]))

    for (const q of questions ?? []) {
      const section = sectionMap.get(q.section_id)
      const summary = section ? summaryMap.get(section.summary_id) : null
      const block = summary ? blockMap.get(summary.block_id) : null
      metaMap.set(q.id, {
        block_name: block?.name ?? "",
        section_title: section?.title ?? "",
        card_data: {
          type: "exam_question",
          question_type: q.question_type,
          question_data: q.question_data,
          answer_data: q.answer_data,
        },
      })
    }
  }

  const rows = items.map((item) => {
    const meta = metaMap.get(item.source_id)
    return {
      group_id,
      contributor_id: user.id,
      source_type: item.source_type,
      source_id: item.source_id,
      preview_question: item.preview_question,
      block_name: meta?.block_name ?? "",
      section_title: meta?.section_title ?? "",
      card_data: meta?.card_data ?? ({} as Json),
    }
  })

  const { error } = await supabase.from("contributions").insert(rows)
  if (error) return { error: "Beiträge konnten nicht gespeichert werden." }

  revalidatePath(`/gruppen/${group_id}`)
  return {}
}

// ─── getMyCardsForSubmission ─────────────────────────────────────────────────

export async function getMyCardsForSubmission(
  group_id: string
): Promise<BlockForSubmission[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: existingContribs } = await supabase
    .from("contributions")
    .select("source_id, source_type")
    .eq("group_id", group_id)
    .eq("contributor_id", user.id)

  const submittedSet = new Set(
    (existingContribs ?? []).map((c) => `${c.source_type}:${c.source_id}`)
  )

  const { data: exams } = await supabase
    .from("exams")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true })

  if (!exams?.length) return []
  const examIds = exams.map((e) => e.id)

  const { data: blocks } = await supabase
    .from("blocks")
    .select("id, name, exam_id")
    .in("exam_id", examIds)
    .order("name", { ascending: true })

  if (!blocks?.length) return []
  const blockIds = blocks.map((b) => b.id)

  const { data: summaries } = await supabase
    .from("summaries")
    .select("id, block_id")
    .in("block_id", blockIds)

  if (!summaries?.length) return []
  const summaryIds = summaries.map((s) => s.id)

  const { data: sections } = await supabase
    .from("sections")
    .select("id, title, summary_id")
    .in("summary_id", summaryIds)

  if (!sections?.length) return []
  const sectionIds = sections.map((s) => s.id)

  const [{ data: flashcards }, { data: examQuestions }] = await Promise.all([
    supabase
      .from("flashcards")
      .select("id, question, section_id")
      .in("section_id", sectionIds),
    supabase
      .from("exam_questions")
      .select("id, question_data, question_type, section_id")
      .in("section_id", sectionIds),
  ])

  const examMap = new Map(exams.map((e) => [e.id, e]))

  const summaryByBlock = new Map<string, string[]>()
  for (const s of summaries) {
    const arr = summaryByBlock.get(s.block_id) ?? []
    arr.push(s.id)
    summaryByBlock.set(s.block_id, arr)
  }

  const sectionsBySummary = new Map<string, typeof sections>()
  for (const s of sections) {
    const arr = sectionsBySummary.get(s.summary_id) ?? []
    arr.push(s)
    sectionsBySummary.set(s.summary_id, arr)
  }

  const flashcardsBySection = new Map<string, CardForSubmission[]>()
  for (const fc of flashcards ?? []) {
    const arr = flashcardsBySection.get(fc.section_id) ?? []
    arr.push({
      id: fc.id,
      source_type: "flashcard",
      preview_question: fc.question,
      already_submitted: submittedSet.has(`flashcard:${fc.id}`),
    })
    flashcardsBySection.set(fc.section_id, arr)
  }

  const questionsBySection = new Map<string, CardForSubmission[]>()
  for (const eq of examQuestions ?? []) {
    const qData = eq.question_data as {
      question?: string
      statement?: string
      text_with_blanks?: string
      instruction?: string
    }
    const preview =
      qData.question ??
      qData.statement ??
      qData.text_with_blanks ??
      qData.instruction ??
      "Frage"
    const arr = questionsBySection.get(eq.section_id) ?? []
    arr.push({
      id: eq.id,
      source_type: "exam_question",
      preview_question: preview,
      already_submitted: submittedSet.has(`exam_question:${eq.id}`),
    })
    questionsBySection.set(eq.section_id, arr)
  }

  const result: BlockForSubmission[] = []

  for (const block of blocks) {
    const exam = examMap.get(block.exam_id)
    if (!exam) continue

    const blockSummaryIds = summaryByBlock.get(block.id) ?? []

    const sectionMerge = new Map<string, { title: string; cards: CardForSubmission[] }>()

    for (const summaryId of blockSummaryIds) {
      for (const section of sectionsBySummary.get(summaryId) ?? []) {
        const titleKey = section.title.toLowerCase().trim()
        const cards = [
          ...(flashcardsBySection.get(section.id) ?? []),
          ...(questionsBySection.get(section.id) ?? []),
        ]
        if (!cards.length) continue
        const existing = sectionMerge.get(titleKey)
        if (existing) {
          existing.cards.push(...cards)
        } else {
          sectionMerge.set(titleKey, { title: section.title, cards })
        }
      }
    }

    if (!sectionMerge.size) continue

    result.push({
      id: block.id,
      name: block.name,
      exam_name: exam.name,
      sections: Array.from(sectionMerge.entries()).map(([titleKey, s], i) => ({
        id: `${block.id}_${titleKey}_${i}`,
        title: s.title,
        cards: s.cards,
      })),
    })
  }

  return result
}

// ─── getContributionsForGroup ─────────────────────────────────────────────────

export async function getContributionsForGroup(
  group_id: string
): Promise<ContributorGroup[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: contributions } = await supabase
    .from("contributions")
    .select(
      "id, contributor_id, source_type, source_id, preview_question, block_name, section_title, card_data, created_at"
    )
    .eq("group_id", group_id)
    .order("created_at", { ascending: true })

  if (!contributions?.length) return []

  const contribIds = contributions.map((c) => c.id)
  const [{ data: adoptedFlashcards }, { data: adoptedQuestions }] = await Promise.all([
    supabase
      .from("flashcards")
      .select("source_contribution_id")
      .in("source_contribution_id", contribIds),
    supabase
      .from("exam_questions")
      .select("source_contribution_id")
      .in("source_contribution_id", contribIds),
  ])

  const adoptedSet = new Set<string>([
    ...(adoptedFlashcards ?? [])
      .map((f) => f.source_contribution_id)
      .filter((id): id is string => id !== null),
    ...(adoptedQuestions ?? [])
      .map((q) => q.source_contribution_id)
      .filter((id): id is string => id !== null),
  ])

  const groupMap = new Map<string, ContributorGroup>()

  for (const c of contributions) {
    let group = groupMap.get(c.contributor_id)
    if (!group) {
      group = { contributor_id: c.contributor_id, contributions: [], unadopted_count: 0 }
      groupMap.set(c.contributor_id, group)
    }
    group.contributions.push({
      id: c.id,
      source_type: c.source_type,
      source_id: c.source_id,
      preview_question: c.preview_question,
      block_name: c.block_name,
      section_title: c.section_title,
      card_data: c.card_data,
      created_at: c.created_at,
    })
    if (!adoptedSet.has(c.id)) {
      group.unadopted_count++
    }
  }

  return Array.from(groupMap.values())
}

// ─── adoptAllAsNewExam ───────────────────────────────────────────────────────

export async function adoptAllAsNewExam(
  group_id: string,
  contributor_id: string,
  new_exam_name: string
): Promise<AdoptResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: contributions } = await supabase
    .from("contributions")
    .select("id, source_type, block_name, section_title, card_data")
    .eq("group_id", group_id)
    .eq("contributor_id", contributor_id)

  if (!contributions?.length) return { error: "Keine Beiträge gefunden." }

  // Group by block_name → sectionTitleKey → cards
  const blockMap = new Map<string, Map<string, { title: string; contribs: typeof contributions }>>()
  for (const c of contributions) {
    let sectionMap = blockMap.get(c.block_name)
    if (!sectionMap) {
      sectionMap = new Map()
      blockMap.set(c.block_name, sectionMap)
    }
    const titleKey = c.section_title.toLowerCase().trim()
    const existing = sectionMap.get(titleKey)
    if (existing) {
      existing.contribs.push(c)
    } else {
      sectionMap.set(titleKey, { title: c.section_title, contribs: [c] })
    }
  }

  const blockNames = Array.from(blockMap.keys())
  const weightCounts = largestRemainder(
    blockNames.map((name) => ({ blockId: name, weight: 1 })),
    100
  )
  const weightMap = new Map(weightCounts.map((w) => [w.blockId, w.count]))

  const { data: exam, error: examError } = await supabase
    .from("exams")
    .insert({ name: new_exam_name.trim(), user_id: user.id })
    .select("id")
    .single()

  if (examError || !exam) return { error: "Klausur konnte nicht erstellt werden." }

  let totalCards = 0

  for (const [blockName, sectionMap] of blockMap) {
    const { data: block, error: blockError } = await supabase
      .from("blocks")
      .insert({
        exam_id: exam.id,
        name: blockName,
        weight_percent: weightMap.get(blockName) ?? Math.floor(100 / blockNames.length),
      })
      .select("id")
      .single()

    if (blockError || !block) continue

    const sectionCount = sectionMap.size

    const { data: summary, error: summaryError } = await supabase
      .from("summaries")
      .insert({
        block_id: block.id,
        filename: `${blockName} (übernommen)`,
        storage_path: "",
        processing_status: "completed",
        sections_processed: sectionCount,
        sections_total: sectionCount,
      })
      .select("id")
      .single()

    if (summaryError || !summary) continue

    let sortOrder = 0
    for (const { title, contribs } of sectionMap.values()) {
      const { data: section, error: sectionError } = await supabase
        .from("sections")
        .insert({
          summary_id: summary.id,
          title,
          content_text: "",
          sort_order: sortOrder++,
        })
        .select("id")
        .single()

      if (sectionError || !section) continue

      for (const contrib of contribs) {
        const cd = contrib.card_data as {
          type: string
          question?: string
          answer?: string
          question_type?: string
          question_data?: Json
          answer_data?: Json
        }

        if (cd.type === "flashcard") {
          const { error } = await supabase.from("flashcards").insert({
            section_id: section.id,
            question: cd.question ?? "",
            answer: cd.answer ?? "",
            is_user_created: false,
            source_contribution_id: contrib.id,
          })
          if (!error) totalCards++
        } else if (cd.type === "exam_question") {
          const { error } = await supabase.from("exam_questions").insert({
            section_id: section.id,
            question_type:
              (cd.question_type as Database["public"]["Enums"]["question_type"]) ?? "mc",
            question_data: cd.question_data ?? {},
            answer_data: cd.answer_data ?? {},
            is_user_created: false,
            source_contribution_id: contrib.id,
          })
          if (!error) totalCards++
        }
      }
    }
  }

  revalidatePath(`/gruppen/${group_id}`)
  revalidatePath("/klausuren")
  return { exam_id: exam.id, cards_adopted: totalCards, blocks_created: blockNames.length }
}

// ─── adoptSelective ──────────────────────────────────────────────────────────

export async function adoptSelective(
  items: { contribution_id: string }[],
  target_exam_id: string,
  target_block_id: string
): Promise<AdoptResult> {
  if (!items.length) return { error: "Keine Karten ausgewählt." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: targetExam } = await supabase
    .from("exams")
    .select("id")
    .eq("id", target_exam_id)
    .eq("user_id", user.id)
    .single()

  if (!targetExam) return { error: "Klausur nicht gefunden." }

  const { data: targetBlock } = await supabase
    .from("blocks")
    .select("id")
    .eq("id", target_block_id)
    .eq("exam_id", target_exam_id)
    .single()

  if (!targetBlock) return { error: "Block nicht gefunden." }

  const contribIds = items.map((i) => i.contribution_id)
  const { data: contributions } = await supabase
    .from("contributions")
    .select("id, source_type, section_title, card_data")
    .in("id", contribIds)

  if (!contributions?.length) return { error: "Beiträge nicht gefunden." }

  // Get existing summaries + sections for the target block
  const { data: rawSummaries } = await supabase
    .from("summaries")
    .select("id, storage_path")
    .eq("block_id", target_block_id)

  const existingSummaryIds = (rawSummaries ?? []).map((s) => s.id)
  const { data: existingSections } = existingSummaryIds.length
    ? await supabase
        .from("sections")
        .select("id, title, summary_id")
        .in("summary_id", existingSummaryIds)
    : { data: [] as { id: string; title: string; summary_id: string }[] }

  const sectionTitleMap = new Map<string, string>()
  for (const s of existingSections ?? []) {
    const key = s.title.toLowerCase().trim()
    if (!sectionTitleMap.has(key)) sectionTitleMap.set(key, s.id)
  }

  let adoptionSummaryId =
    (rawSummaries ?? []).find((s) => s.storage_path === "")?.id ?? null

  if (!adoptionSummaryId) {
    const { data: newSummary } = await supabase
      .from("summaries")
      .insert({
        block_id: target_block_id,
        filename: "Übernommene Karten",
        storage_path: "",
        processing_status: "completed",
        sections_processed: 0,
        sections_total: 0,
      })
      .select("id")
      .single()
    adoptionSummaryId = newSummary?.id ?? null
  }

  if (!adoptionSummaryId) return { error: "Fehler beim Erstellen der Zusammenfassung." }

  // Group contributions by section_title
  const sectionContribMap = new Map<string, { title: string; contribs: typeof contributions }>()
  for (const c of contributions) {
    const key = c.section_title.toLowerCase().trim()
    const existing = sectionContribMap.get(key)
    if (existing) {
      existing.contribs.push(c)
    } else {
      sectionContribMap.set(key, { title: c.section_title, contribs: [c] })
    }
  }

  let totalCards = 0

  for (const [titleKey, { title, contribs }] of sectionContribMap) {
    let sectionId = sectionTitleMap.get(titleKey)

    if (!sectionId) {
      const { data: newSection } = await supabase
        .from("sections")
        .insert({
          summary_id: adoptionSummaryId,
          title,
          content_text: "",
          sort_order: sectionTitleMap.size,
        })
        .select("id")
        .single()
      sectionId = newSection?.id
      if (sectionId) sectionTitleMap.set(titleKey, sectionId)
    }

    if (!sectionId) continue

    for (const contrib of contribs) {
      const cd = contrib.card_data as {
        type: string
        question?: string
        answer?: string
        question_type?: string
        question_data?: Json
        answer_data?: Json
      }

      if (cd.type === "flashcard") {
        const { error } = await supabase.from("flashcards").insert({
          section_id: sectionId,
          question: cd.question ?? "",
          answer: cd.answer ?? "",
          is_user_created: false,
          source_contribution_id: contrib.id,
        })
        if (!error) totalCards++
      } else if (cd.type === "exam_question") {
        const { error } = await supabase.from("exam_questions").insert({
          section_id: sectionId,
          question_type:
            (cd.question_type as Database["public"]["Enums"]["question_type"]) ?? "mc",
          question_data: cd.question_data ?? {},
          answer_data: cd.answer_data ?? {},
          is_user_created: false,
          source_contribution_id: contrib.id,
        })
        if (!error) totalCards++
      }
    }
  }

  revalidatePath("/klausuren")
  return { cards_adopted: totalCards }
}

// ─── getGroupDetail (original) ────────────────────────────────────────────────

export async function getGroupDetail(
  group_id: string
): Promise<GroupDetail | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: group } = await supabase
    .from("study_groups")
    .select("id, name, invite_code, owner_id, created_at")
    .eq("id", group_id)
    .single()

  if (!group) return null

  const { data: members } = await supabase
    .from("study_group_members")
    .select("user_id, joined_at")
    .eq("group_id", group_id)
    .order("joined_at", { ascending: true })

  const { data: contributions } = await supabase
    .from("contributions")
    .select("contributor_id")
    .eq("group_id", group_id)

  const countMap = new Map<string, number>()
  for (const c of contributions ?? []) {
    countMap.set(c.contributor_id, (countMap.get(c.contributor_id) ?? 0) + 1)
  }

  const memberList = members ?? []

  return {
    id: group.id,
    name: group.name,
    invite_code: group.invite_code,
    owner_id: group.owner_id,
    created_at: group.created_at,
    members: memberList,
    contribution_counts: Array.from(countMap.entries()).map(
      ([contributor_id, count]) => ({ contributor_id, count })
    ),
    is_owner: group.owner_id === user.id,
    member_count: memberList.length,
  }
}
