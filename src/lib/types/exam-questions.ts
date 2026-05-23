import type { Tables } from "@/lib/database.types"

// ---- Raw DB row type -------------------------------------------------------

export type ExamQuestionRow = Tables<"exam_questions">

// ---- Parsed JSONB shapes ----------------------------------------------------

export interface McQuestionData {
  question: string
  options: string[]
}

export interface McAnswerData {
  correct_index: number
  explanation: string
}

export interface FillBlankQuestionData {
  text_with_blanks: string
  blanks_count: number
}

export interface FillBlankAnswerData {
  blanks: string[]
  explanation: string
}

export interface MatchingQuestionData {
  left: string[]
  right: string[]
}

export interface MatchingAnswerData {
  mapping: number[]
  explanation: string
}

export interface FreeTextQuestionData {
  question: string
}

export interface FreeTextAnswerData {
  sample_answer: string
  key_points: string[]
}

// ---- Discriminated union for a fully-typed question ------------------------

export type TypedExamQuestion =
  | {
      id: string
      section_id: string
      question_type: "mc"
      question_data: McQuestionData
      answer_data: McAnswerData
    }
  | {
      id: string
      section_id: string
      question_type: "fill_blank"
      question_data: FillBlankQuestionData
      answer_data: FillBlankAnswerData
    }
  | {
      id: string
      section_id: string
      question_type: "matching"
      question_data: MatchingQuestionData
      answer_data: MatchingAnswerData
    }
  | {
      id: string
      section_id: string
      question_type: "free_text"
      question_data: FreeTextQuestionData
      answer_data: FreeTextAnswerData
    }

// ---- Session answer format --------------------------------------------------

export interface SessionAnswer {
  response: unknown
  is_correct: boolean
}

export type SessionAnswers = Record<string, SessionAnswer>

// ---- Parser helper ----------------------------------------------------------

export function parseExamQuestion(row: ExamQuestionRow): TypedExamQuestion {
  const base = { id: row.id, section_id: row.section_id }
  switch (row.question_type) {
    case "mc":
      return {
        ...base,
        question_type: "mc",
        question_data: row.question_data as unknown as McQuestionData,
        answer_data: row.answer_data as unknown as McAnswerData,
      }
    case "fill_blank":
      return {
        ...base,
        question_type: "fill_blank",
        question_data: row.question_data as unknown as FillBlankQuestionData,
        answer_data: row.answer_data as unknown as FillBlankAnswerData,
      }
    case "matching":
      return {
        ...base,
        question_type: "matching",
        question_data: row.question_data as unknown as MatchingQuestionData,
        answer_data: row.answer_data as unknown as MatchingAnswerData,
      }
    case "free_text":
      return {
        ...base,
        question_type: "free_text",
        question_data: row.question_data as unknown as FreeTextQuestionData,
        answer_data: row.answer_data as unknown as FreeTextAnswerData,
      }
  }
}
