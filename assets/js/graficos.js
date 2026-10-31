/* Ferramentas de desenho: formatação, gráficos de barras, donuts e mapas (d3). */
/* ---------------- Ferramentas de desenho ---------------- */
window.kx = (() => {
  // Formatos de número por língua: inglês 1,234.5 · português 1 234,5
  const mk = (loc) => ({ int: loc.format(',.0f'), d1: loc.format(',.1f'), d2: loc.format(',.2f'), d3: loc.format(',.3f'), pct1: v => loc.format(',.1f')(v) + '%', pct2: v => loc.format(',.2f')(v) + '%' });
  const FMT = { pt: mk(d3.formatLocale({ decimal: ',', thousands: '\u00a0', grouping: [3], currency: ['', ''] })), en: mk(d3.formatLocale({ decimal: '.', thousands: ',', grouping: [3], currency: ['', ''] })) };
  const lang = () => (window.kxLang ? window.kxLang() : 'en');
  const tr = (v) => (window.kxV ? window.kxV(v) : v);
  const T = (k) => (window.kxT ? window.kxT(k) : k);
  const fmt = (v, f) => {
    if (v === null || v === undefined || v === '') return '—';
    const F = FMT[lang()] || FMT.en;
    if (f && F[f]) { const x = Number(v); return Number.isFinite(x) ? F[f](x) : tr(String(v)); }
    return tr(String(v));
  };
  const status = (ids) => {
    let st = 'ok';
    for (const id of ids) { const s = dash.data(id).status; if (s === 'error' || s === 'missing' || s === 'declined' || s === 'connect') return 'error'; if (s !== 'ok') st = 'loading'; }
    return st;
  };
  const prep = (el, ids) => {
    const st = status(ids);
    el.classList.toggle('dash-skeleton', st === 'loading');
    if (st === 'ok') return true;
    el.replaceChildren();
    if (st === 'error') { const d = document.createElement('div'); d.className = 'kx-fail'; d.append(document.createElement('i'), document.createTextNode(T('fail'))); el.append(d); }
    return false;
  };
  const tipFor = (el) => { const t = document.createElement('div'); t.className = 'kx-tip'; t.hidden = true; el.append(t); return t; };
  const showTip = (el, tip, ev, head, lines) => {
    tip.replaceChildren();
    const h = document.createElement('div'); h.className = 'kx-tip-h'; h.textContent = head; tip.append(h);
    for (const [color, label, value] of lines) {
      const d = document.createElement('div');
      if (color) { const s = document.createElement('span'); s.className = 'kx-sw'; s.style.background = color; d.append(s); }
      d.append(document.createTextNode((label ? label + ': ' : '') + value)); tip.append(d);
    }
    tip.hidden = false;
    const b = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = ev.clientX - b.left + 12, y = ev.clientY - b.top - th - 8;
    if (x + tw > b.width) x = Math.max(0, ev.clientX - b.left - tw - 12);
    if (y < 0) y = ev.clientY - b.top + 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  };
  const legend = (el, series, colors) => {
    if (series.length < 2) return;
    const lg = document.createElement('div'); lg.className = 'kx-legend';
    series.forEach((s, i) => { const sp = document.createElement('span'); const sw = document.createElement('i'); sw.className = 'kx-sw'; sw.style.background = colors[i]; sp.append(sw, document.createTextNode(tr(s.label))); lg.append(sp); });
    el.append(lg);
  };
  const measure = (svg, texts, cls) => {
    const t = svg.append('text').attr('class', cls || 'kx-tick'); let w = 0;
    for (const s of texts) { t.text(s); w = Math.max(w, t.node().getComputedTextLength()); }
    t.remove(); return w;
  };
  // rows: [{[cat]: label, [series.key]: value}], series: [{key,label}]
  const bars = (el, o) => {
    el.replaceChildren();
    const rows = o.rows, S = o.series, W = Math.max(260, Math.floor(el.clientWidth || 600));
    const colors = S.map((s, i) => S.length === 1 ? (o.color || dash.colors[0]) : dash.colors[i % dash.colors.length]);
    const maxV = d3.max(rows, r => d3.max(S, s => Number(r[s.key]) || 0)) || 1;
    const svg = d3.select(el).append('svg').attr('width', '100%').attr('role', 'img');
    const tip = tipFor(el);
    const f = v => fmt(v, o.fmt || 'int');
    const hover = (sel) => sel.on('mousemove', (ev, d) => showTip(el, tip, ev, tr(d.cat), S.length === 1 ? [[null, tr(o.valueLabel || S[0].label), f(d.v)]] : S.map((s, i) => [colors[i], tr(s.label), f(d.row[s.key])])))
      .on('mouseleave', () => { tip.hidden = true; });
    if (o.horizontal) {
      let lw = Math.min(measure(svg, rows.map(r => tr(String(r[o.cat])))), W * 0.42);
      const vw = measure(svg, [f(maxV)], 'kx-vlab');
      const band = S.length > 1 ? 12 * S.length + 10 : 24;
      const m = { t: 4, r: vw + 12, b: 22, l: lw + 10 };
      const H = m.t + m.b + rows.length * band;
      svg.attr('viewBox', `0 0 ${W} ${H}`).attr('height', null);
      const y = d3.scaleBand(rows.map(r => String(r[o.cat])), [m.t, H - m.b]).paddingInner(0.22);
      const ys = d3.scaleBand(S.map(s => s.key), [0, y.bandwidth()]).padding(0.06);
      const x = d3.scaleLinear([0, maxV], [m.l, W - m.r]).nice();
      const ticks = x.ticks(Math.max(2, Math.floor((W - m.l - m.r) / 90)));
      svg.append('g').selectAll('line').data(ticks).join('line').attr('class', 'kx-grid-line').attr('x1', d => x(d)).attr('x2', d => x(d)).attr('y1', m.t).attr('y2', H - m.b);
      svg.append('g').selectAll('text').data(ticks).join('text').attr('class', 'kx-tick').attr('x', d => x(d)).attr('y', H - 6).attr('text-anchor', 'middle').text(d => f(d));
      svg.append('g').selectAll('text').data(rows).join('text').attr('class', 'kx-tick').attr('x', m.l - 8).attr('y', r => y(String(r[o.cat])) + y.bandwidth() / 2).attr('dy', '0.35em').attr('text-anchor', 'end')
        .text(r => tr(String(r[o.cat]))).each(function () { let s = this.textContent; while (s.length > 3 && this.getComputedTextLength() > lw) { s = s.slice(0, -2); this.textContent = s + '…'; } });
      const data = rows.flatMap(r => S.map((s, i) => ({ cat: String(r[o.cat]), key: s.key, v: Number(r[s.key]) || 0, i, row: r })));
      svg.append('g').selectAll('rect').data(data).join('rect').attr('x', m.l).attr('y', d => y(d.cat) + ys(d.key)).attr('height', Math.min(ys.bandwidth(), 28)).attr('width', d => Math.max(0, x(d.v) - m.l)).attr('rx', 2).attr('fill', d => colors[d.i]).call(hover);
      if (S.length === 1) svg.append('g').selectAll('text').data(data).join('text').attr('class', 'kx-vlab').attr('x', d => x(d.v) + 4).attr('y', d => y(d.cat) + ys(d.key) + Math.min(ys.bandwidth(), 28) / 2).attr('dy', '0.35em').text(d => f(d.v));
      svg.append('line').attr('class', 'kx-axis-line').attr('x1', m.l).attr('x2', m.l).attr('y1', m.t).attr('y2', H - m.b);
    } else {
      const H = o.height || 240;
      const x0 = rows.map(r => String(r[o.cat]));
      const y0 = d3.scaleLinear([0, maxV], [H - 30, 18]).nice();
      const yt = y0.ticks(4);
      const lw = measure(svg, yt.map(f));
      const m = { t: 18, r: 8, b: 30, l: lw + 10 };
      const x = d3.scaleBand(x0, [m.l, W - m.r]).paddingInner(0.25).paddingOuter(0.1);
      const catW = measure(svg, x0.map(tr));
      const rotate = catW > x.bandwidth() + 8;
      const bExtra = rotate ? Math.min(catW, 120) * 0.6 : 0;
      const Ht = H + bExtra;
      const y = d3.scaleLinear(y0.domain(), [H - m.b, m.t]);
      svg.attr('viewBox', `0 0 ${W} ${Ht}`);
      const xs = d3.scaleBand(S.map(s => s.key), [0, x.bandwidth()]).padding(0.08);
      svg.append('g').selectAll('line').data(yt).join('line').attr('class', 'kx-grid-line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', d => y(d)).attr('y2', d => y(d));
      svg.append('g').selectAll('text').data(yt).join('text').attr('class', 'kx-tick').attr('x', m.l - 6).attr('y', d => y(d)).attr('dy', '0.35em').attr('text-anchor', 'end').text(d => f(d));
      const cl = svg.append('g').selectAll('text').data(x0).join('text').attr('class', 'kx-tick').text(d => tr(d));
      if (rotate) cl.attr('transform', d => `translate(${x(d) + x.bandwidth() / 2},${H - m.b + 12}) rotate(-35)`).attr('text-anchor', 'end').attr('dy', '0.35em');
      else cl.attr('x', d => x(d) + x.bandwidth() / 2).attr('y', H - m.b + 16).attr('text-anchor', 'middle');
      const bw = Math.min(xs.bandwidth(), 32);
      const data = rows.flatMap(r => S.map((s, i) => ({ cat: String(r[o.cat]), key: s.key, v: Number(r[s.key]) || 0, i, row: r })));
      svg.append('g').selectAll('rect').data(data).join('rect').attr('x', d => x(d.cat) + xs(d.key) + (xs.bandwidth() - bw) / 2).attr('width', bw).attr('y', d => y(d.v)).attr('height', d => Math.max(0, y(0) - y(d.v))).attr('rx', 2).attr('fill', d => colors[d.i]).call(hover);
      if (S.length === 1 && x.bandwidth() > 26) svg.append('g').selectAll('text').data(data).join('text').attr('class', 'kx-vlab').attr('x', d => x(d.cat) + x.bandwidth() / 2).attr('y', d => y(d.v) - 5).attr('text-anchor', 'middle').text(d => f(d.v));
      svg.append('line').attr('class', 'kx-axis-line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0));
    }
    legend(el, S, colors);
  };
  const donut = (el, o) => {
    el.replaceChildren();
    const rows = o.rows.filter(r => Number(r[o.val]) > 0);
    const wrap = document.createElement('div'); wrap.className = 'kx-donut'; el.append(wrap);
    const size = Math.min(170, Math.max(120, (el.clientWidth || 300) * 0.4));
    const colors = rows.map((r, i) => dash.colors[i % dash.colors.length]);
    const svg = d3.select(wrap).append('svg').attr('width', size).attr('height', size).attr('viewBox', `0 0 ${size} ${size}`).attr('role', 'img');
    const tip = tipFor(el);
    const arcs = d3.pie().sort(null).value(r => Number(r[o.val]))(rows);
    const arc = d3.arc().innerRadius(size * 0.3).outerRadius(size / 2 - 2).padAngle(0.01);
    svg.append('g').attr('transform', `translate(${size / 2},${size / 2})`).selectAll('path').data(arcs).join('path').attr('d', arc).attr('fill', (d, i) => colors[i])
      .on('mousemove', (ev, d) => showTip(el, tip, ev, tr(String(d.data[o.cat])), [[null, null, fmt(d.data[o.val], 'int') + (o.pct ? ' · ' + fmt(d.data[o.pct], 'pct1') : '')]]))
      .on('mouseleave', () => { tip.hidden = true; });
    const list = document.createElement('div'); list.className = 'kx-dlist';
    rows.forEach((r, i) => {
      const d = document.createElement('div');
      const sw = document.createElement('i'); sw.className = 'kx-sw'; sw.style.background = colors[i];
      const a = document.createElement('span'); a.textContent = tr(String(r[o.cat]));
      const b = document.createElement('span'); b.textContent = fmt(r[o.val], 'int');
      const c = document.createElement('span'); c.className = 'kx-p'; c.textContent = o.pct ? fmt(r[o.pct], 'pct1') : '';
      d.append(sw, a, b, c); list.append(d);
    });
    wrap.append(list);
  };
  const cssColor = (el, c) => { const s = document.createElement('span'); s.style.color = c; el.append(s); const v = getComputedStyle(s).color; s.remove(); return v; };
  // layers: [{rows, color, r}] drawn in order; o.pick: rows for hover; o.tip(row) -> [head, lines]; o.legend: [{label, color}]
  const map = (el, o) => {
    el.replaceChildren();
    const okXY = r => Number.isFinite(r.lon) && Number.isFinite(r.lat) && Math.abs(r.lon) > 0.01 && Math.abs(r.lat) > 0.01;
    const pts = o.layers.flatMap(l => l.rows).filter(okXY);
    if (!pts.length) return;
    const W = Math.max(260, Math.floor(el.clientWidth || 600));
    const lons = pts.map(r => r.lon).sort(d3.ascending), lats = pts.map(r => r.lat).sort(d3.ascending);
    const qa = d3.quantileSorted(lons, 0.005), qb = d3.quantileSorted(lons, 0.995), qc = d3.quantileSorted(lats, 0.005), qd = d3.quantileSorted(lats, 0.995);
    const mx0 = (qb - qa) * 0.06 || 0.0005, my0 = (qd - qc) * 0.06 || 0.0005;
    const x0 = qa - mx0, x1 = qb + mx0, y0 = qc - my0, y1 = qd + my0;
    const inView = r => okXY(r) && r.lon >= x0 && r.lon <= x1 && r.lat >= y0 && r.lat <= y1;
    const hiddenN = o.layers.reduce((s, l) => s + l.rows.filter(r => !inView(r)).length, 0);
    const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
    const dx = Math.max((x1 - x0) * k, 1e-6), dy = Math.max(y1 - y0, 1e-6), pad = 14;
    const H = Math.round(Math.min(520, Math.max(260, (W - 2 * pad) * dy / dx + 2 * pad)));
    const s = Math.min((W - 2 * pad) / dx, (H - 2 * pad) / dy);
    const ox = (W - dx * s) / 2, oy = (H - dy * s) / 2;
    const px = r => ox + (r.lon - x0) * k * s, py = r => oy + (y1 - r.lat) * s;
    const dpr = window.devicePixelRatio || 1;
    const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px'; el.append(cv);
    const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    for (const l of o.layers) {
      ctx.fillStyle = cssColor(el, l.color); ctx.globalAlpha = l.alpha || 0.85; const r = l.r || 2.2;
      for (const p of l.rows) { if (!inView(p)) continue; ctx.beginPath(); ctx.arc(px(p), py(p), r, 0, 2 * Math.PI); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    const svg = d3.select(el).append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('height', H).attr('role', 'img');
    const mPerPx = 111320 / s, target = W / 5 * mPerPx;
    const nice = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000].reduce((a, b) => Math.abs(b - target) < Math.abs(a - target) ? b : a);
    const len = nice / mPerPx;
    const g = svg.append('g').attr('transform', `translate(${pad},${H - pad})`);
    g.append('line').attr('class', 'kx-axis-line').attr('x1', 0).attr('x2', len).attr('y1', 0).attr('y2', 0).style('stroke-width', 2);
    g.append('text').attr('class', 'kx-tick').attr('x', 0).attr('y', -6).text(nice >= 1000 ? fmt(nice / 1000, 'd1') + ' km' : nice + ' m');
    svg.append('text').attr('class', 'kx-tick').attr('x', W - pad).attr('y', pad + 8).attr('text-anchor', 'end').text('N ↑');
    const tip = tipFor(el);
    const pick = (o.pick || []).filter(inView);
    const del = pick.length ? d3.Delaunay.from(pick, px, py) : null;
    svg.on('mousemove', (ev) => {
      if (!del) return;
      const [mx, my] = d3.pointer(ev); const i = del.find(mx, my); const p = pick[i];
      if (!p || Math.hypot(px(p) - mx, py(p) - my) > 14) { tip.hidden = true; return; }
      const [head, lines] = o.tip(p); showTip(el, tip, ev, head, lines.map(t => [null, null, t]));
    }).on('mouseleave', () => { tip.hidden = true; });
    if (o.legend) legend(el, o.legend.map(x => ({ label: x.label })), o.legend.map(x => x.color));
    if (hiddenN) { const n = document.createElement('p'); n.className = 'kx-note'; n.textContent = fmt(hiddenN, 'int') + (hiddenN === 1 ? T('mapHidden1') : T('mapHiddenN')); el.append(n); }
  };
  // Cards: um por categoria, com o valor, a percentagem e uma barra de proporção.
  const cards = (el, o) => {
    el.replaceChildren();
    o.rows.forEach((r, i) => {
      const c = document.createElement('div'); c.className = 'kx-stat kx-t' + (i % 5 + 1);
      const l = document.createElement('span'); l.className = 'kx-stat-lab'; l.textContent = tr(String(r[o.cat]));
      const v = document.createElement('b'); v.className = 'kx-stat-num'; v.textContent = fmt(r[o.val], 'int');
      const p = document.createElement('span'); p.className = 'kx-stat-pct'; p.textContent = o.pct ? fmt(r[o.pct], 'pct1') : '';
      const bar = document.createElement('i'); bar.className = 'kx-stat-bar';
      const fill = document.createElement('i'); fill.style.width = Math.max(0, Math.min(100, Number(r[o.pct]) || 0)) + '%'; fill.style.background = 'var(--ink-' + (i % 5 + 1) + ')';
      bar.append(fill); c.append(l, v, p, bar); el.append(c);
    });
  };
  return { fmt, prep, bars, donut, map, cards };
})();
