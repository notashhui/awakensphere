-- content 表添加分类字段（首页卡片上的 "MINDFULNESS · 正念冥想" 这种分类标签）
-- 在 Supabase Dashboard → SQL Editor 中执行
ALTER TABLE content ADD COLUMN IF NOT EXISTS category_zh TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN IF NOT EXISTS category_en TEXT DEFAULT '';
