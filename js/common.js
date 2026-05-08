/* AwakenSphere 共享 JS
   - Supabase 客户端初始化
   - 中英切换（localStorage 跨页持久化）
   - Admin 入口（#admin hash 跳 admin.html）
   - 通用工具函数 */

// ── Supabase 客户端 ────────────────────────────────
var SUPABASE_URL = 'https://qsmoyzilsolkcwovkpoe.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzbW95emlsc29sa2N3b3ZrcG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzI5NzQsImV4cCI6MjA5MDI0ODk3NH0.TzeMlevcOgmEs9vBFlJ0M0DuvvisjQL1Sux5OA-qp0E';
var sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// 跨函数共享的数据缓存
var sbCache = { healers: null, content: null, homepage: null, ticker: null, categories: null };

// ── 中英语言切换 ───────────────────────────────────
var LANG_KEY = 'as_lang';
var currentLang = localStorage.getItem(LANG_KEY) || 'zh';

function applyLang() {
  // 按钮高亮
  var btns = document.querySelectorAll('.lang button[data-lang]');
  for (var i = 0; i < btns.length; i++) {
    var b = btns[i];
    b.classList.toggle('on', b.getAttribute('data-lang') === currentLang);
  }
  // 双语节点替换
  var els = document.querySelectorAll('[data-zh][data-en]');
  for (var j = 0; j < els.length; j++) {
    var el = els[j];
    var txt = el.getAttribute('data-' + currentLang);
    if (txt !== null && txt !== undefined) el.textContent = txt;
  }
  // 支持 data-placeholder-zh / data-placeholder-en（input 占位符）
  var inputs = document.querySelectorAll('[data-placeholder-zh][data-placeholder-en]');
  for (var k = 0; k < inputs.length; k++) {
    var ip = inputs[k];
    var p = ip.getAttribute('data-placeholder-' + currentLang);
    if (p) ip.placeholder = p;
  }
  // 根元素同时标记 data-lang + lang
  // - data-lang: common.js 自己的 data-zh/en 元素切换
  // - lang:      quiz.html 等页面用 html[lang="xx"] CSS 规则切换内嵌双语 span
  document.documentElement.setAttribute('data-lang', currentLang);
  document.documentElement.lang = currentLang;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(LANG_KEY, lang);
  applyLang();
  // 触发一个自定义事件，供页面自行刷新动态内容（如日期、进度条文本）
  window.dispatchEvent(new CustomEvent('as:langchange', { detail: { lang: lang } }));
}

function bindLangButtons() {
  var btns = document.querySelectorAll('.lang button[data-lang]');
  for (var i = 0; i < btns.length; i++) {
    (function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    })(btns[i]);
  }
}

// ── Admin 入口（保留 hash 跳转） ─────────────────────
function checkAdminHash() {
  if (window.location.hash === '#admin') window.location.href = 'admin.html';
}

// ── 通用工具 ────────────────────────────────────────
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// URL query 读取（healer.html?id=xxx / article.html?id=xxx 用）
function getQueryParam(name) {
  var url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Markdown → HTML 简易渲染（文章正文用）
function mdRender(md) {
  if (!md) return '';
  var h = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  h = h.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  h = h.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  h = h.replace(/^- (.+)$/gm, '<li>$1</li>');
  h = h.replace(/(<li[^>]*>.*<\/li>\n?)+/g, function (m) { return '<ol>' + m + '</ol>'; });
  h = h.replace(/\n\n/g, '</p><p>');
  h = '<p>' + h + '</p>';
  h = h.replace(/<p>(\s*<h2)/g, '$1').replace(/(<\/h2>)\s*<\/p>/g, '$1');
  h = h.replace(/<p>(\s*<h3)/g, '$1').replace(/(<\/h3>)\s*<\/p>/g, '$1');
  h = h.replace(/<p>(\s*<blockquote)/g, '$1').replace(/(<\/blockquote>)\s*<\/p>/g, '$1');
  h = h.replace(/<p>(\s*<ol)/g, '$1').replace(/(<\/ol>)\s*<\/p>/g, '$1');
  return h;
}

// ── 本地缓存层（降低 Supabase Egress 用量） ────────────
// 一次成功 fetch 后写 localStorage，TTL 内重复访问不打网络。
// 失效路径：(1) TTL 过期；(2) URL ?nocache=1；(3) admin 写入后调 invalidateSiteCache()。
// v2: 加 categories 字段，旧 v1 缓存自动失效（key 不同就读不到）
var SBCACHE_KEY = 'as_sbcache_v2';
var SBCACHE_TTL_MS = 10 * 60 * 1000; // 10 分钟

function loadFromCache() {
  try {
    if (window.location.search.indexOf('nocache=1') >= 0) return false;
    var raw = localStorage.getItem(SBCACHE_KEY);
    if (!raw) return false;
    var obj = JSON.parse(raw);
    if (!obj || !obj.ts) return false;
    if (Date.now() - obj.ts > SBCACHE_TTL_MS) return false;
    sbCache.healers = obj.healers || [];
    sbCache.homepage = obj.homepage || {};
    sbCache.content = obj.content || [];
    sbCache.ticker = obj.ticker || [];
    sbCache.categories = obj.categories || [];
    return true;
  } catch (e) {
    return false;
  }
}

function saveToCache() {
  try {
    localStorage.setItem(SBCACHE_KEY, JSON.stringify({
      ts: Date.now(),
      healers: sbCache.healers,
      homepage: sbCache.homepage,
      content: sbCache.content,
      ticker: sbCache.ticker,
      categories: sbCache.categories
    }));
  } catch (e) {
    // localStorage 写满或被禁用，静默失败（不影响主流程）
  }
}

function invalidateSiteCache() {
  try { localStorage.removeItem(SBCACHE_KEY); } catch (e) {}
}
window.invalidateSiteCache = invalidateSiteCache;

// ── 五表批量加载（首页/目录页用；其他页面可按需调用单表） ────
async function loadAllSiteData() {
  // 先查本地缓存，命中则跳过网络
  if (loadFromCache()) return;
  try {
    var results = await Promise.all([
      sb.from('healers').select('*').eq('active', true).order('sort_order'),
      sb.from('homepage').select('*').eq('id', 1).single(),
      sb.from('content').select('*').eq('active', true).order('sort_order'),
      sb.from('ticker').select('*').order('sort_order'),
      sb.from('categories').select('*').eq('active', true).order('sort_order')
    ]);
    sbCache.healers = results[0].data || [];
    sbCache.homepage = results[1].data || {};
    sbCache.content = results[2].data || [];
    sbCache.ticker = results[3].data || [];
    sbCache.categories = (results[4] && results[4].data) || [];
    saveToCache();
  } catch (e) {
    console.warn('Supabase 全站数据加载失败:', e);
  }
}

// ── J-1：用户账户 + 收藏 ──────────────────────────────
// 状态：currentUser = null（未登录）/ {id,email,...}（已登录）
var currentUser = null;
var favoritesCache = { healer: {}, content: {} }; // {healer:{zoe:true}, content:{c1:true}}
var FAV_LOCAL_KEY = 'as_favorites_v1'; // 老的本地收藏（首次登录时迁移）

// 读本地收藏（未登录时使用）
function getLocalFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_LOCAL_KEY)) || { healer: {}, content: {} }; }
  catch (e) { return { healer: {}, content: {} }; }
}
function saveLocalFavs(favs) {
  try { localStorage.setItem(FAV_LOCAL_KEY, JSON.stringify(favs)); } catch (e) {}
}

// 检查某条是否被收藏
function isFavorited(type, id) {
  if (currentUser) return !!(favoritesCache[type] && favoritesCache[type][id]);
  var local = getLocalFavs();
  return !!(local[type] && local[type][id]);
}

// 切换收藏（已登录走 Supabase；未登录走 localStorage）
async function toggleFavorite(type, id) {
  if (type !== 'healer' && type !== 'content') return false;
  if (currentUser) {
    favoritesCache[type] = favoritesCache[type] || {};
    if (favoritesCache[type][id]) {
      delete favoritesCache[type][id];
      await sb.from('favorites').delete()
        .eq('user_id', currentUser.id)
        .eq('target_type', type)
        .eq('target_id', id);
      return false;
    } else {
      favoritesCache[type][id] = true;
      await sb.from('favorites').insert({
        user_id: currentUser.id,
        target_type: type,
        target_id: id
      });
      return true;
    }
  }
  // 未登录走本地
  var local = getLocalFavs();
  local[type] = local[type] || {};
  if (local[type][id]) {
    delete local[type][id];
    saveLocalFavs(local);
    return false;
  } else {
    local[type][id] = true;
    saveLocalFavs(local);
    return true;
  }
}

// 加载已登录用户的全部收藏到 cache
async function loadFavoritesFromServer() {
  if (!currentUser) return;
  try {
    var res = await sb.from('favorites')
      .select('target_type,target_id')
      .eq('user_id', currentUser.id);
    var data = res.data || [];
    favoritesCache = { healer: {}, content: {} };
    data.forEach(function (r) {
      if (r.target_type === 'healer' || r.target_type === 'content') {
        favoritesCache[r.target_type][r.target_id] = true;
      }
    });
  } catch (e) { console.warn('加载收藏失败:', e); }
}

// 首次登录后把本地收藏推到 server（合并，不覆盖）
async function migrateLocalFavoritesToServer() {
  if (!currentUser) return;
  var local = getLocalFavs();
  var rows = [];
  ['healer', 'content'].forEach(function (type) {
    Object.keys(local[type] || {}).forEach(function (id) {
      rows.push({ user_id: currentUser.id, target_type: type, target_id: id });
    });
  });
  if (!rows.length) return;
  try {
    // upsert 避免冲突（unique 约束 user_id+target_type+target_id）
    await sb.from('favorites').upsert(rows, { onConflict: 'user_id,target_type,target_id', ignoreDuplicates: true });
    // 迁移完成后清本地（避免下次再迁）
    localStorage.removeItem(FAV_LOCAL_KEY);
    // 更新 cache
    rows.forEach(function (r) { favoritesCache[r.target_type][r.target_id] = true; });
  } catch (e) { console.warn('迁移本地收藏失败:', e); }
}

// 当前 session 状态恢复 + 监听变化
async function refreshAuthState() {
  try {
    var res = await sb.auth.getUser();
    var u = res && res.data && res.data.user;
    currentUser = u || null;
    if (currentUser) {
      await loadFavoritesFromServer();
      await migrateLocalFavoritesToServer();
    }
    paintUserArea();
    refreshAllFavBtns();
  } catch (e) { console.warn('refreshAuthState:', e); }
}

// 顶部用户区渲染
function paintUserArea() {
  var areas = document.querySelectorAll('.user-area');
  for (var i = 0; i < areas.length; i++) {
    var a = areas[i];
    if (currentUser) {
      var name = (currentUser.user_metadata && currentUser.user_metadata.display_name)
              || (currentUser.email || '').split('@')[0];
      a.innerHTML = '<a class="user-link" href="me.html" title="' + esc(currentUser.email) + '">'
                  + '<span class="user-avatar">♥</span>'
                  + '<span class="user-name">' + esc(name) + '</span>'
                  + '</a>';
    } else {
      a.innerHTML = '<button class="user-login-btn" onclick="openAuthModal()">'
                  + '<span data-zh="登录 / 注册" data-en="Sign in">登录 / 注册</span>'
                  + '</button>';
      // 重新触发 applyLang 以处理动态新增的 data-zh/en
      applyLang();
    }
  }
}

// 全局刷新所有心形按钮的 on/off 状态（在 favorite 切换、登录/登出后调）
function refreshAllFavBtns() {
  // 卡片角落圆形心形按钮
  var btns = document.querySelectorAll('.fav-btn[data-fav-type][data-fav-id]');
  for (var i = 0; i < btns.length; i++) {
    var b = btns[i];
    var t = b.getAttribute('data-fav-type');
    var id = b.getAttribute('data-fav-id');
    var on = isFavorited(t, id);
    b.classList.toggle('on', on);
    b.textContent = on ? '♥' : '♡';
  }
  // pill 形状心形按钮（详情页用）
  var pills = document.querySelectorAll('.fav-pill[data-fav-type][data-fav-id]');
  for (var k = 0; k < pills.length; k++) {
    var p = pills[k];
    var pt = p.getAttribute('data-fav-type');
    var pid = p.getAttribute('data-fav-id');
    var pon = isFavorited(pt, pid);
    p.classList.toggle('on', pon);
    var ic = p.querySelector('.ic');
    if (ic) ic.textContent = pon ? '♥' : '♡';
    var zh = p.querySelector('[data-lang="zh"]');
    var en = p.querySelector('[data-lang="en"]');
    if (zh) zh.textContent = pon ? '已收藏' : '收藏';
    if (en) en.textContent = pon ? 'Saved' : 'Save';
  }
}

// 心形按钮点击处理（卡片用 onclick="onFavClick(event,'healer','zoe')"）
async function onFavClick(e, type, id) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  var nowOn = await toggleFavorite(type, id);
  refreshAllFavBtns();
  // 心形动画
  var btn = e && e.currentTarget;
  if (btn) {
    btn.classList.add('pulse');
    setTimeout(function () { btn.classList.remove('pulse'); }, 350);
  }
  return nowOn;
}

// 生成心形按钮 HTML（卡片渲染时调用）
function favBtnHtml(type, id) {
  var on = isFavorited(type, id);
  return '<button class="fav-btn' + (on ? ' on' : '') + '" '
       + 'data-fav-type="' + esc(type) + '" '
       + 'data-fav-id="' + esc(id) + '" '
       + 'onclick="onFavClick(event,\'' + esc(type) + '\',\'' + esc(id) + '\')" '
       + 'aria-label="收藏">'
       + (on ? '♥' : '♡')
       + '</button>';
}

// ── 登录 / 注册 modal（动态注入） ─────────────────────
function openAuthModal(mode) {
  closeAuthModal();
  var m = document.createElement('div');
  m.className = 'auth-modal-overlay';
  m.id = 'authModalOverlay';
  m.onclick = function (e) { if (e.target === m) closeAuthModal(); };
  var isReg = mode === 'register';
  m.innerHTML =
    '<div class="auth-modal-box">'
    + '<button class="auth-modal-close" onclick="closeAuthModal()">×</button>'
    + '<h3 class="auth-modal-title" id="authTitle">' + (isReg ? '注册账号' : '登录') + '</h3>'
    + '<div class="auth-modal-sub"><span data-zh="收藏疗愈师与内容，跨设备同步" data-en="Save healers & content across devices">收藏疗愈师与内容，跨设备同步</span></div>'
    + '<div class="auth-field"><label>邮箱 / Email</label><input type="email" id="authEmail" autocomplete="email" autofocus></div>'
    + '<div class="auth-field"><label>密码 / Password</label><input type="password" id="authPw" autocomplete="current-password"></div>'
    + '<div class="auth-err" id="authErr" style="display:none"></div>'
    + '<button class="auth-submit-btn" id="authSubmitBtn" onclick="submitAuth(' + (isReg ? 'true' : 'false') + ')">'
    + (isReg ? '注册' : '登录') + '</button>'
    + '<div class="auth-toggle">'
    + (isReg
        ? '<span data-zh="已有账号？" data-en="Have an account?">已有账号？</span> <a href="#" onclick="toggleAuthMode(event,false)" data-zh="登录" data-en="Sign in">登录</a>'
        : '<span data-zh="没有账号？" data-en="No account?">没有账号？</span> <a href="#" onclick="toggleAuthMode(event,true)" data-zh="注册" data-en="Create one">注册</a>')
    + '</div>'
    + '</div>';
  document.body.appendChild(m);
  applyLang();
  setTimeout(function () { var i = document.getElementById('authEmail'); if (i) i.focus(); }, 50);
  // Enter 提交
  var pw = document.getElementById('authPw');
  if (pw) pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitAuth(isReg); });
}
function closeAuthModal() {
  var ex = document.getElementById('authModalOverlay');
  if (ex) ex.remove();
}
function toggleAuthMode(e, toReg) {
  if (e) e.preventDefault();
  openAuthModal(toReg ? 'register' : 'login');
}
async function submitAuth(isReg) {
  var email = (document.getElementById('authEmail').value || '').trim();
  var pw = document.getElementById('authPw').value || '';
  var err = document.getElementById('authErr');
  var btn = document.getElementById('authSubmitBtn');
  if (!email || !pw) {
    err.textContent = '请填写邮箱和密码 / Email and password required';
    err.style.display = 'block';
    return;
  }
  if (pw.length < 6) {
    err.textContent = '密码至少 6 位 / Password ≥ 6 chars';
    err.style.display = 'block';
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = isReg ? '注册中…' : '登录中…'; }
  err.style.display = 'none';
  try {
    var res = isReg
      ? await sb.auth.signUp({ email: email, password: pw })
      : await sb.auth.signInWithPassword({ email: email, password: pw });
    if (res.error) throw res.error;
    if (isReg && (!res.data || !res.data.session)) {
      // 注册需邮件验证（若 Supabase 设置了 confirm email）
      err.style.display = 'block';
      err.textContent = '请去邮箱激活账号 / Check your email to confirm';
      err.style.color = '#35845D';
      if (btn) { btn.disabled = false; btn.textContent = isReg ? '注册' : '登录'; }
      return;
    }
    closeAuthModal();
    await refreshAuthState();
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = isReg ? '注册' : '登录'; }
    err.style.display = 'block';
    err.textContent = (e && e.message) || '操作失败 / Failed';
  }
}

async function logoutUser() {
  try { await sb.auth.signOut(); } catch (e) {}
  currentUser = null;
  favoritesCache = { healer: {}, content: {} };
  paintUserArea();
  refreshAllFavBtns();
}

// 监听 auth 变化（多 tab / 第三方登录回调）
sb.auth.onAuthStateChange(function (event, session) {
  var newUser = session && session.user;
  var was = currentUser && currentUser.id;
  if ((newUser && newUser.id) !== was) {
    currentUser = newUser || null;
    if (currentUser) {
      loadFavoritesFromServer().then(migrateLocalFavoritesToServer).then(function () {
        paintUserArea();
        refreshAllFavBtns();
      });
    } else {
      favoritesCache = { healer: {}, content: {} };
      paintUserArea();
      refreshAllFavBtns();
    }
  }
});

// 暴露给 onclick 内联用
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.toggleAuthMode = toggleAuthMode;
window.submitAuth = submitAuth;
window.logoutUser = logoutUser;
window.onFavClick = onFavClick;
window.favBtnHtml = favBtnHtml;
window.refreshAllFavBtns = refreshAllFavBtns;
window.isFavorited = isFavorited;

// ── 启动：admin 监听 + 语言绑定 ────────────────────
(function () {
  checkAdminHash();
  window.addEventListener('hashchange', checkAdminHash);

  function boot() {
    bindLangButtons();
    applyLang();
    // 版权年份动态注入（footer 中 <span id="copyrightYear"> 占位）
    var cy = document.getElementById('copyrightYear');
    if (cy) cy.textContent = new Date().getFullYear();
    // J-1：恢复登录状态 + 渲染顶部用户区 + 心形按钮
    refreshAuthState();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
