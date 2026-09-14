/* ============================================================
   insights.js — behaviour for Anté Insights article pages
   Three independent pieces, each a no-op if its markup is absent:
     1. reading progress bar
     2. table-of-contents scrollspy
     3. copy-to-clipboard for the closing prompt
   No dependencies. Safe to load on the index page too.
   ============================================================ */
(function () {
  'use strict';

  /* ── 1. Reading progress ─────────────────────────────── */
  var bar = document.querySelector('.progress-bar');
  var article = document.querySelector('.article-body');

  if (bar && article) {
    var ticking = false;

    function updateProgress() {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var pct = total <= 0 ? 1 : (-rect.top) / total;
      if (pct < 0) pct = 0;
      if (pct > 1) pct = 1;
      bar.style.width = (pct * 100).toFixed(2) + '%';
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateProgress();
  }

  /* ── 2. Table of contents scrollspy ──────────────────── */
  var tocLinks = Array.prototype.slice.call(
    document.querySelectorAll('.toc a[href^="#"]')
  );

  if (tocLinks.length) {
    var targets = tocLinks
      .map(function (link) {
        var el = document.getElementById(link.getAttribute('href').slice(1));
        return el ? { link: link, el: el } : null;
      })
      .filter(Boolean);

    if (targets.length) {
      var spyTicking = false;

      function updateSpy() {
        var current = targets[0];
        for (var i = 0; i < targets.length; i++) {
          if (targets[i].el.getBoundingClientRect().top <= 140) {
            current = targets[i];
          }
        }
        tocLinks.forEach(function (l) { l.classList.remove('is-current'); });
        current.link.classList.add('is-current');
        spyTicking = false;
      }

      window.addEventListener('scroll', function () {
        if (spyTicking) return;
        spyTicking = true;
        window.requestAnimationFrame(updateSpy);
      }, { passive: true });

      updateSpy();
    }
  }

  /* ── 3. Copy the closing prompt ──────────────────────── */
  var copyBtn = document.querySelector('[data-copy-prompt]');
  var promptEl = document.getElementById('prompt-text');
  var note = document.querySelector('.prompt-note');
  var noteTimer;

  function flashNote(message) {
    if (!note) return;
    note.textContent = message;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { note.textContent = ''; }, 4000);
  }

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

  if (copyBtn && promptEl) {
    copyBtn.addEventListener('click', function () {
      var text = promptEl.textContent;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { flashNote('Copied. Paste it into ChatGPT, Claude or Gemini.'); },
          function () {
            flashNote(legacyCopy(text)
              ? 'Copied. Paste it into ChatGPT, Claude or Gemini.'
              : 'Copy did not work. Select the text above instead.');
          }
        );
      } else {
        flashNote(legacyCopy(text)
          ? 'Copied. Paste it into ChatGPT, Claude or Gemini.'
          : 'Copy did not work. Select the text above instead.');
      }
    });
  }
}());
