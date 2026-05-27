-- ============================================================
-- StudyLab — Etappe 9.2: Contributions-Metadaten für Übernahme
-- ============================================================

-- Speichert Block- und Section-Kontext beim Einreichen, damit
-- der Adopter keine RLS-fremden Karten lesen muss.
ALTER TABLE contributions
  ADD COLUMN block_name    text NOT NULL DEFAULT '',
  ADD COLUMN section_title text NOT NULL DEFAULT '',
  ADD COLUMN card_data     jsonb NOT NULL DEFAULT '{}';
