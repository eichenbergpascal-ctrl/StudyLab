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

export interface TrueFalseQuestionData {
  statement: string
}

export interface TrueFalseAnswerData {
  is_true: boolean
  explanation: string
}

export interface OrderingQuestionData {
  instruction: string
  items: string[]
}

// items are stored in correct order; correct_order is always [0,1,2,...]
export interface OrderingAnswerData {
  correct_order: number[]
  explanation: string
}

export interface CalculationQuestionData {
  question: string
  formula_hint?: string
}

export interface CalculationAnswerData {
  correct_value: number
  tolerance?: number
  unit?: string
  solution_steps: string[]
  explanation: string
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
  | {
      id: string
      section_id: string
      question_type: "true_false"
      question_data: TrueFalseQuestionData
      answer_data: TrueFalseAnswerData
    }
  | {
      id: string
      section_id: string
      question_type: "ordering"
      question_data: OrderingQuestionData
      answer_data: OrderingAnswerData
    }
  | {
      id: string
      section_id: string
      question_type: "calculation"
      question_data: CalculationQuestionData
      answer_data: CalculationAnswerData
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
    case "true_false":
      return {
        ...base,
        question_type: "true_false",
        question_data: row.question_data as unknown as TrueFalseQuestionData,
        answer_data: row.answer_data as unknown as TrueFalseAnswerData,
      }
    case "ordering":
      return {
        ...base,
        question_type: "ordering",
        question_data: row.question_data as unknown as OrderingQuestionData,
        answer_data: row.answer_data as unknown as OrderingAnswerData,
      }
    case "calculation":
      return {
        ...base,
        question_type: "calculation",
        question_data: row.question_data as unknown as CalculationQuestionData,
        answer_data: row.answer_data as unknown as CalculationAnswerData,
      }
  }
}
