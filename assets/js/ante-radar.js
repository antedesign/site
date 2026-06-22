/* ============================================================
   ante-radar.js — energetic radar build-up + magnetic cursor
   Pure SVG + vanilla JS. No dependencies.

   Usage:
     const r = AnteRadar.render(container, dims, options);
     // dims: { stakeholder:{pct}, market:{pct}, concept:{pct},
     //         technical:{pct}, resource:{pct} }
     // options: { bend, radius, springBack, intro }
     r.setOptions({ bend: 40 });
     r.replay();          // re-run the intro animation
     r.destroy();

   Respects prefers-reduced-motion (renders the final shape, no
   motion, no cursor interaction) and only enables the magnetic
   pull on hover-capable (desktop) pointers.
   ============================================================ */
(function () {
  'use strict';

  var SVGNS  = 'http://www.w3.org/2000/svg';
  var CENTER = { x: 150, y: 150 };
  var R      = 100;
  var KEYS   = ['stakeholder', 'market', 'concept', 'technical', 'resource'];
  var LABELS = ['Stakeholder', 'Market', 'Concept', 'Technical', 'Resources'];

  function mq(q) { return window.matchMedia && window.matchMedia(q).matches; }
  var reduceMotion = function () { return mq('(prefers-reduced-motion: reduce)'); };
  var hoverPointer = function () { return mq('(hover: hover) and (pointer: fine)'); };

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }

  function el(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function axisPoint(i, frac) {
    var a = Math.PI / 2 - (2 * Math.PI / KEYS.length) * i;
    return { x: CENTER.x + R * frac * Math.cos(a), y: CENTER.y - R * frac * Math.sin(a) };
  }

  function render(container, dims, options) {
    var opts = Object.assign({ bend: 32, radius: 130, springBack: 16, intro: 1 }, options || {});
    var reduce = reduceMotion();
    var interactive = hoverPointer() && !reduce;

    var values = KEYS.map(function (k) { return clamp01((dims[k] ? dims[k].pct : 0) / 100); });
    var base = values.map(function (v, i) { return axisPoint(i, v); });

    /* ── Build SVG ─────────────────────────────────────── */
    container.innerHTML = '';
    var svg = el('svg', { viewBox: '-34 -28 368 356', width: '100%', role: 'img' });
    svg.style.cssText = 'max-width:min(560px,92vw);display:block;margin:0 auto;overflow:visible;touch-action:none;';

    // concentric rings
    var rings = [0.33, 0.66, 1].map(function (level) {
      var pts = KEYS.map(function (_, i) { return axisPoint(i, level); });
      var d = pts.map(function (p, j) { return (j ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1); }).join(' ') + ' Z';
      var path = el('path', { d: d, fill: 'none', stroke: 'rgba(40,41,43,0.10)', 'stroke-width': 1 });
      svg.appendChild(path); return path;
    });

    // axes
    var axes = KEYS.map(function (_, i) {
      var p = axisPoint(i, 1);
      var line = el('line', { x1: CENTER.x, y1: CENTER.y, x2: p.x.toFixed(1), y2: p.y.toFixed(1), stroke: 'rgba(40,41,43,0.16)', 'stroke-width': 1 });
      svg.appendChild(line); return line;
    });

    // data polygon
    var shape = el('path', { fill: 'rgba(156,227,248,0.34)', stroke: '#206A5B', 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    svg.appendChild(shape);

    // vertices
    var dots = base.map(function () {
      var c = el('circle', { r: 0, fill: '#206A5B', stroke: '#FFFFFF', 'stroke-width': 2 });
      svg.appendChild(c); return c;
    });

    // labels
    var labels = KEYS.map(function (_, i) {
      var p = axisPoint(i, 1.36);
      var t = el('text', {
        x: p.x.toFixed(1), y: p.y.toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
        'font-family': "'JetBrains Mono', monospace", 'font-size': 9, fill: 'rgba(40,41,43,0.55)', 'letter-spacing': 1
      });
      t.textContent = LABELS[i]; t.style.opacity = 0;
      svg.appendChild(t); return t;
    });

    container.appendChild(svg);

    // dash lengths for draw-in
    axes.forEach(function (l) {
      var len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
      l.style.strokeDasharray = len; l._len = len;
    });
    rings.forEach(function (p) { var len = p.getTotalLength(); p.style.strokeDasharray = len; p._len = len; });

    var BASE_PR = 5.2;
    var off = base.map(function () { return { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }; });
    var cursor = { x: 0, y: 0, active: false };

    function draw(g, t) {
      var P = base.map(function (b, i) {
        return {
          x: CENTER.x + (b.x - CENTER.x) * g + off[i].x,
          y: CENTER.y + (b.y - CENTER.y) * g + off[i].y
        };
      });

      var d = 'M' + P[0].x.toFixed(2) + ',' + P[0].y.toFixed(2);
      for (var i = 0; i < P.length; i++) {
        var a = P[i], b = P[(i + 1) % P.length];
        var cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        if (cursor.active) {
          var dx = cursor.x - cx, dy = cursor.y - cy, dist = Math.hypot(dx, dy);
          var f = dist < opts.radius ? smooth(1 - dist / opts.radius) : 0;
          cx += (dx / (dist || 1)) * opts.bend * 0.55 * f;
          cy += (dy / (dist || 1)) * opts.bend * 0.55 * f;
        }
        d += ' Q' + cx.toFixed(2) + ',' + cy.toFixed(2) + ' ' + b.x.toFixed(2) + ',' + b.y.toFixed(2);
      }
      d += ' Z';
      shape.setAttribute('d', d);

      var pr = clamp(BASE_PR * g, 0, BASE_PR * 1.7);
      dots.forEach(function (c, i) {
        c.setAttribute('cx', P[i].x.toFixed(2));
        c.setAttribute('cy', P[i].y.toFixed(2));
        c.setAttribute('r', pr.toFixed(2));
      });

      rings.forEach(function (p, i) { var pp = smooth((t - i * 0.08) / 0.4); p.style.strokeDashoffset = p._len * (1 - pp); });
      axes.forEach(function (l, i) { var pp = smooth((t - 0.1 - i * 0.05) / 0.4); l.style.strokeDashoffset = l._len * (1 - pp); });
      labels.forEach(function (tx, i) { tx.style.opacity = clamp01((t - 0.55 - i * 0.05) / 0.4); });
    }

    /* ── Reduced motion: final frame only ───────────────── */
    if (reduce) {
      draw(1, 2);
      return { setOptions: function (o) { Object.assign(opts, o); }, replay: function () {}, destroy: function () {} };
    }

    /* ── Animation loop (intro spring + magnetic spring) ── */
    var g = 0, gv = 0, t0 = null, raf = null, running = false, dead = false;

    function frame(ts) {
      if (dead) return;
      if (t0 == null) t0 = ts;
      var t = (ts - t0) / 1000;
      var dt = 1 / 60;

      // intro: damped spring with overshoot scaled by intro intensity
      var zeta = clamp(0.34 / opts.intro, 0.10, 0.9);
      var omega = 7.6;
      var acc = omega * omega * (1 - g) - 2 * zeta * omega * gv;
      gv += acc * dt; g += gv * dt;

      // magnetic vertices
      if (interactive) {
        for (var i = 0; i < off.length; i++) {
          var o = off[i];
          if (cursor.active) {
            var dx = cursor.x - base[i].x, dy = cursor.y - base[i].y, dist = Math.hypot(dx, dy);
            var f = dist < opts.radius ? smooth(1 - dist / opts.radius) : 0;
            o.tx = (dx / (dist || 1)) * opts.bend * f;
            o.ty = (dy / (dist || 1)) * opts.bend * f;
          } else { o.tx = 0; o.ty = 0; }
          var k = opts.springBack;
          var damp = 2 * Math.sqrt(k) * 0.62;
          o.vx += (k * (o.tx - o.x) - damp * o.vx) * dt;
          o.vy += (k * (o.ty - o.y) - damp * o.vy) * dt;
          o.x += o.vx * dt; o.y += o.vy * dt;
        }
      }

      draw(g, t);

      var introDone = Math.abs(1 - g) < 0.0008 && Math.abs(gv) < 0.0008 && t > 1.6;
      var moving = interactive && off.some(function (o) {
        return cursor.active || Math.abs(o.x) > 0.04 || Math.abs(o.vx) > 0.04 || Math.abs(o.y) > 0.04 || Math.abs(o.vy) > 0.04;
      });
      if (!introDone || moving) { raf = requestAnimationFrame(frame); }
      else { running = false; }
    }

    function start() { if (!running && !dead) { running = true; raf = requestAnimationFrame(frame); } }

    /* ── Pointer → SVG-space mapping ─────────────────────── */
    function toLocal(e) {
      var ctm = svg.getScreenCTM(); if (!ctm) return;
      var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      var loc = p.matrixTransform(ctm.inverse());
      cursor.x = loc.x; cursor.y = loc.y;
    }
    function onMove(e) { toLocal(e); cursor.active = true; start(); }
    function onLeave() { cursor.active = false; start(); }

    if (interactive) {
      svg.addEventListener('pointermove', onMove, { passive: true });
      svg.addEventListener('pointerleave', onLeave, { passive: true });
    }

    start();

    return {
      setOptions: function (o) { Object.assign(opts, o); start(); },
      replay: function () { g = 0; gv = 0; t0 = null; off.forEach(function (o) { o.x = o.y = o.vx = o.vy = 0; }); start(); },
      destroy: function () {
        dead = true; if (raf) cancelAnimationFrame(raf);
        if (interactive) { svg.removeEventListener('pointermove', onMove); svg.removeEventListener('pointerleave', onLeave); }
      }
    };
  }

  window.AnteRadar = { render: render };
})();
