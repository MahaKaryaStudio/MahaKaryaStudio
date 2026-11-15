const { chromium } = require('playwright');
const GL = ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'];
const U = 'http://127.0.0.1:8911/index.html?';
// DevTools "Slow 4G": 1,6 Mbps turun, 750 kbps naik, RTT 150 ms (nilai emulasi DevTools: ×0,9 dan latensi 562,5 ms)
const SLOW4G = { offline: false, downloadThroughput: (1.6 * 1024 * 1024 / 8) * 0.9, uploadThroughput: (750 * 1024 / 8) * 0.9, latency: 562.5 };
const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
async function run(b, query, throttle, vp) {
  const ctx = await b.newContext({ viewport: vp || { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable'); const sizes = {};
  const urls = {}; cdp.on('Network.requestWillBeSent', (e) => (urls[e.requestId] = e.request.url)); cdp.on('Network.loadingFinished', (e) => { const u = (urls[e.requestId] || '').split('/').pop().split('?')[0]; sizes[u] = e.encodedDataLength; });
  if (throttle) { await cdp.send('Network.emulateNetworkConditions', SLOW4G); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  await p.goto(U + query, { waitUntil: 'commit' });
  await p.waitForFunction(() => window.__firstFrame || window.__done, null, { timeout: 120000 });
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const res = performance.getEntriesByType('resource').find((e) => e.name.includes('lamp3d.min.js'));
    const nav = performance.getEntriesByType('navigation')[0];
    return { svgReady: window.__svgReady, importStart: window.__t && window.__t.t0, moduleFetched: res && res.responseEnd, moduleEvaluated: window.__t && window.__t.tLoaded, firstFrame: window.__firstFrame || null, dcl: nav.domContentLoadedEventEnd };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await p.evaluate(() => { if (window.gc) { gc(); gc(); } });
  await p.waitForTimeout(200);
  const m = await cdp.send('Performance.getMetrics').catch(() => null);
  await cdp.send('Performance.enable'); const m2 = await cdp.send('Performance.getMetrics');
  r.jsHeapMB = +(m2.metrics.find((x) => x.name === 'JSHeapUsedSize').value / 1048576).toFixed(2);
  r.sizes = sizes;
  await ctx.close();
  return r;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: GL });
  const out = {};
  for (const [name, query, throttle] of [['svgOnly_throttled', 'ed=0&auto=0&no3d=1', true], ['with3d_throttled', 'ed=0&auto=0', true], ['svgOnly_unthrottled', 'ed=0&auto=0&no3d=1', false], ['with3d_unthrottled', 'ed=0&auto=0', false]]) {
    const runs = []; for (let i = 0; i < 3; i++) runs.push(await run(b, query, throttle));
    const keys = ['svgReady', 'importStart', 'moduleFetched', 'moduleEvaluated', 'firstFrame', 'jsHeapMB'];
    out[name] = Object.fromEntries(keys.map((k) => [k, runs[0][k] == null ? null : Math.round(med(runs.map((r) => r[k])) * 10) / 10]));
    out[name].all_firstFrame = runs.map((r) => r.firstFrame && Math.round(r.firstFrame));
    out[name].sizes = runs[0].sizes;
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
