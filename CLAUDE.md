# CLAUDE.md — AwakenSphere 项目上下文

## 项目定位

awakens.life 是面向全球华语用户的疗愈内容平台，对标 Sounds True 中文版。
三类核心内容：**内容库（文章/播客/冥想）、疗愈师目录、社群/会员**。

---

## 当前技术状态

| 层级 | 现状 |
|------|------|
| 前端 | 纯 HTML/CSS/JS，单文件 SPA（`index.html`），无框架 |
| 后台 | `admin.html`，数据存 localStorage（非持久化，换设备丢失） |
| 数据库 | 无 — 内容全部硬编码在 `index.html` 里 |
| 托管 | Netlify（friendly-daffodil-81cfed），免费方案 |
| 域名 | awakens.life，DNS 在 WordPress.com 管理 |
| 仓库 | github.com/notashhui/awakensphere，main 分支自动部署 |

**核心问题**：前台 `index.html` 内容是硬编码的，现有后台 `admin.html` 的修改只改了本地 localStorage，不影响实际网站。

---

## 目标架构（方案 A，优先执行）

```
前台 index.html  ──读取──▶  Supabase DB
后台 admin.html  ──写入──▶  Supabase DB
图片             ──存储──▶  Supabase Storage
部署                         Netlify（GitHub CI/CD）
```

- **后端**：Supabase（免费方案，提供 PostgreSQL + 文件存储 + REST API）
- **前端**：现有 HTML/JS 直接调用 Supabase JS SDK，不引入框架
- **管理后台**：`admin.html` 改造为真正的 CMS，纯 JS 操作 Supabase

---

## 前端与后端的连接点（改后端必看）

以下是前台 `index.html` 依赖的数据，**修改后端数据结构时必须保持字段兼容**：

### 疗愈师数据结构

```json
{
  "id": "zoe",
  "emoji": "🌸",
  "name_zh": "赵子珊 Zoe Zhao",
  "name_en": "Zoe Zhao",
  "title_zh": "Esalen® 按摩疗愈师",
  "title_en": "Esalen® Massage Practitioner",
  "sub_zh": "芳香脉轮治疗师",
  "sub_en": "Aroma Chakra Therapist",
  "bio_zh": "来自武汉，现居巴厘岛/新西兰，2022年完成Esalen认证。",
  "bio_en": "From Wuhan, Esalen-certified practitioner.",
  "price": "¥200",
  "location_zh": "武汉",
  "location_en": "Wuhan",
  "tags": ["Esalen 按摩", "芳香疗法", "脉轮"],
  "avail": "线上可约",
  "book_day": "22",
  "book_month": "June",
  "active": true
}
```

> `emoji` 字段将被 `avatar_url`（Supabase Storage 图片链接）替代，但过渡期需同时支持两者。

### 首页内容（Hero 区域）

- 标题/描述（中英文双语）
- 统计数字：内容数量、疗愈师数、领域数
- 创始人寄语

### 内容库条目

- 类型：文章 / 播客 / 冥想引导
- 字段：标题、摘要、标签、作者、封面图、分类、发布状态

---

## 开发优先级

1. **疗愈师管理**（高）— 增删改查 + 头像上传 + 上下线控制
2. **首页内容管理**（高）— Hero 文案、统计数字
3. **内容库管理**（中）— 文章/播客/冥想条目
4. **账号权限**（低）— 密码修改，未来多用户扩展

---

## 重要约束

- **不改前端框架**：`index.html` 继续用纯 HTML/CSS/JS，不引入 React/Vue
- **双语支持**：所有面向用户的内容字段都有 `_zh` / `_en` 两个版本
- **向后兼容**：Supabase 表结构字段名应与现有 JSON 数据结构保持一致，方便迁移
- **非技术用户**：后台操作者（Kelly）不懂代码，界面必须清晰易用
- **免费方案限制**：Supabase 免费额度（500MB 数据库，1GB 存储），设计时避免浪费

---

## 关键账号（仅供开发参考）

| 服务 | 账号 |
|------|------|
| Netlify | 233ashes@gmail.com（Google 登录） |
| GitHub | notashhui |
| 现有后台密码 | awakens2025 |
