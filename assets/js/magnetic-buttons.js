/* ============================================================
   magnetic-buttons.js — reusable magnetic hover for CTAs
   Auto-finds .btn-primary / .btn-secondary / .btn-frosted and
   gently pulls each toward the cursor; the inner .arrow nudges
   a little further. Springs back to rest when the cursor leaves.

   Vanilla, dependency-free, GPU-friendly (transform only),
   desktop/hover-only. Disabled entirely for touch and for
   prefers-reduced-motion (buttons keep their normal CSS hover).

   Tune live via window.AnteMagneticButtons.cfg:
     strength  attraction strength (0–1 of the cursor offset)
     radius    influence radius in px beyond the button edge
     max       maximum displacement in px (keep ~6–12)
   Call window.AnteMagneticButtons.refresh() after adding buttons.
   ============================================================ */
(function () {
  'use strict';

  // ─── CLIENT-TUNED SETTINGS ──────────────────────────────
  // Pas deze waarden aan naar wat je in de demo hebt ingesteld.
  //   strength  attraction strength (0–1)
  //   radius    influence radius in px beyond the button edge
  //   max       max displacement in px (premium = ~6–12)
  //   arrow     how much further the .arrow nudges (× button shift)
  var cfg = { strength: 0.42, radius: 90, max: 11, arrow: 0.6 };
  // ────────────────────────────────────────────────────────
  var SEL = '.btn-primary, .btn-secondary, .btn-frosted';
  var items = [], mx = -99999, my = -99999, running = false;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function refresh() {
    items = Array.prototype.slice.call(document.querySelectorAll(SEL)).map(function (node) {
      var it = node._mag;
      if (!it) {
        it = { el: node, arrow: node.querySelector('.arrow'), x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
        node._mag = it;
        node.style.willChange = 'transform';
      }
      return it;
    });
  }

  function onMove(e) { mx = e.clientX; my = e.clientY; start(); }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }

  function loop() {
    var active = false;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var r = it.el.getBoundingClientRect();
      if (r.width === 0) continue;
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = mx - cx, dy = my - cy, dist = Math.hypot(dx, dy);
      var reach = cfg.radius + Math.max(r.width, r.height) / 2;
      if (dist < reach) {
        var f = 1 - dist / reach;
        it.tx = clamp(dx * cfg.strength * f, -cfg.max, cfg.max);
        it.ty = clamp(dy * cfg.strength * f, -cfg.max, cfg.max);
      } else { it.tx = 0; it.ty = 0; }

      // soft spring
      var k = 0.16, d = 0.78;
      it.vx = (it.vx + (it.tx - it.x) * k) * d;
      it.vy = (it.vy + (it.ty - it.y) * k) * d;
      it.x += it.vx; it.y += it.vy;

      if (Math.abs(it.x) < 0.04 && Math.abs(it.y) < 0.04 && it.tx === 0 && it.ty === 0) {
        it.x = it.y = it.vx = it.vy = 0;
        it.el.style.transform = '';
        if (it.arrow) it.arrow.style.transform = '';
      } else {
        active = true;
        it.el.style.transform = 'translate(' + it.x.toFixed(2) + 'px,' + it.y.toFixed(2) + 'px)';
        if (it.arrow) it.arrow.style.transform = 'translateX(' + (it.x * cfg.arrow).toFixed(2) + 'px)';
      }
    }
    if (active) requestAnimationFrame(loop); else running = false;
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover  = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Always expose the API so a tuning panel can read cfg; only wire
  // up the actual effect on hover-capable, motion-allowing devices.
  window.AnteMagneticButtons = { cfg: cfg, refresh: refresh, enabled: !!(hover && !reduce) };

  if (!hover || reduce) return;

  function boot() { refresh(); window.addEventListener('pointermove', onMove, { passive: true }); }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
