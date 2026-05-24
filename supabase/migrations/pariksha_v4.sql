-- Pariksha v4 — exam_attempts.marked_for_review
--
-- Stores question IDs the candidate has flagged for review during the live
-- exam window. Persisted via /api/exams/[examId]/heartbeat so that the flag
-- state survives refreshes and resumes alongside answers + current_question_index.
alter table public.exam_attempts
  add column if not exists marked_for_review jsonb not null default '[]'::jsonb;
