-- ════════════════════════════════════════════════════════
-- 给 healers 加分类系统（按方向筛选 chip）
-- 在 Supabase Dashboard → SQL Editor 执行（IF NOT EXISTS 幂等，重复跑无害）
-- ════════════════════════════════════════════════════════

-- 1. 新建 categories 表
CREATE TABLE IF NOT EXISTS categories (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  label_zh    TEXT NOT NULL,
  label_en    TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. healers 加 category_ids 数组字段（不要多对多关联表）
ALTER TABLE healers ADD COLUMN IF NOT EXISTS category_ids BIGINT[] DEFAULT '{}';

-- 3. RLS（与 healers / content 同模式）
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories anon read active" ON categories;
CREATE POLICY "categories anon read active" ON categories
  FOR SELECT TO anon USING (active = true);

DROP POLICY IF EXISTS "categories authenticated all" ON categories;
CREATE POLICY "categories authenticated all" ON categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. 初始 5 个分类（按 v2 反馈文档 B-6 文案）
INSERT INTO categories (slug, label_zh, label_en, sort_order) VALUES
  ('massage',     '按摩', 'Massage',     1),
  ('mindfulness', '正念', 'Mindfulness', 2),
  ('sound',       '声音', 'Sound',       3),
  ('trauma',      '创伤', 'Trauma',      4),
  ('movement',    '动态', 'Movement',    5)
ON CONFLICT (slug) DO NOTHING;

-- 5. 现有 4 个 healer 按 tags 字段自动映射到 category_ids
--    （映射逻辑参考 healers.html healerCatsFromTags 函数；之后由 admin 后台覆盖）
UPDATE healers SET category_ids = (
  SELECT ARRAY_AGG(id) FROM categories WHERE slug = ANY(ARRAY['massage','mindfulness'])
) WHERE id = 'zoe' AND (category_ids IS NULL OR category_ids = '{}');

UPDATE healers SET category_ids = (
  SELECT ARRAY_AGG(id) FROM categories WHERE slug = ANY(ARRAY['massage','mindfulness'])
) WHERE id = 'carrie' AND (category_ids IS NULL OR category_ids = '{}');

UPDATE healers SET category_ids = (
  SELECT ARRAY_AGG(id) FROM categories WHERE slug = ANY(ARRAY['movement'])
) WHERE id = 'lin' AND (category_ids IS NULL OR category_ids = '{}');

UPDATE healers SET category_ids = (
  SELECT ARRAY_AGG(id) FROM categories WHERE slug = ANY(ARRAY['sound','mindfulness'])
) WHERE id = 'mei' AND (category_ids IS NULL OR category_ids = '{}');

-- 完成。Carrie 之后可在 admin 后台编辑分类，或直接改 healers 表的 category_ids。
