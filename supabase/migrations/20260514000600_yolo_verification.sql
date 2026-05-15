-- Backend YOLO + Gemini verification metadata.
alter table public.reports
  add column if not exists yolo_result jsonb,
  add column if not exists ai_analysis jsonb;

-- Status values now include 'Rejected' (YOLO did not detect the claimed category).
-- The reports.status column is a free text, so no enum migration needed.
