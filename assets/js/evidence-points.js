/* ============================================================
   evidence-points.js — ambient "evidence points" background
   A single fixed full-viewport canvas that sits BEHIND content
   (z-index:-1) so the dots show through white sections but are
   hidden under the opaque green / charcoal blocks that paint on
   top of them.

   The dots drift slowly and, on desktop, bend gently toward the
   cursor within an influence radius, then spring back. Calm,
   premium, "breathing" — never distracting from the text.

   Vanilla, dependency-free, transform-free 2D canvas, 60fps.
   prefers-reduced-motion → static (drawn once, no motion, no
   cursor). Touch (no hover) → slow drift only, no cursor.

   Tune live via window.AnteEvidencePoints.cfg:
     count, opacity, drift, bend, radius
   After changing `count`, call .rebuild().
   ============================================================ */
(function () {
  'use strict';

  // Defaults tuned by the client (Anté) — "super subtiel".
  var cfg = { count: 160, opacity: 0.20, drift: 0.7, bend: 20, radius: 360 };
  var COLORS = ['156,227,248', '32,106,91']; // frosted, spruce

  var canvas, ctx, W = 0, H = 0, DPR = 1, pts = [], t = 0, last = 0, raf = null, started = false;
  var mx = -99999, my = -99999;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover  = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Build an irregular closed outline (a soft "blob") for one point:
  // a handful of vertices at jittered angles + radii. Drawn once,
  // then just translated/scaled each frame so it stays cheap.
  function makeBlob(baseR) {
    var nv = 5 + (Math.random() * 4 | 0);   // 5–8 vertices
    var verts = [];
    for (var i = 0; i < nv; i++) {
      var ang = (i / nv) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      var rad = baseR * (0.62 + Math.random() * 0.7);
      verts.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
    }
    return verts;
  }

  function make() {
    pts = [];
    for (var i = 0; i < cfg.count; i++) {
      var r = 1.6 + Math.random() * 3.4;
      pts.push({
        bx: Math.random() * W, by: Math.random() * H,
        ph: Math.random() * Math.PI * 2, sp: 0.3 + Math.random() * 0.7,
        amp: 10 + Math.random() * 22, r: r,
        rot: Math.random() * Math.PI * 2, rotSp: (Math.random() - 0.5) * 0.25,
        blob: makeBlob(r),
        col: COLORS[Math.random() < 0.5 ? 0 : 1], a: 0.4 + Math.random() * 0.6,
        ox: 0, oy: 0, vx: 0, vy: 0, _x: 0, _y: 0
      });
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!pts.length) make();
  }

  function step(dt) {
    t += dt * cfg.drift;
    var useCursor = hover && !reduce && mx > -9000;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var dxd = Math.sin(t * p.sp + p.ph) * p.amp;
      var dyd = Math.cos(t * p.sp * 0.8 + p.ph * 1.3) * p.amp * 0.7;
      var tx = 0, ty = 0;
      if (useCursor) {
        var px = p.bx + dxd, py = p.by + dyd;
        var dx = mx - px, dy = my - py, dist = Math.hypot(dx, dy);
        if (dist < cfg.radius) {
          var f = 1 - dist / cfg.radius; f = f * f;
          tx = (dx / (dist || 1)) * cfg.bend * f;
          ty = (dy / (dist || 1)) * cfg.bend * f;
        }
      }
      var k = 0.08, d = 0.82;
      p.vx = (p.vx + (tx - p.ox) * k) * d;
      p.vy = (p.vy + (ty - p.oy) * k) * d;
      p.ox += p.vx; p.oy += p.vy;
      p._x = p.bx + dxd + p.ox; p._y = p.by + dyd + p.oy;
      p.rot += p.rotSp * dt;
    }
  }

  function paint() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var v = p.blob, n = v.length;
      var cos = Math.cos(p.rot), sin = Math.sin(p.rot);
      // rotate + translate each vertex
      function tx(k) { return p._x + v[k].x * cos - v[k].y * sin; }
      function ty(k) { return p._y + v[k].x * sin + v[k].y * cos; }
      ctx.beginPath();
      // start at the midpoint of the last->first edge, then smooth
      var mx0 = (tx(n - 1) + tx(0)) / 2, my0 = (ty(n - 1) + ty(0)) / 2;
      ctx.moveTo(mx0, my0);
      for (var j = 0; j < n; j++) {
        var nx = (tx(j) + tx((j + 1) % n)) / 2;
        var ny = (ty(j) + ty((j + 1) % n)) / 2;
        ctx.quadraticCurveTo(tx(j), ty(j), nx, ny);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + p.col + ',' + (p.a * cfg.opacity).toFixed(3) + ')';
      ctx.fill();
    }
  }

  function loop(ts) {
    var dt = Math.min((ts - last) / 1000, 0.05) || 0; last = ts;
    step(dt); paint();
    raf = requestAnimationFrame(loop);
  }

  function init() {
    if (started) return; started = true;
    canvas = document.createElement('canvas');
    canvas.className = 'ante-evidence-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    if (reduce) { step(0); paint(); return; }       // static
    if (hover) window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }

  window.AnteEvidencePoints = {
    cfg: cfg,
    init: init,
    rebuild: function () { if (W) make(); }
  };

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
