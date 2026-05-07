-- ════════════════════════════════════════════════════════
-- C-7：给 healers 加第三个职称字段（方案 A）
-- 在 Supabase Dashboard → SQL Editor 执行
-- ════════════════════════════════════════════════════════

ALTER TABLE healers ADD COLUMN IF NOT EXISTS title_extra_zh TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS title_extra_en TEXT DEFAULT '';
