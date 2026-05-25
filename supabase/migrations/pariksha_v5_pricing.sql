-- Pariksha v5 — sticker price for discount display.
--
-- `fee` is what the candidate actually pays (0 = free exam).
-- `original_fee` (optional) is the marketed sticker price. When set and greater
-- than `fee`, the storefront renders it struck through next to the live price
-- so the discount is visible.
alter table public.exams
  add column if not exists original_fee int;
