-- 给 homepage 表添加视频字段
-- 在 Supabase Dashboard → SQL Editor 中执行
ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_video_url TEXT DEFAULT '';
ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_poster_url TEXT DEFAULT '';
