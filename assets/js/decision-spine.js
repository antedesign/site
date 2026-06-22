/* ============================================================
   decision-spine.js — drives the scroll-driven decision spine
   Reads every .ds section in the page.

   Desktop (>=901px): pins the section and maps vertical scroll
   progress to a horizontal track translate, a drawing spine
   line, a travelling glowing node and lit stations.
   Mobile / tablet: a vertical spine fills as you scroll and
   each phase lights up as it enters.
   prefers-reduced-motion: no pinning / horizontal motion — the
   spine is shown fully drawn and the phases read as a list.

   Key figures with [data-count] count up once on entry.

   Tune via attributes on the .ds element:
     style="--ds-len: 3"     longer = the horizontal part lasts longer
     style="--ds-glow: 1.4"  node glow intensity
   Vanilla, dependency-free, transform/opacity only.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function isDesktop() { return window.matchMedia('(min-width: 901px)').matches; }

  function initSpine(root) {
    var track    = root.querySelector('.ds-track');
    var stage    = root.querySelector('.ds-stage');
    var panels   = Array.prototype.slice.call(root.querySelectorAll('.ds-panel'));
    var fill     = root.querySelector('.ds-line-fill');
    var node     = root.querySelector('.ds-node');
    var stations = Array.prototype.slice.call(root.querySelectorAll('.ds-station'));
    var labels   = Array.prototype.slice.call(root.querySelectorAll('.ds-station-label'));
    var vfill    = root.querySelector('.ds-vfill');
    var n = panels.length;

    // even station spacing across the rail
    stations.forEach(function (s, i) { s.style.left = (i / (n - 1) * 100) + '%'; });
    labels.forEach(function (l, i) { l.style.left = (i / (n - 1) * 100) + '%'; });

    var progress = 0;

    function applyHorizontal() {
      var max = track.scrollWidth - stage.clientWidth;
      track.style.transform = 'translate(' + (-max * progress).toFixed(1) + 'px, -50%)';
      if (fill) fill.style.width = (progress * 100).toFixed(2) + '%';
      if (node) node.style.left = (progress * 100).toFixed(2) + '%';
      var af = progress * (n - 1);
      stations.forEach(function (s, i) { s.classList.toggle('done', af + 0.001 >= i); });
      labels.forEach(function (l, i) { l.classList.toggle('done', af + 0.001 >= i); });
      panels.forEach(function (p, i) { p.classList.toggle('is-active', Math.round(af) === i); });
    }

    function applyVertical() {
      if (vfill) {
        var rect = root.getBoundingClientRect();
        var total = rect.height - window.innerHeight * 0.5;
        var p = reduce ? 1 : clamp01((window.innerHeight * 0.6 - rect.top) / Math.max(total, 1));
        vfill.style.height = (p * 100).toFixed(1) + '%';
      }
      panels.forEach(function (p) {
        var r = p.getBoundingClientRect();
        p.classList.toggle('is-active', reduce ? true : r.top < window.innerHeight * 0.62);
      });
    }

    function update() {
      if (reduce) { applyVertical(); return; }
      if (isDesktop()) {
        var rect = root.getBoundingClientRect();
        var total = root.offsetHeight - window.innerHeight;
        progress = clamp01((-rect.top) / Math.max(total, 1));
        applyHorizontal();
      } else {
        applyVertical();
      }
    }

    var ticking = false;
    function tick() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }

    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);

    if (reduce) {
      stations.forEach(function (s) { s.classList.add('done'); });
      labels.forEach(function (l) { l.classList.add('done'); });
    }

    setupCounters(root);
    tick();
  }

  /* ── Count-up for key figures ──────────────────────────── */
  function setupCounters(root) {
    var els = Array.prototype.slice.call(root.querySelectorAll('[data-count]'));
    if (!els.length) return;

    function fmt(e, v) { return (e.dataset.prefix || '') + v + (e.dataset.suffix || ''); }
    function run(e) {
      var to = +e.dataset.count, dur = 1100, t0 = performance.now();
      (function f(ts) {
        var p = clamp01((ts - t0) / dur);
        e.textContent = fmt(e, Math.round((1 - Math.pow(1 - p, 3)) * to));
        if (p < 1) requestAnimationFrame(f);
      })(t0);
    }

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.textContent = fmt(e, +e.dataset.count); });
      return;
    }
    els.forEach(function (e) { e.textContent = fmt(e, 0); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (ent) {
        if (ent.isIntersecting) { run(ent.target); io.unobserve(ent.target); }
      });
    }, { threshold: 0.6 });
    els.forEach(function (e) { io.observe(e); });
  }

  function boot() {
    Array.prototype.slice.call(document.querySelectorAll('.ds')).forEach(initSpine);
  }
  window.AnteDecisionSpine = { boot: boot };
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
