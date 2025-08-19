-- Add missing submission status values
ALTER TYPE submission_status ADD VALUE 'pending';
ALTER TYPE submission_status ADD VALUE 'qa_flag';