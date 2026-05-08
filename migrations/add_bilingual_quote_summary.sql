-- ════════════════════════════════════════════════════════
-- H-2（v6）：剩余单语字段双语化
-- 在 Supabase Dashboard → SQL Editor 执行（IF NOT EXISTS 幂等）
-- ════════════════════════════════════════════════════════

-- healers 表：引言来源说明（quote_context）补英文版
ALTER TABLE healers ADD COLUMN IF NOT EXISTS quote_context_en TEXT DEFAULT '';

-- content 表：摘要（summary）补英文版
ALTER TABLE content ADD COLUMN IF NOT EXISTS summary_en TEXT DEFAULT '';

-- 注：services / events / certifications 三个 JSONB 列的双语扩展
-- 不需要改 schema —— JSONB 是无 schema 的，admin 直接写新字段
-- description_zh / description_en / location_zh / location_en /
-- name_zh / name_en 即可，老数据 fallback 由前后台兼容代码处理。
