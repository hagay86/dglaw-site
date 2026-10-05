/* Dardik Gross — accessibility toolbar (bottom-right), skip link and video pause controls.
   Works on every page in English and Hebrew. Settings are remembered in this browser. */
(function () {
  if (window.__dgA11y) return; window.__dgA11y = true;
  var doc = document, root = doc.documentElement;
  var me = doc.currentScript || doc.querySelector('script[src*="accessibility.js"]');
  var base = me ? me.src.replace(/accessibility\.js(\?.*)?$/, '') : '';
  var he = (root.getAttribute('lang') || '').toLowerCase().indexOf('he') === 0;
  var T = he ? {
    open: 'פתיחת תפריט נגישות', tip: 'נגישות', title: 'תפריט נגישות', close: 'סגירת תפריט הנגישות', size: 'גודל טקסט',
    smaller: 'הקטנת טקסט', bigger: 'הגדלת טקסט', reset: 'איפוס הגדרות נגישות', statement: 'הצהרת נגישות',
    skip: 'דלג לתוכן המרכזי', pause: 'השהיית הווידאו', play: 'הפעלת הווידאו', report: 'דיווח על בעיית נגישות',
    opts: { 'contrast-dark': 'ניגודיות כהה', 'contrast-light': 'ניגודיות בהירה', gray: 'גווני אפור', links: 'הדגשת קישורים',
      headings: 'הדגשת כותרות', readable: 'גופן קריא', spacing: 'ריווח טקסט', 'no-motion': 'עצירת אנימציות',
      cursor: 'סמן גדול', focus: 'הדגשת פוקוס', 'hide-img': 'הסתרת תמונות' }
  } : {
    open: 'Open accessibility menu', tip: 'Accessibility', title: 'Accessibility menu', close: 'Close accessibility menu', size: 'Text size',
    smaller: 'Decrease text size', bigger: 'Increase text size', reset: 'Reset accessibility settings', statement: 'Accessibility statement',
    skip: 'Skip to main content', pause: 'Pause video', play: 'Play video', report: 'Report an accessibility issue',
    opts: { 'contrast-dark': 'Dark contrast', 'contrast-light': 'Light contrast', gray: 'Grayscale', links: 'Highlight links',
      headings: 'Highlight headings', readable: 'Readable font', spacing: 'Text spacing', 'no-motion': 'Stop animations',
      cursor: 'Big cursor', focus: 'Focus highlight', 'hide-img': 'Hide images' }
  };
  var ICONS = { 'contrast-dark': '◐', 'contrast-light': '◑', gray: '▦', links: '🔗', headings: 'H', readable: 'Aa',
    spacing: '↔', 'no-motion': '⏸', cursor: '➚', focus: '◎', 'hide-img': '▨' };
  var KEYS = Object.keys(T.opts);
  var KEY = 'dg-a11y-settings', state = { size: 0 };
  try { state = JSON.parse(localStorage.getItem(KEY)) || state; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- text size (works with px-based styles) ---------- */
  var sized = [];
  function applySize() {
    var f = 1 + 0.1 * (state.size || 0);
    if (!sized.length && f !== 1) {
      var all = doc.body.querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.closest('.dg-a11y') || /^(SCRIPT|STYLE|SVG|PATH|VIDEO|IMG|SOURCE|BR)$/i.test(el.tagName)) continue;
        var hasText = false;
        for (var n = el.firstChild; n; n = n.nextSibling) if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
        if (!hasText && !/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName)) continue;
        sized.push([el, parseFloat(getComputedStyle(el).fontSize)]);
      }
    }
    for (var j = 0; j < sized.length; j++) sized[j][0].style.fontSize = f === 1 ? '' : (sized[j][1] * f).toFixed(1) + 'px';
    if (f === 1) sized = [];
  }

  /* ---------- videos ---------- */
  var videoBtns = [];
  function setVideo(v, btn, play) {
    if (play) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    btn.textContent = play ? '❚❚' : '▶'; btn.setAttribute('aria-label', play ? T.pause : T.play); btn.setAttribute('aria-pressed', play ? 'false' : 'true');
  }
  function setupVideos() {
    var vids = doc.querySelectorAll('video[autoplay]');
    for (var i = 0; i < vids.length; i++) (function (v) {
      var host = v.parentElement; if (!host || host.querySelector('.dg-video-toggle')) return;
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'dg-video-toggle';
      host.appendChild(b); videoBtns.push([v, b]);
      b.addEventListener('click', function () { setVideo(v, b, v.paused); });
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      setVideo(v, b, !(reduce || state['no-motion']));
    })(vids[i]);
  }

  function apply() {
    for (var i = 0; i < KEYS.length; i++) root.classList.toggle('a11y-' + KEYS[i], !!state[KEYS[i]]);
    applySize();
    if (state['no-motion']) for (var k = 0; k < videoBtns.length; k++) setVideo(videoBtns[k][0], videoBtns[k][1], false);
    var out = doc.getElementById('dg-a11y-size-val'); if (out) out.textContent = (100 + 10 * (state.size || 0)) + '%';
    var btns = doc.querySelectorAll('.dg-a11y-opt');
    for (var b = 0; b < btns.length; b++) btns[b].setAttribute('aria-pressed', state[btns[b].getAttribute('data-k')] ? 'true' : 'false');
  }

  function build() {
    /* skip link + main landmark */
    var main = doc.querySelector('main') || doc.querySelector('header.site-header ~ section, .nav-overlay ~ section, body > section');
    if (main) { if (!main.id) main.id = 'dg-main'; if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); if (main.tagName !== 'MAIN' && !main.getAttribute('role')) main.setAttribute('role', 'main'); }
    var skip = doc.createElement('a'); skip.className = 'dg-skip'; skip.href = '#' + (main ? main.id : ''); skip.textContent = T.skip;
    doc.body.insertBefore(skip, doc.body.firstChild);

    var w = doc.createElement('div'); w.className = 'dg-a11y'; w.setAttribute('dir', he ? 'rtl' : 'ltr'); w.setAttribute('lang', he ? 'he' : 'en');
    var opts = '';
    for (var i = 0; i < KEYS.length; i++) opts += '<button type="button" class="dg-a11y-opt" data-k="' + KEYS[i] + '" aria-pressed="false"><span class="dg-ic" aria-hidden="true">' + ICONS[KEYS[i]] + '</span>' + T.opts[KEYS[i]] + '</button>';
    var stmt = base + (he ? 'he/' : '') + 'accessibility.html';
    w.innerHTML =
      '<div class="dg-a11y-panel" id="dg-a11y-panel" role="dialog" aria-modal="false" aria-labelledby="dg-a11y-title" hidden>' +
        '<div class="dg-a11y-head"><h2 id="dg-a11y-title">' + T.title + '</h2><button type="button" class="dg-a11y-close" aria-label="' + T.close + '">✕</button></div>' +
        '<div class="dg-a11y-body">' +
          '<div class="dg-a11y-size" role="group" aria-label="' + T.size + '"><span>' + T.size + '</span>' +
            '<button type="button" data-s="-1" aria-label="' + T.smaller + '">A−</button><output id="dg-a11y-size-val" aria-live="polite">100%</output>' +
            '<button type="button" data-s="1" aria-label="' + T.bigger + '">A+</button></div>' +
          '<div class="dg-a11y-grid">' + opts + '</div>' +
          '<button type="button" class="dg-a11y-reset">' + T.reset + '</button>' +
          '<div class="dg-a11y-links"><a href="' + stmt + '">' + T.statement + '</a><a href="mailto:dardik@dglaw.co.il?subject=' + encodeURIComponent(T.report) + '">' + T.report + '</a></div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="dg-a11y-btn" aria-label="' + T.open + '" aria-expanded="false" aria-controls="dg-a11y-panel">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4" r="2" fill="currentColor"/>' +
        '<path d="M4 7.5l8 1.6 8-1.6M12 9.1v5.1m0 0l-3.4 7.3M12 14.2l3.4 7.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<span class="dg-a11y-tip" aria-hidden="true">' + T.tip + '</span>' +
      '</button>';
    doc.body.appendChild(w);

    var panel = w.querySelector('.dg-a11y-panel'), btn = w.querySelector('.dg-a11y-btn');
    function openP(o) { panel.hidden = !o; btn.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) w.querySelector('.dg-a11y-close').focus(); }
    btn.addEventListener('click', function () { openP(panel.hidden); });
    w.querySelector('.dg-a11y-close').addEventListener('click', function () { openP(false); btn.focus(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) { openP(false); btn.focus(); } });
    doc.addEventListener('click', function (e) { if (!panel.hidden && !w.contains(e.target)) openP(false); });
    w.querySelectorAll('[data-s]').forEach(function (b) {
      b.addEventListener('click', function () { state.size = Math.max(-1, Math.min(5, (state.size || 0) + (+b.getAttribute('data-s')))); save(); apply(); });
    });
    w.querySelectorAll('.dg-a11y-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'); state[k] = !state[k];
        if (k === 'contrast-dark' && state[k]) state['contrast-light'] = false;
        if (k === 'contrast-light' && state[k]) state['contrast-dark'] = false;
        if (k === 'no-motion' && !state[k]) for (var i = 0; i < videoBtns.length; i++) setVideo(videoBtns[i][0], videoBtns[i][1], true);
        save(); apply();
      });
    });
    w.querySelector('.dg-a11y-reset').addEventListener('click', function () {
      state = { size: 0 }; save(); apply();
      for (var i = 0; i < videoBtns.length; i++) setVideo(videoBtns[i][0], videoBtns[i][1], true);
    });
  }

  function init() { build(); setupVideos(); apply(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
