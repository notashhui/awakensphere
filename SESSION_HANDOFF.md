# AwakenSphere — Session Handoff 状态文档

> 用途：给下一个 AI 会话的"上下文摘要"，避免重新累积长对话历史。
> 最后更新：2026 年 5 月（v6 第一批完成后）

---

## 一句话项目状态

**awakens.life** 是 Carrie Yang 的中文疗愈平台，纯静态 HTML/CSS/JS（无构建），数据从 Supabase 直读，图片/音频/视频走 Cloudinary CDN，Netlify push main 自动部署。**当前在生产，Supabase 已升 Pro，前后台架构稳定。** Carrie 通过 admin.html 自助管理所有内容。

---

## 关键文件 / 位置

```
index.html        首页（hero + 内容探索 + 疗愈师横幅 + 创始人寄语 + footer）
healers.html      疗愈师目录页（卡片网格 + 主题筛选 chip + 搜索）
healer.html       疗愈师详情页（按 ?id=xxx 单文件多模板 — article/podcast/video 共用）
article.html      内容详情页（按 type 切换 markdown/audio iframe/video iframe）
quiz.html         自我了解问卷
admin.html        管理后台（侧边栏 + 各模块 + Cropper.js 裁图）
js/common.js      共享：Supabase 客户端 + applyLang + sbCache（10 分钟 localStorage TTL）
css/fixes.css     全站修复样式 + 移动端断点 + 嵌套双语 [data-lang] CSS 规则
robots.txt        阻 AI 训练爬虫 + SEO 反链扫描器
migrations/       所有 SQL 迁移文件（详见下表）
ADMIN_GUIDE.md    给 Carrie 的完整后台使用手册（12 章节 + AI 提示词模板 + FAQ）
README.md / CLAUDE.md  项目说明 + 开发约束
SESSION_HANDOFF.md  本文件
```

---

## Supabase 数据库 Schema（截至本会话末）

### healers 表

```
基础: id, emoji, bg, name_zh, name_en, title_zh, title_en, sub_zh, sub_en,
      title_extra_zh, title_extra_en, bio_zh, bio_en, long_bio_zh, long_bio_en,
      price, location_zh, location_en, avail_zh, avail_en, book_day, book_month,
      tags TEXT[], avatar_url, active, sort_order, services JSONB, events JSONB,
      products JSONB
分类: category_ids BIGINT[]（关联 categories 表）
联系方式（C-3）: wechat, whatsapp, email, xiaohongshu_url, booking_url
特色引言（C-9）: featured_quote_zh, featured_quote_en, quote_context
档案（C-10）: origin_city, nationality, birth_year INT, certifications JSONB,
              languages, practice_since INT
头像多比例（F-5）: avatar_landscape (4:3), avatar_portrait (3:4)
```

### content 表

```
基础: id, type (article/podcast/video), emoji, sort_order, title_zh, title_en,
      summary_zh, body_zh, body_en, author, duration_zh, duration_en,
      tags TEXT[], cover_url, active, featured, carousel_order
分类: category_zh, category_en（已双语 ✅）
音频（C-内容架构 v1）: audio_url, podcast_link, audio_embed (iframe HTML)
视频: video_embed (iframe HTML)
其他: guest_name, transcript, publish_date DATE
```

### homepage 表（单行 id=1）

```
hero_title_zh, hero_sub_en, hero_desc_zh, hero_desc_en,
stat_content/stat_healers/stat_domains（**Carrie 反馈 v2 已无前台 section，admin UI 已删，DB 列保留**），
founder_quote_zh, founder_quote_en, founder_name_zh,
meta_title, meta_description, og_image,
hero_video_url, hero_poster_url
```

### 其他表

- `categories`：疗愈方向 chip（slug + label_zh + label_en + sort_order + active）
- `ticker`：首页跑马灯标签（label + sort_order）
- `media_library`：上传历史（url + filename + type + size_bytes）
- `subscribers`：邮件订阅
- `survey_responses` / `survey_questions`：问卷
- `audit_log`：操作日志

---

## 数据库迁移文件状态

**全部 8 个迁移文件均已通过浏览器 Supabase Dashboard SQL Editor 跑过。**

| 文件 | 加的字段 | 来源轮次 |
|---|---|---|
| add_hero_video.sql | homepage: hero_video_url + hero_poster_url | v2 早期 |
| add_content_audio.sql | content: audio_url + podcast_link | v2 早期 |
| add_content_category.sql | content: category_zh + category_en | v2 早期 |
| add_healer_categories.sql | 新建 categories 表 + healers.category_ids[] | v2 B-5 |
| add_healer_contact_quote_profile.sql | healers 14 字段（C-3 联系 + C-9 引言 + C-10 档案） | v2 |
| add_healer_title_extra.sql | healers: title_extra_zh + title_extra_en | v2 C-7 |
| add_content_podcast_video.sql | content: audio_embed + video_embed + guest_name + transcript + publish_date | 内容架构 v1 |
| add_healer_avatar_aspects.sql | healers: avatar_landscape + avatar_portrait | v5 F-5 |

---

## 反馈轮次累计完成情况

### v2（首轮完整反馈）— 22/22 ✅
A 类 10 项中英文切换 + 假数字清理 + B 类（含 B-5 后台化分类） + C-3/C-5/C-6/C-7/C-8/C-9/C-10/C-11 + D-1/D-2

### v3 — 7/7 ✅
A-1 lang 按钮、A-2 hero 黑灰条、A-3 hero 响应式、A-4 hero 设计、A-5 精选阅读标题、B-1 admin 二级折叠、B-2（D-1 重做）

### 内容架构升级 v1 — 100% ✅
content 表支持 article/podcast/video 三格式 + 卡片格式标签 + 详情页三模板 + 批量导入（JSON）+ 批量导出

### v5 — 10/10 ✅
F-1 单 healer 保存、F-2 单 content 保存、F-3 删 meditation、F-4 字段 toggle、F-5 头像三连裁；G-1 品牌名统一、G-2 hero 间距+SCROLL 删、G-3 修行者→修行、G-4 chip 改主题、G-5 hero 英文 of 孤词、G-6 hero 黑灰再修

### v6 — 4/7 ✅ + 3 项未做
**已做（commit 2418d4e）：**
- H-1 详情页重复职称（v4/v5/v6 三轮反馈终于修对）
- I-1 微信 popup（二维码 + 文本 + 一键复制）
- I-2 Quiz 第一屏完整
- I-3 全站 Logo 字距统一

**未做（下个会话做）：**
- **H-2** 7 处单语字段改双栏
- **H-3** 后台真分级导航（hash 路由 + 独立编辑页）
- **J-1** 用户账户系统 + 收藏功能 工作量评估文档

---

## v6 H-2 待办 — 详细执行清单

> 给下个会话直接照此做即可。

### 字段对照（Carrie 提的 7 项实际只需做 6 项）

| # | 字段 | 当前位置 | 处理方式 |
|---|---|---|---|
| 1 | 服务描述 | services JSONB.description_zh 单 | 改 services list editor 加 description_en |
| 2 | 活动地点 | events JSONB.location_zh 单 | 改 events list editor 加 location_en |
| 3 | 活动描述 | events JSONB.description_zh 单 | 改 events list editor 加 description_en |
| 4 | 引言来源说明 | healers.quote_context 单列 | SQL 加 quote_context_en + admin 双 input |
| 5 | 认证列表 | certifications JSONB.name 单 | 改 cert list editor name → name_zh + name_en |
| 6 | 内容库分类标签 | content.category_zh + category_en（**已双栏 ✅**） | **已存在，告诉 Carrie 已是双栏** |
| 7 | 内容库摘要 | content.summary_zh 单列 | SQL 加 summary_en + admin 双 textarea |

### 执行步骤

```sql
-- 1. SQL（在 Supabase SQL Editor 跑）
ALTER TABLE healers ADD COLUMN IF NOT EXISTS quote_context_en TEXT DEFAULT '';
ALTER TABLE content ADD COLUMN IF NOT EXISTS summary_en TEXT DEFAULT '';
```

2. **admin.html 改 6 处**：
   - `renderServicesList`：每条服务的"描述"input 拆为 desc_zh + desc_en（替换 line ~906）
   - `addService` / `collectServices`：写 `{description_zh, description_en}`
   - `renderEventsList`：location 和 description 各拆 zh+en（line ~914）
   - `addEvent` / `collectEvents`：同
   - `renderCertificationsList`：name → name_zh + name_en（找 line 含 "认证名称"）
   - `addCertification` / `collectCertifications`
   - healer 表单的 `hf_<id>_quote_context`（line ~969）拆为 `_quote_context_zh` + `_quote_context_en` 两 input
   - `saveHealers` / `saveOneHealer` upsert 加 `quote_context_zh` + `quote_context_en`
   - content 表单的 `cf_<id>_summary_zh` textarea 后加 `cf_<id>_summary_en` 第二个
   - `saveContent` / `saveOneContent` upsert 加 `summary_en`

3. **前台改 5 处**（按 lang 取对应字段，fallback _zh）：
   - `healer.html` services 渲染（applyHealerData 中循环 h.services）
   - `healer.html` events 渲染
   - `healer.html` certifications 渲染（在档案面板 facts）
   - `healer.html` quote_context 渲染（pf-quote-cite 拼接处）
   - `index.html` overrideContent + `healers.html` 卡片 summary（如果未来要双语显示）

工作量：~2 小时。

---

## v6 H-3 待办 — 后台真分级导航

**这是大重构**。Carrie 要求：

```
点疗愈师/内容子项 → 进独立编辑页（/admin/healer/zoe）
独立编辑页底部独立保存
顶部「返回列表」面包屑
列表页（卡片或表格）
```

### 实施方案（建议）

**方案 1：Hash 路由 + 单页隐藏切换**（**推荐**，无需改部署架构）
- URL `admin.html#/healer/zoe` 或 `admin.html#/content/c123`
- 监听 `hashchange` 事件，渲染对应单条 healer 卡片到 `#editPanel`
- 列表页（cards/table 视图）替换原垂直堆叠
- 改 `goPage()` 接受 hash 参数
- saveOneHealer / saveOneContent 已存在（v5 F-1/F-2 做过），单条提交无需新写

**方案 2：物理多页**（重）
- 每个 healer/content 一个 HTML 文件 → 不可行（动态生成）
- 用 SSG 工具？— 项目无构建，不要引

**预估**：方案 1 ~3 小时（HTML 重组 + JS 路由 + CSS 列表卡片视图）

---

## v6 J-1 — 账户 + 收藏 评估文档

**仅评估不实施**。建议给 Carrie 的内容（一份 .md 即可）：

### 完整方案
- Supabase Auth（邮箱密码 + Google OAuth 可选）
- 新建 `favorites` 表：`user_id + target_type (healer/content) + target_id + created_at`
- 前台加登录入口（modal）
- 卡片右上角心形按钮，登录后可点
- 个人中心页 `/me.html` 列出所有收藏
- **工作量：3-5 天**

### 轻量方案（localStorage）
- 不需登录
- 收藏存浏览器 `localStorage.as_favorites`
- 卡片心形按钮直接 toggle
- 个人中心页读取本地数据
- **工作量：4-6 小时**
- **缺点**：换设备/清浏览器丢失

### 建议
**先 localStorage 轻量方案** → 上线 1-2 个月看用户量 → 用户量起来再升级完整账户。理由：
- 当前 MAU 还少（部分原因 anon 不计），还不需要跨设备同步
- localStorage 用户体验等同（不需注册，加心立刻有）
- 完整账户系统后期可平滑迁移（用户首次登录时把 localStorage 收藏导入数据库）

工作量评估文档可以放在 `docs/J-1_account_evaluation.md` 或直接给 Carrie 看会议纪要式 .md。

---

## 已知决策 / 限制 / 重要约束

1. **Hero 主标题/副标题写死在代码里**（v3 A-3 Carrie 终稿决定）
   - 中文：清醒疗愈，摩登修行 / 随愈而为，独立疗愈师共创社区。让真实被遇见。
   - 英文：On the Journey of Healing, Awaken the Sphere of Your Whole Self. / An independent healer co-creation community. Where healing becomes awakening.
   - **不要再做成动态 admin 字段**（admin UI 此区已删）

2. **产品区总是隐藏**（v2 C-6 短期方案）
   - healer.html 用 textContent 探测 'Touch Soul' 隐藏整段
   - 等 Carrie 确认产品模块设计后再恢复

3. **localStorage 缓存层**：key `as_sbcache_v2`，TTL 10 分钟。Carrie admin 写入会调 `bustSiteCache()` 清缓存。前台 `?nocache=1` 可强制绕开。

4. **Cloudinary 配置**：cloud `dvufhc3ee`，preset `awakensphere`（unsigned）

5. **代码风格**（项目历史固定）：
   - 用 `var` 不用 `let`
   - 字符串拼接不用模板字面量
   - 命名函数声明不用箭头函数
   - 详见 `.claude/rules/code-style.md`

6. **Supabase 已付费 Pro**，5/28 重置点也无所谓了

7. **Anon Key** 公开在 `js/common.js` 行 9，前端可见，受 RLS 保护（anon 只读 active=true）

8. **老 healer 头像**（zoe / carrie / lin / mei）只有 1:1 `avatar_url`，前台用 fallback。Carrie 重新上传可生成三比例

9. **git 约束**：commit email 必须 `233ashes@gmail.com`，user.name `notashhui`

10. **Netlify**：site `friendly-daffodil-81cfed`，push main 自动部署 60-90 秒

---

## 给下个会话的 onboarding 提示词模板

直接复制这段开新会话：

```
继续 AwakenSphere（awakens.life）的项目。先读
/Users/asheshui/Desktop/awenka/.claude/worktrees/goofy-franklin-bd769f/SESSION_HANDOFF.md
了解全部上下文（v2-v6 反馈完成情况 + schema + 关键决策）。

接下来要做：v6 H-2（7 处单语字段改双栏）+ H-3（后台真分级导航）+ J-1（账户+收藏评估）。
H-2 和 H-3 的具体执行清单已在 SESSION_HANDOFF.md 里写好。

约束：用项目代码风格（var、字符串拼接、命名函数）。每个改动 commit + push。
完成后给 Carrie 一份 done/not-done 报告。
```

---

## 历史会话所有 commits 列表（按时间倒序）

```
2418d4e fix: v6 第一批 H-1 / I-1 / I-2 / I-3（4 项）
35ebdb8 feat: F-5 健康师头像多比例裁剪（1:1 + 4:3 + 3:4 三连）
c6e0e8d feat: v5 反馈 9/10 项（F-1/2/3/4 + G-1/2/3/4/5/6）
1408d10 feat: admin 加批量导出 + ADMIN_GUIDE.md 完整后台使用文档
a803d28 feat: 内容架构升级 v1（文章 / 播客 / 视频 三格式）+ 批量导入
54f9d0c feat: v3 反馈 A-1/A-2/A-3/A-4/A-5/B-1 全部修复
0af0c13 feat: C-7 第三个职称字段（方案 A）
2fd4627 fix: healer.html 产品区总是隐藏（C-6 短期方案）
88c776c feat: D-1 图片裁剪（Cropper.js）+ D-2 saveHealers 性能优化
130289c feat: C-3/C-9/C-10/C-11 healer.html 详情页全部接 Supabase
34fb08d feat: 疗愈方向分类系统（B-5 后台化 + healers.html 接 Supabase）
dac91c0 feat: B-5 CSS 修复 + B-6 筛选标签双语切换
9226946 revert: A-3 Hero 文案改回写死
66e9a70 feat: 实现 v2 反馈文档类 A 全部 10 项
c52ce96 chore: 加 robots.txt + admin noindex
771e944 perf: 前台加 localStorage 缓存层 + admin 写后失效
9a1152b fix: 删除 admin healers/content 表的 SEO 字段（数据库无对应列）
0979b6e chore: 移除 admin 后台统计数字字段
2e25012 feat: 首页 hero/meta 绑定 Supabase + 清理假数字/死链/计数 bug
71b7c58 fix: 补齐 content 表 audio_url / podcast_link 字段迁移
```

---

*本文件由会话末尾 AI 整理，作为新会话 onboarding 入口。下次反馈来时（v7 等）从此文档继续。*
