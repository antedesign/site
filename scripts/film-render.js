#!/usr/bin/env node
// Renders /film/ to MP4 (and optional per-scene clips). Needs: node, playwright (npm i playwright), ffmpeg.
//   node scripts/film-render.js --cut=20 --size=1920x1080 --out=/tmp/film [--clips]
//   --cut=20|full   --scenes=hook,answers,...   --size=WxH (1080x1920 = vertical)   --fps=30
const http = require('http'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const a = Object.fromEntries(process.argv.slice(2).map(x => x.replace(/^--/, '').split('=')).map(([k, v]) => [k, v === undefined ? true : v]));
const [W, H] = (a.size || '1920x1080').split('x').map(Number), fps = +(a.fps || 30), out = path.resolve(a.out || 'film-out');
const root = path.resolve(__dirname, '..'), types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => e ? (r.writeHead(404), r.end()) : (r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }), r.end(d)));
}).listen(0);
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  const qs = new URLSearchParams({ render: 1, ...(a.scenes ? { scenes: a.scenes } : { cut: a.cut || 20 }) });
  await p.goto(`http://localhost:${srv.address().port}/film/?${qs}`);
  await p.waitForFunction('window.__ready'); await p.waitForTimeout(500);
  const film = await p.evaluate('FILM'), n = Math.round(film.total * fps), fr = path.join(out, `frames-${W}x${H}-${a.scenes ? 'custom' : (a.cut || 20)}`); fs.mkdirSync(fr, { recursive: true });
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => setT(t), (i / fps).toFixed(4));
    await p.screenshot({ path: `${fr}/f${String(i).padStart(5, '0')}.png` });
  }
  await b.close(); srv.close();
  const name = `anteslim-${a.scenes ? 'custom' : (a.cut || 20)}-${W}x${H}`.replace('anteslim', 'ante'), mp4 = path.join(out, name + '.mp4');
  const ff = (...x) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...x]);
  ff('-framerate', fps, '-i', `${fr}/f%05d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', 17, '-movflags', '+faststart', mp4);
  fs.rmSync(fr, { recursive: true });
  if (a.clips) {
    const cd = path.join(out, 'clips-' + W + 'x' + H); fs.mkdirSync(cd, { recursive: true });
    film.scenes.forEach((s, i) => {
      const from = i ? s.start - .5 : 0, to = i === film.scenes.length - 1 ? s.start + s.dur : s.start + s.dur - .5;
      ff('-ss', from, '-i', mp4, '-t', to - from, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', 17, '-movflags', '+faststart', path.join(cd, String(i + 1).padStart(2, '0') + '-' + s.id + '.mp4'));
    });
  }
  console.log(mp4, film.total + ' s');
})();
