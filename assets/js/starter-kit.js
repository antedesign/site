/* ============================================================
   starter-kit.js — behaviour for the ICM starter kit post
   Three independent pieces, each a no-op if its markup is absent:
     1. language switch (EN / NL), remembered in localStorage
     2. use-case tabs
     3. copy buttons for the prompts
   No dependencies.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var TITLES = {
    en: 'Agents made simple: build AI agents in plain language, and keep them when the tools change | Anté',
    nl: 'Agents made simple: bouw AI-agents in gewone taal en hou ze als de tools veranderen | Anté'
  };

  function currentLang() {
    return root.getAttribute('data-lang') === 'nl' ? 'nl' : 'en';
  }

  /* ── 1. Language switch ──────────────────────────────── */
  var langButtons = Array.prototype.slice.call(document.querySelectorAll('[data-set-lang]'));

  function setLang(lang, persist) {
    if (lang === 'nl') root.setAttribute('data-lang', 'nl');
    else root.removeAttribute('data-lang');
    root.lang = lang;
    document.title = TITLES[lang];
    langButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });
    if (persist) {
      try { localStorage.setItem('ante-lang', lang); } catch (e) { /* private mode */ }
      try {
        var u = new URL(window.location.href);
        if (lang === 'nl') u.searchParams.set('lang', 'nl');
        else u.searchParams.delete('lang');
        history.replaceState(null, '', u.pathname + u.search + u.hash);
      } catch (e) { /* ignore */ }
    }
  }

  if (langButtons.length) {
    langButtons.forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-set-lang'), true); });
    });
    setLang(currentLang(), false);
  }

  /* ── 2. Use-case tabs ────────────────────────────────── */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.uc-tab'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.uc-panel'));

  function showTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.setAttribute('tabindex', on ? '0' : '-1');
    });
    panels.forEach(function (p) {
      p.classList.toggle('is-active', p.id === tab.getAttribute('aria-controls'));
    });
    if (focus) tab.focus();
  }

  if (tabs.length && panels.length) {
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { showTab(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); showTab(next, true); }
      });
    });

    var start = tabs[0];
    var hash = window.location.hash.slice(1);
    tabs.forEach(function (t) {
      if (t.getAttribute('aria-controls') === hash) start = t;
    });
    showTab(start, false);
  }

  /* ── 3. Copy the prompts ─────────────────────────────── */
  var noteTimer;

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return legacyCopy(text); }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-copy]'), function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-copy');
      var lang = btn.getAttribute('data-copy-lang');
      var pre = document.querySelector('pre[data-prompt="' + key + '"][lang="' + lang + '"]');
      if (!pre) return;
      copyText(pre.textContent).then(function (ok) {
        var block = btn.closest('[data-prompt-block]');
        var note = block && block.querySelector('.prompt-note');
        var msg = lang === 'nl'
          ? (ok ? 'Gekopieerd. Plak het in ChatGPT, Claude of Gemini.' : 'Kopiëren lukte niet. Selecteer de tekst hierboven.')
          : (ok ? 'Copied. Paste it into ChatGPT, Claude or Gemini.' : 'Copy did not work. Select the text above instead.');
        if (note) {
          note.textContent = msg;
          clearTimeout(noteTimer);
          noteTimer = setTimeout(function () { note.textContent = ''; }, 4000);
        } else {
          var original = btn.innerHTML;
          btn.textContent = lang === 'nl' ? (ok ? 'Gekopieerd' : 'Mislukt') : (ok ? 'Copied' : 'Failed');
          setTimeout(function () { btn.innerHTML = original; }, 2000);
        }
      });
    });
  });

  /* ── 4. Animated cover ───────────────────────────────── */
  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var layers = Array.prototype.slice.call(hero.querySelectorAll('.hl'));
    var caption = hero.querySelector('[data-hero-caption]');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pulseTimers = [];

    function showCaption(text) { if (caption) caption.textContent = text; }
    function defaultCaption() { return hero.getAttribute('data-default-' + currentLang()); }
    function layerCaption(l) { return l.getAttribute('data-' + currentLang()); }

    layers.forEach(function (l) {
      function on() { layers.forEach(function (x) { x.classList.toggle('is-on', x === l); }); showCaption(layerCaption(l)); }
      function off() { l.classList.remove('is-on'); showCaption(defaultCaption()); }
      l.addEventListener('mouseenter', on);
      l.addEventListener('focus', on);
      l.addEventListener('click', on);
      l.addEventListener('mouseleave', off);
      l.addEventListener('blur', off);
    });

    function playHero() {
      pulseTimers.forEach(clearTimeout); pulseTimers = [];
      hero.classList.remove('play');
      layers.forEach(function (l) { l.classList.remove('pulse'); });
      void hero.offsetWidth;
      hero.classList.add('play');
      if (!reduced) {
        layers.forEach(function (l, i) {
          pulseTimers.push(setTimeout(function () { l.classList.add('pulse'); }, 3200 + i * 650 + 250));
        });
      }
      showCaption(defaultCaption());
    }

    var replay = hero.querySelector('[data-replay]');
    if (replay) replay.addEventListener('click', playHero);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { playHero(); io.disconnect(); } });
      }, { threshold: 0.35 });
      io.observe(hero);
    } else {
      playHero();
    }
    // keep the default caption in step with the language switch
    Array.prototype.forEach.call(document.querySelectorAll('[data-set-lang]'), function (b) {
      b.addEventListener('click', function () { setTimeout(function () { showCaption(defaultCaption()); }, 0); });
    });
  }

  /* ── 5. Use-case steppers ────────────────────────────── */
  Array.prototype.forEach.call(document.querySelectorAll('[data-stepper]'), function (st) {
    var steps = Array.prototype.slice.call(st.querySelectorAll('.step'));
    var dots = Array.prototype.slice.call(st.querySelectorAll('.sd'));
    var back = st.querySelector('[data-back]');
    var next = st.querySelector('[data-next]');
    var restart = st.querySelector('[data-restart]');
    var idx = 0;

    function show(i) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-current', k === idx);
        d.classList.toggle('is-done', k < idx);
        if (k === idx) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      if (back) back.disabled = idx === 0;
      if (next) next.disabled = idx === steps.length - 1;
    }

    dots.forEach(function (d, k) { d.addEventListener('click', function () { show(k); }); });
    if (back) back.addEventListener('click', function () { show(idx - 1); });
    if (next) next.addEventListener('click', function () { show(idx + 1); });
    if (restart) restart.addEventListener('click', function () { show(0); });
    show(0);
  });

  /* ── 6. Tools: expand / collapse all ─────────────────── */
  function setAll(open) {
    Array.prototype.forEach.call(document.querySelectorAll('.tool-group, .tool'), function (d) { d.open = open; });
  }
  var openAll = document.querySelector('[data-tools-open]');
  var closeAll = document.querySelector('[data-tools-close]');
  if (openAll) openAll.addEventListener('click', function () { setAll(true); });
  if (closeAll) closeAll.addEventListener('click', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.tool-group, .tool'), function (d) { d.open = false; });
  });
}());
