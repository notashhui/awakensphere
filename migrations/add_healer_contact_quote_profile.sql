-- ════════════════════════════════════════════════════════
-- 给 healers 表加：联系方式 + 特色引言 + 个人档案 字段
-- 对应 v2 反馈文档 C-3 / C-9 / C-10
-- 在 Supabase Dashboard → SQL Editor 执行（IF NOT EXISTS 幂等）
-- ════════════════════════════════════════════════════════

-- ─── C-3：联系方式（5 个，前台按钮根据是否有值决定显示）───
ALTER TABLE healers ADD COLUMN IF NOT EXISTS wechat          TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS whatsapp        TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS email           TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS xiaohongshu_url TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS booking_url     TEXT DEFAULT '';

-- ─── C-9：特色引言（详情页底部大引言区，原硬编码）───
ALTER TABLE healers ADD COLUMN IF NOT EXISTS featured_quote_zh TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS featured_quote_en TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS quote_context     TEXT DEFAULT '';

-- ─── C-10：档案面板（详情页左侧"来自/认证/语言/执业"，原硬编码）───
ALTER TABLE healers ADD COLUMN IF NOT EXISTS origin_city     TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS nationality     TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS birth_year      INT;
ALTER TABLE healers ADD COLUMN IF NOT EXISTS certifications  JSONB DEFAULT '[]';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS languages       TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS practice_since  INT;

-- 完成。Carrie 之后在 admin 后台编辑这些字段，前台 healer.html 自动渲染。
-- certifications JSONB 格式：[{"name":"Esalen®","year":"2022"}, {"name":"Aromatherapy","year":"2018"}]
-- languages 文本格式：用 · 或逗号分隔，如 "中 · EN · FR"
