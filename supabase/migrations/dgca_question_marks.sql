-- ============================================================
-- DGCA PRACTICE — per-question marks
--
-- Adds a `marks` column to dgca_questions so admins can weight each MCQ.
-- Chapter-wise practice has no pass/fail: the result screen simply totals
-- marks scored out of the chapter's total marks.
--
-- Safe to run multiple times (add-column-if-not-exists). Existing rows
-- default to 1 mark each. Run in the Supabase SQL editor.
-- ============================================================

alter table public.dgca_questions
  add column if not exists marks int not null default 1;
