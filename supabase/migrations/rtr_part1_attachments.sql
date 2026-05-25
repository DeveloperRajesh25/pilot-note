-- ============================================================
-- RTR PART 1 — optional image (jpg/png) and PDF attachments
-- Some questions reference diagrams, charts or extracts that
-- must be shown to the candidate inline. Each question can have
-- at most one image and at most one PDF.
--
-- Storage: the upload route writes to a public Supabase Storage
-- bucket named `rtr-question-attachments`. Create it once in the
-- Supabase Studio (Storage → New bucket → Public) before using
-- the admin upload UI.
-- ============================================================

alter table public.rtr_questions_part1
  add column if not exists image_url text,
  add column if not exists pdf_url   text;
