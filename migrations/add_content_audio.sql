-- content 表补齐音频字段（admin 保存 content 需要这 2 列）
-- 在 Supabase Dashboard → SQL Editor 中执行
ALTER TABLE content ADD COLUMN IF NOT EXISTS audio_url TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN IF NOT EXISTS podcast_link TEXT DEFAULT '';
