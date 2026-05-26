-- Add start_page and end_page to sections for PDF deep linking
ALTER TABLE sections ADD COLUMN start_page int;
ALTER TABLE sections ADD COLUMN end_page int;

-- Add updated_at to summaries for tracking annotated PDF replacements
ALTER TABLE summaries ADD COLUMN updated_at timestamptz;
