-- ════════════════════════════════════════════════════════
-- F-5（v5）：healer 头像多比例字段
-- 在 Supabase Dashboard → SQL Editor 执行（IF NOT EXISTS 幂等）
-- ════════════════════════════════════════════════════════

-- 现有 avatar_url 保留作"方形 1:1"（默认 fallback）
-- 新加横版（4:3，首页卡片用）+ 竖版（3:4，详情页用）

ALTER TABLE healers ADD COLUMN IF NOT EXISTS avatar_landscape TEXT DEFAULT '';
ALTER TABLE healers ADD COLUMN IF NOT EXISTS avatar_portrait  TEXT DEFAULT '';

-- 上传流程：admin 让 Carrie 选一张原图后，依次裁三次（1:1/4:3/3:4），
-- 各自上传 Cloudinary 后写入对应字段；前台不同位置使用对应字段，
-- 缺失则 fallback 到 avatar_url（1:1）。
