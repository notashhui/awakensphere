# AwakenSphere — CLAUDE.md

## 项目概述
AwakenSphere 是一个中文疗愈内容平台（awakens.life），由 Kelly/Carrie Yang 创立。
单页 SPA 架构，部署在 Netlify（site ID: `friendly-daffodil-81cfed`）。
管理后台通过 admin.html 访问。

## 技术栈
- **前端**: 纯 HTML/CSS/JS 单文件 SPA（index.html + admin.html）
- **数据**: Supabase（PostgreSQL + Auth + RLS）
- **图片/音频 CDN**: Cloudinary（upload_preset: `awakensphere`, cloud: `dvufhc3ee`）
- **部署**: Netlify ZIP 上传（WordPress.com 不支持自定义 JS）
- **字体**: Cabin / Raleway / Noto Sans SC（Google Fonts）

## Supabase 配置
- **URL**: `https://qsmoyzilsolkcwovkpoe.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbW95emlsc29sa2N3b3ZrcG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzI5NzQsImV4cCI6MjA5MDI0ODk3NH0.TzeMlevcOgmEs9vBFlJ0M0DuvvisjQL1Sux5OA-qp0E`
- **表**: healers, homepage, content, ticker
- **认证**: Supabase Auth（邮箱/密码）
- **RLS**: anon 只读 active 记录，authenticated 完全访问

## 数据表结构

### healers
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | 英文标识符（如 zoe, carrie） |
| emoji | TEXT | 占位 emoji |
| bg | TEXT | CSS 背景类名（hc1-hc8） |
| name_zh/en | TEXT | 中英文名 |
| title_zh/en | TEXT | 职称 |
| sub_zh/en | TEXT | 副标题 |
| bio_zh/en | TEXT | 简介 |
| price | TEXT | 价格（含货币符号） |
| location_zh/en | TEXT | 所在地 |
| avail_zh/en | TEXT | 可约状态 |
| book_day/month | TEXT | 预约日期 |
| tags | TEXT[] | 标签数组 |
| avatar_url | TEXT | Cloudinary 图片 URL |
| active | BOOLEAN | 是否上线 |
| sort_order | INT | 排序 |

### homepage（单行，id=1）
hero_title_zh, hero_sub_en, hero_desc_zh/en, stat_content/healers/domains, founder_quote_zh/en, founder_name_zh

### content
类似 healers，额外字段: type (article/podcast/meditation), summary_zh, author, duration_zh/en, featured, cover_url, audio_url, podcast_link

### ticker
id (SERIAL), label (TEXT), sort_order (INT)

## 文件结构
```
/
├── index.html          # 前台 SPA（匿名读取 Supabase）
├── admin.html          # 管理后台（Supabase Auth 登录 + 读写）
├── schema.sql          # 数据库 schema + seed data + RLS
└── CLAUDE.md           # 本文件
```

## 开发注意事项

### Plan First
- 复杂改动先写伪代码/方案，确认后再实施
- 完整文件优先（不用 diff）

### Safety Guardrails
- 不要删除现有的 CSS 变量或设计 token
- Supabase Anon Key 可公开（前端使用），但不要暴露 Service Role Key
- 图片上传仍走 Cloudinary，不走 Supabase Storage
- RLS 策略：anon 只能读 active=true 记录

### What NOT to Do
- 不要把 admin 逻辑嵌入 index.html（已拆分为独立 admin.html）
- 不要用 localStorage 做持久化存储（已迁移到 Supabase）
- 不要在前台暴露 Supabase Auth session 或用户信息
- 不要删除 `data-zh` / `data-en` 属性（这是双语切换机制）

### 部署流程
1. 本地改好 index.html + admin.html
2. ZIP 打包两个文件
3. Netlify → Sites → friendly-daffodil-81cfed → Deploys → 拖拽上传 ZIP

### 中文注释规范
所有代码注释使用中文
