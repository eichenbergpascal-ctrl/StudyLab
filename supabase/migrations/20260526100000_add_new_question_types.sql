-- Add three new question types
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'true_false';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'ordering';
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'calculation';
