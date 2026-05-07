-- ════════════════════════════════════════════════════════
-- 内容架构升级 v1：支持文章 / 播客 / 视频 三格式
-- 在 Supabase Dashboard → SQL Editor 执行（IF NOT EXISTS 幂等）
-- ════════════════════════════════════════════════════════

-- 注：现有 content 表已有 type 字段（article/podcast/video）+ audio_url
-- + podcast_link + duration_zh/en + summary_zh + body_zh/en
-- 本迁移只加 4 个新字段：

ALTER TABLE content ADD COLUMN IF NOT EXISTS audio_embed  TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN IF NOT EXISTS video_embed  TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN IF NOT EXISTS guest_name   TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN IF NOT EXISTS transcript   TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN IF NOT EXISTS publish_date DATE;

-- 完成。前台 article.html 按 content.type 渲染对应模板时使用这些字段。
