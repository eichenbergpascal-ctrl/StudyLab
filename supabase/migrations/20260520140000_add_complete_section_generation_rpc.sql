-- Atomically increments sections_processed and finalises the summary status
-- when all sections have been processed (success or failure).
-- Called once per generate-section invocation, regardless of whether generation succeeded.
CREATE OR REPLACE FUNCTION complete_section_generation(p_summary_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_processed int;
  v_total     int;
  v_flashcard_count int;
BEGIN
  UPDATE summaries
  SET sections_processed = sections_processed + 1
  WHERE id = p_summary_id
  RETURNING sections_processed, sections_total INTO v_processed, v_total;

  -- Only set a terminal status once every section has been attempted
  IF v_total IS NOT NULL AND v_processed >= v_total THEN
    SELECT count(*) INTO v_flashcard_count
    FROM flashcards f
    JOIN sections s ON s.id = f.section_id
    WHERE s.summary_id = p_summary_id;

    IF v_flashcard_count > 0 THEN
      UPDATE summaries
      SET processing_status = 'completed'
      WHERE id = p_summary_id;
    ELSE
      UPDATE summaries
      SET processing_status  = 'failed',
          processing_error   = 'Alle Abschnitte konnten nicht verarbeitet werden.'
      WHERE id = p_summary_id;
    END IF;
  END IF;
END;
$$;
