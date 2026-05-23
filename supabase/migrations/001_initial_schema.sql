-- ============================================================
-- StudyLab — Initial Schema Migration
-- ============================================================

-- -------------------------------------------------------
-- 1. Enum Types
-- -------------------------------------------------------

CREATE TYPE processing_status AS ENUM (
  'pending', 'parsing', 'generating', 'completed', 'failed'
);

CREATE TYPE question_type AS ENUM (
  'mc', 'fill_blank', 'matching', 'free_text'
);

CREATE TYPE session_type AS ENUM (
  'flashcard', 'exam', 'error_session'
);

CREATE TYPE exam_session_status AS ENUM (
  'in_progress', 'completed', 'abandoned'
);

-- -------------------------------------------------------
-- 2. Tables
-- -------------------------------------------------------

CREATE TABLE exams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id         uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  name            text NOT NULL,
  weight_percent  int NOT NULL CHECK (weight_percent >= 0 AND weight_percent <= 100),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE summaries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id            uuid NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  filename            text NOT NULL,
  storage_path        text NOT NULL,
  parsed_content      jsonb,
  processing_status   processing_status NOT NULL DEFAULT 'pending',
  processing_error    text,
  sections_total      int,
  sections_processed  int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id    uuid NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  title         text NOT NULL,
  sort_order    int NOT NULL,
  content_text  text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE flashcards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  question        text NOT NULL,
  answer          text NOT NULL,
  is_user_created boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE exam_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id      uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  question_type   question_type NOT NULL,
  question_data   jsonb NOT NULL,
  answer_data     jsonb NOT NULL,
  is_user_created boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE attempts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id      uuid REFERENCES flashcards(id) ON DELETE CASCADE,
  exam_question_id  uuid REFERENCES exam_questions(id) ON DELETE CASCADE,
  is_correct        boolean NOT NULL,
  session_type      session_type NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  -- Mindestens eine der beiden FKs muss gesetzt sein
  CONSTRAINT chk_attempts_has_target CHECK (
    flashcard_id IS NOT NULL OR exam_question_id IS NOT NULL
  )
);

CREATE TABLE exam_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id       uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  block_id      uuid REFERENCES blocks(id) ON DELETE CASCADE,  -- null = Vollklausur
  status        exam_session_status NOT NULL DEFAULT 'in_progress',
  question_ids  jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers       jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

-- -------------------------------------------------------
-- 3. Indexes
-- -------------------------------------------------------

CREATE INDEX idx_exams_user_id ON exams(user_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);

CREATE INDEX idx_attempts_flashcard_latest
  ON attempts(flashcard_id, created_at DESC)
  WHERE flashcard_id IS NOT NULL;

CREATE INDEX idx_attempts_question_latest
  ON attempts(exam_question_id, created_at DESC)
  WHERE exam_question_id IS NOT NULL;

CREATE INDEX idx_attempts_session_type
  ON attempts(user_id, session_type);

CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);

-- -------------------------------------------------------
-- 4. Error Pool View
-- -------------------------------------------------------

CREATE VIEW error_pool AS
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
-- 5. Row Level Security
-- -------------------------------------------------------

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- exams: Direkt über user_id
CREATE POLICY exams_user_policy ON exams
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- blocks: Über exam → user_id
CREATE POLICY blocks_user_policy ON blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = blocks.exam_id AND exams.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM exams WHERE exams.id = blocks.exam_id AND exams.user_id = auth.uid())
  );

-- summaries: Über block → exam → user_id
CREATE POLICY summaries_user_policy ON summaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM blocks
      JOIN exams ON exams.id = blocks.exam_id
      WHERE blocks.id = summaries.block_id AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM blocks
      JOIN exams ON exams.id = blocks.exam_id
      WHERE blocks.id = summaries.block_id AND exams.user_id = auth.uid()
    )
  );

-- sections: Über summary → block → exam → user_id
CREATE POLICY sections_user_policy ON sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM summaries
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE summaries.id = sections.summary_id AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM summaries
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE summaries.id = sections.summary_id AND exams.user_id = auth.uid()
    )
  );

-- flashcards: Über section → summary → block → exam → user_id
CREATE POLICY flashcards_user_policy ON flashcards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = flashcards.section_id AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = flashcards.section_id AND exams.user_id = auth.uid()
    )
  );

-- exam_questions: Gleicher Pfad wie flashcards
CREATE POLICY exam_questions_user_policy ON exam_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = exam_questions.section_id AND exams.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections
      JOIN summaries ON summaries.id = sections.summary_id
      JOIN blocks ON blocks.id = summaries.block_id
      JOIN exams ON exams.id = blocks.exam_id
      WHERE sections.id = exam_questions.section_id AND exams.user_id = auth.uid()
    )
  );

-- attempts: Direkt über user_id
CREATE POLICY attempts_user_policy ON attempts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- exam_sessions: Direkt über user_id
CREATE POLICY exam_sessions_user_policy ON exam_sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -------------------------------------------------------
-- 6. Storage Bucket
-- -------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('summaries', 'summaries', false);

CREATE POLICY storage_summaries_user_policy ON storage.objects
  FOR ALL USING (
    bucket_id = 'summaries' AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'summaries' AND auth.uid()::text = (storage.foldername(name))[1]
  );
