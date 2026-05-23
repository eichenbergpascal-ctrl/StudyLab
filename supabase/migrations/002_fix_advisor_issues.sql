-- ============================================================
-- StudyLab — Fix Advisor Issues (Security + Performance)
-- ============================================================

-- -------------------------------------------------------
-- 1. Fix error_pool View: SECURITY INVOKER statt DEFINER
-- -------------------------------------------------------

DROP VIEW IF EXISTS error_pool;

CREATE VIEW error_pool WITH (security_invoker = true) AS
WITH latest_attempts AS (
  SELECT DISTINCT ON (flashcard_id, exam_question_id)
    id, user_id, flashcard_id, exam_question_id,
    is_correct, session_type, created_at
  FROM attempts
  ORDER BY flashcard_id, exam_question_id, created_at DESC
)
SELECT * FROM latest_attempts
WHERE is_correct = false;

-- -------------------------------------------------------
-- 2. Fix rls_auto_enable() — Revoke public execution
-- (Only exists on hosted Supabase, not locally)
-- -------------------------------------------------------

DO $$ BEGIN
  REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
  REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- -------------------------------------------------------
-- 3. Fix RLS Policies: (SELECT auth.uid()) statt auth.uid()
-- -------------------------------------------------------

-- exams
DROP POLICY IF EXISTS exams_user_policy ON exams;
CREATE POLICY exams_user_policy ON exams
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- blocks
DROP POLICY IF EXISTS blocks_user_policy ON blocks;
CREATE POLICY blocks_user_policy ON blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = blocks.exam_id AND exams.user_id = (SELECT auth.uid()))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = blocks.exam_id AND exams.user_id = (SELECT auth.uid()))
  );

-- summaries
DROP POLICY IF EXISTS summaries_user_policy ON summaries;
CREATE POLICY summaries_user_policy ON summaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM blocks
      JOIN exams ON exams.id = blocks.exam_id
      WHERE blocks.id = summaries.block_id AND exams.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocks
      JOIN exams ON exams.id = blocks.exam_id
      WHERE blocks.id = summaries.block_id AND exams.user_id = (SELECT auth.uid())
    )
  );

-- sections
DROP POLICY IF EXISTS sections_user_policy ON sections;
CREATE POLICY sections_user_policy ON sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM summaries
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE summaries.id = sections.summary_id AND exams.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE summaries.id = sections.summary_id AND exams.user_id = (SELECT auth.uid())
    )
  );

-- flashcards
DROP POLICY IF EXISTS flashcards_user_policy ON flashcards;
CREATE POLICY flashcards_user_policy ON flashcards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = flashcards.section_id AND exams.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = flashcards.section_id AND exams.user_id = (SELECT auth.uid())
    )
  );

-- exam_questions
DROP POLICY IF EXISTS exam_questions_user_policy ON exam_questions;
CREATE POLICY exam_questions_user_policy ON exam_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = exam_questions.section_id AND exams.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = exam_questions.section_id AND exams.user_id = (SELECT auth.uid())
    )
  );

-- attempts
DROP POLICY IF EXISTS attempts_user_policy ON attempts;
CREATE POLICY attempts_user_policy ON attempts
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- exam_sessions
DROP POLICY IF EXISTS exam_sessions_user_policy ON exam_sessions;
CREATE POLICY exam_sessions_user_policy ON exam_sessions
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- -------------------------------------------------------
-- 4. Add missing FK indexes
-- -------------------------------------------------------

CREATE INDEX idx_blocks_exam_id ON blocks(exam_id);
CREATE INDEX idx_summaries_block_id ON summaries(block_id);
CREATE INDEX idx_sections_summary_id ON sections(summary_id);
CREATE INDEX idx_flashcards_section_id ON flashcards(section_id);
CREATE INDEX idx_exam_questions_section_id ON exam_questions(section_id);
CREATE INDEX idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_block_id ON exam_sessions(block_id);
