-- ============================================================
-- StudyLab — Etappe 9: Lerngruppen-Grundgerüst
-- ============================================================

-- -------------------------------------------------------
-- 1. Neue Tabellen
-- -------------------------------------------------------

CREATE TABLE study_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE study_group_members (
  group_id   uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE contributions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         uuid NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  contributor_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type      text NOT NULL CHECK (source_type IN ('flashcard', 'exam_question')),
  source_id        uuid NOT NULL,
  preview_question text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- -------------------------------------------------------
-- 2. Neue Spalten auf bestehenden Tabellen
-- -------------------------------------------------------

ALTER TABLE flashcards    ADD COLUMN source_contribution_id uuid;
ALTER TABLE exam_questions ADD COLUMN source_contribution_id uuid;

-- -------------------------------------------------------
-- 3. Hilfsfunktionen (SECURITY DEFINER bricht RLS-Rekursion)
-- -------------------------------------------------------

-- Prüft, ob auth.uid() Mitglied einer Gruppe ist (für RLS-Policies)
CREATE OR REPLACE FUNCTION public.is_study_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM study_group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$;

-- Gibt die Gruppen-ID für einen invite_code zurück (bypass RLS für Beitrittsflow)
CREATE OR REPLACE FUNCTION public.get_group_id_by_invite_code(p_invite_code text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM study_groups WHERE invite_code = p_invite_code;
$$;

-- Gibt Gruppen-Preview für die Beitrittsseite zurück (bypass RLS, kein invite_code im Output)
CREATE OR REPLACE FUNCTION public.get_group_preview_by_invite_code(p_invite_code text)
RETURNS TABLE (id uuid, name text, member_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    sg.id,
    sg.name,
    COUNT(sgm.user_id)::bigint AS member_count
  FROM study_groups sg
  LEFT JOIN study_group_members sgm ON sgm.group_id = sg.id
  WHERE sg.invite_code = p_invite_code
  GROUP BY sg.id, sg.name;
$$;

-- -------------------------------------------------------
-- 4. Indexes
-- -------------------------------------------------------

CREATE INDEX idx_contributions_group_id ON contributions(group_id, created_at DESC);

-- -------------------------------------------------------
-- 5. Row Level Security
-- -------------------------------------------------------

ALTER TABLE study_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions       ENABLE ROW LEVEL SECURITY;

-- study_groups: Owner kann alles
CREATE POLICY study_groups_owner_all ON study_groups
  FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- study_groups: Mitglieder können lesen
CREATE POLICY study_groups_member_select ON study_groups
  FOR SELECT USING (is_study_group_member(id));

-- study_group_members: Alle Mitglieder einer Gruppe sehen die gesamte Memberliste
CREATE POLICY study_group_members_select ON study_group_members
  FOR SELECT USING (is_study_group_member(group_id));

-- study_group_members: Nutzer können sich selbst eintragen
CREATE POLICY study_group_members_insert ON study_group_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- study_group_members: Nutzer können ihre eigene Membership löschen
CREATE POLICY study_group_members_delete ON study_group_members
  FOR DELETE USING (user_id = auth.uid());

-- contributions: Mitglieder der Gruppe können lesen
CREATE POLICY contributions_member_select ON contributions
  FOR SELECT USING (is_study_group_member(group_id));

-- contributions: Contributor kann Beiträge einstellen
CREATE POLICY contributions_contributor_insert ON contributions
  FOR INSERT WITH CHECK (contributor_id = auth.uid());

-- contributions: Contributor kann eigene Beiträge löschen
CREATE POLICY contributions_contributor_delete ON contributions
  FOR DELETE USING (contributor_id = auth.uid());
