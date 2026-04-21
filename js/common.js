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
var sbCache = { healers: null, content: null, homepage: null, ticker: null };

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

// ── 四表批量加载（首页用；其他页面可按需调用单表） ────
async function loadAllSiteData() {
  try {
    var results = await Promise.all([
      sb.from('healers').select('*').eq('active', true).order('sort_order'),
      sb.from('homepage').select('*').eq('id', 1).single(),
      sb.from('content').select('*').eq('active', true).order('sort_order'),
      sb.from('ticker').select('*').order('sort_order')
    ]);
    sbCache.healers = results[0].data || [];
    sbCache.homepage = results[1].data || {};
    sbCache.content = results[2].data || [];
    sbCache.ticker = results[3].data || [];
  } catch (e) {
    console.warn('Supabase 全站数据加载失败:', e);
  }
}

// ── 启动：admin 监听 + 语言绑定 ────────────────────
(function () {
  checkAdminHash();
  window.addEventListener('hashchange', checkAdminHash);

  function boot() {
    bindLangButtons();
    applyLang();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
