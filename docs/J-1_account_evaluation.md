# J-1：用户账户系统 + 收藏功能 工作量评估

> 给 Carrie 看的会议纪要式评估，决定先做哪个方案。
> 评估日期：2026-05-08

---

## 用户故事

「我想给喜欢的疗愈师/文章/播客加心，下次能快速找回来；不想每次都翻列表。」

可选附加功能：
- 收藏列表导出 / 分享
- 关注疗愈师后有新内容时收到通知（远期）
- 个人偏好（看过哪些类型）做内容推荐（远期）

---

## 三种实施方案对比

| 维度 | 方案 A：localStorage 轻量 | 方案 B：Supabase Auth 完整 | 方案 C：匿名 ID（折中） |
|---|---|---|---|
| 是否需要登录 | ❌ 不需要 | ✅ 需要（邮箱/密码 + Google OAuth） | ❌ 不需要（首访自动生成 UUID） |
| 跨设备同步 | ❌ 换设备/清浏览器 = 数据丢 | ✅ 跨设备一致 | ⚠️ 跨设备不同步，但本设备持久 |
| 用户体验 | 加心立刻有，无门槛 | 注册流程，门槛高 | 加心立刻有，无门槛 |
| 开发工作量 | **4-6 小时** | **3-5 天** | **6-8 小时** |
| 隐私 / 数据归属 | 浏览器本地，最干净 | 用户邮箱在 DB，走 Supabase Auth | 匿名 UUID 可关联用户行为 |
| 后期升级路径 | 用户首登时迁数据进 DB（已成熟） | 已经是终态 | 同 A，再绑定到账号 |

---

## 方案 A 实施细节（推荐先做）

### Schema
不需要 DB schema —— 全部存浏览器：
```javascript
const FAV_KEY = 'as_favorites_v1';
// 数据结构：{ healers: ['zoe','carrie'], content: ['c1','c5'] }
```

### UI 改动
**1. 卡片上的心形按钮**（healers.html / index.html / article.html / healer.html 的相关位置）：
```javascript
function favBtnHtml(type, id) {
  var favs = getFavs();
  var on = (favs[type] || []).indexOf(id) >= 0;
  return '<button class="fav-btn' + (on ? ' on' : '') + '" '
       + 'onclick="toggleFav(\\'' + type + '\\',\\'' + id + '\\',this)" '
       + 'aria-label="收藏">'
       + (on ? '♥' : '♡')
       + '</button>';
}
function toggleFav(type, id, btn) {
  var favs = getFavs();
  favs[type] = favs[type] || [];
  var idx = favs[type].indexOf(id);
  if (idx >= 0) favs[type].splice(idx, 1);
  else favs[type].push(id);
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  if (btn) btn.classList.toggle('on');
  if (btn) btn.textContent = idx >= 0 ? '♡' : '♥';
}
function getFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || {}; }
  catch(e) { return {}; }
}
```

**2. 个人中心页 `me.html`**（新建，~150 行）：
```
- 顶部标题"我的收藏"+ 双语
- 两个 section：「收藏的疗愈师」「收藏的内容」
- 从 localStorage 读 ID 列表，再从 Supabase fetch 对应记录
- 每条加一个"取消收藏"按钮
- 空态：没收藏过 → 显示 CTA「去发现内容 →」
```

**3. 顶部 nav 加入口**（index.html 等）：
- 页头加心形 emoji + 数字徽章（显示总收藏数）
- 点击跳 `me.html`

**4. CSS（新增 ~20 行）**：
```css
.fav-btn {
  background: rgba(255,255,255,.85);
  border: none;
  border-radius: 50%;
  width: 32px; height: 32px;
  font-size: 18px;
  color: #888;
  cursor: pointer;
  position: absolute;
  top: 10px; right: 10px;
}
.fav-btn.on { color: #e94560; }
.fav-btn:hover { transform: scale(1.1); }
```

### 工时拆解
| 子任务 | 工时 |
|---|---|
| 心形按钮 HTML/CSS 设计 + 4 个 fav 状态读写函数 | 1h |
| healers.html 卡片加心形（注意 hover 不影响卡片点击） | 0.5h |
| index.html / article.html 加心形 | 1h |
| me.html 新建（双语 + 取数据 + 显示 + 取消按钮） | 2h |
| 顶部 nav 入口 + 数字徽章（4 文件同步） | 1h |
| 浏览器测试 + 响应式 + IE/Safari 兼容（如还要 IE） | 0.5h |
| **合计** | **6h** |

---

## 方案 B 实施细节（远期升级）

### Schema
```sql
-- favorites 表
CREATE TABLE favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('healer','content')),
  target_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- profiles 表（昵称/头像可选扩展）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI 改动
**1. 登录 modal**（新建组件，~100 行）
- 邮箱 + 密码 注册 / 登录 切换
- Google OAuth 按钮（Supabase Auth 自带）
- 忘记密码链接（Supabase Auth 自带 magic link）

**2. 顶部用户区**
- 未登录：显示「登录 / 注册」
- 已登录：显示头像 + 用户名 + 下拉菜单（我的收藏 / 退出）

**3. 卡片心形按钮**
- 未登录点击 → 弹登录 modal
- 已登录 → toggle Supabase favorites 表

**4. 个人中心页 `me.html`**
- 同方案 A，但 fetch 从 favorites 表（含 user_id 过滤）
- 加修改昵称 / 头像功能（可选）

### 工时拆解
| 子任务 | 工时 |
|---|---|
| Supabase Auth 配置 + RLS 策略 + Google OAuth 设置 | 0.5d |
| favorites + profiles SQL 迁移 + 跑通 | 0.5d |
| 登录/注册 modal 组件（含错误处理 + 忘记密码） | 1d |
| 顶部用户区（未登录态/已登录态切换） | 0.5d |
| 心形按钮接 Supabase（加缓存避免重复请求） | 0.5d |
| me.html（含 profile 编辑） | 1d |
| 测试：注册 / 登录 / 忘密 / OAuth / 数据隔离 | 0.5d |
| **合计** | **3-5d** |

---

## 方案 C：匿名 ID（中间道路）

第一次访问时 `crypto.randomUUID()` 写 localStorage，所有收藏写到 favorites 表用这个匿名 UUID。

优点：用户体验同 A（不需登录），但数据在云端可分析、可在以后转账户登录时绑定。

缺点：换设备/清浏览器照样丢失（除非用户主动绑定到邮箱账号）。

工时：A + 6h（写匿名 ID 生成 / Supabase 调用 / 后期账号合并逻辑）≈ **6-8h**

---

## 推荐路径

**第一步：先做方案 A（4-6h，可一周内上线）**

理由：
1. **当前 MAU 还不大**（部分原因 anon 用户不计），跨设备同步还不是刚需
2. **localStorage 立刻可用，无需注册**，这是最佳的 0 摩擦体验
3. **数据可平滑升级**：如果未来上账户系统，用户首次登录时把 localStorage favorites 全量推到 favorites 表即可，已是成熟模式
4. **风险小**：无 DB 改动，无 RLS 配置，无登录失败的客服压力

**第二步（用户量起来后）：升级方案 B**

触发条件（任一）：
- DAU > 200，且后台数据看到大量用户回访（说明跨设备同步已是刚需）
- Carrie 想推订阅 / 付费疗愈师服务（账户必备）
- 想做疗愈师 ↔ 用户 1v1 聊天（账户必备）
- 引入 push 通知（账户必备）

升级时序：
1. 跑 favorites + profiles 迁移
2. 加登录 modal + 顶部用户区
3. me.html 改 fetch 源
4. **首次登录引导**：检测 localStorage 存在 favorites → 提示「同步到云端」一键导入
5. 30 天后清掉 localStorage 实现（向用户提示 1 次）

---

## 决策点（请 Carrie 选）

- [ ] **A. 同意先做方案 A（轻量收藏）— 4-6h**
- [ ] **B. 直接做方案 B（完整账户）— 3-5 天**
- [ ] **C. 做匿名 ID（方案 C）— 6-8h**
- [ ] **D. 暂不做收藏，先关注其它优先级**

---

## 旁注

如果选方案 A：建议在后续 Iter 里加一个**「分享我的收藏」**按钮（生成短链，带 favorites 数据，对方点开能看你的收藏页）。低成本（~2h），但社交传播价值高，符合 awakens 社区调性。
