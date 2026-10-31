/* Desenhos: liga cada elemento data-draw da página aos dados e às ferramentas de desenho. */
/* ---------------- Desenhos ---------------- */
dash.draw('val', (el) => {
  const d = dash.data(el.dataset.source);
  if (d.status !== 'ok') { el.textContent = '—'; el.classList.toggle('dash-skeleton', d.status === 'loading'); return; }
  el.classList.remove('dash-skeleton');
  let row = d.data[0];
  if (el.dataset.where) {
    const conds = el.dataset.where.split('&').map(p => p.split('=').map(decodeURIComponent));
    row = d.data.find(r => conds.every(([k, v]) => String(r[k]) === v));
  }
  el.textContent = row ? kx.fmt(row[el.dataset.field], el.dataset.fmt) : '—';
});

dash.draw('tbl', (el) => {
  const table = el.closest('table'); if (!table) return;
  const id = table.dataset.source, d = dash.data(id);
  el.replaceChildren();
  if (d.status !== 'ok') return;
  let rows = d.data;
  if (table.dataset.kxFilter) { const [k, v] = table.dataset.kxFilter.split('='); rows = rows.filter(r => String(r[k]) === v); }
  const ths = [...table.querySelectorAll('thead th')];
  for (const r of rows) {
    const tr = document.createElement('tr');
    for (const th of ths) {
      const td = document.createElement('td');
      const v = r[th.dataset.field];
      td.textContent = kx.fmt(v, th.dataset.fmt);
      if (th.classList.contains('n')) td.className = 'n';
      else if (typeof v === 'string' && v.length > 50) td.className = 'w';
      tr.append(td);
    }
    el.append(tr);
  }
});

// Vegetação
dash.draw('c-s13-ivi', (el) => { if (!kx.prep(el, ['s13_ivi'])) return; kx.bars(el, { rows: dash.data('s13_ivi').data.slice(0, 15), cat: 'especie', series: [{ key: 'ivi', label: 'IVI' }], horizontal: true, fmt: 'd1' }); });
dash.draw('c-s13-fam', (el) => { if (!kx.prep(el, ['s13_familias'])) return; kx.bars(el, { rows: dash.data('s13_familias').data, cat: 'familia', series: [{ key: 'individuos', label: 'Indivíduos' }], horizontal: true, fmt: 'int', color: dash.colors[1] }); });
dash.draw('c-s13-dap', (el) => { if (!kx.prep(el, ['s13_dap'])) return; kx.bars(el, { rows: dash.data('s13_dap').data, cat: 'classe', series: [{ key: 'individuos', label: 'Árvores' }], fmt: 'int' }); });
dash.draw('c-s13-alt', (el) => { if (!kx.prep(el, ['s13_altura'])) return; kx.bars(el, { rows: dash.data('s13_altura').data, cat: 'classe', series: [{ key: 'individuos', label: 'Árvores' }], fmt: 'int', color: dash.colors[2] }); });
dash.draw('c-s13-estado', (el) => { if (!kx.prep(el, ['s13_estado'])) return; kx.cards(el, { rows: dash.data('s13_estado').data.filter(r => r.indicador === el.dataset.kxInd), cat: 'categoria', val: 'individuos', pct: 'pct' }); });
dash.draw('c-s13-func', (el) => { if (!kx.prep(el, ['s13_funcoes'])) return; kx.cards(el, { rows: dash.data('s13_funcoes').data, cat: 'funcao', val: 'individuos', pct: 'pct' }); });
dash.draw('c-s13-prio', (el) => { if (!kx.prep(el, ['s13_prioridade'])) return; kx.bars(el, { rows: dash.data('s13_prioridade').data, cat: 'prioridade', series: [{ key: 'arvores', label: 'Árvores' }], fmt: 'int', color: dash.colors[4] }); });

// Estratos
const kxEstratos = (rows) => [...new Set(rows.map(r => r.estrato))].sort().map(e => ({ key: e, label: e }));
dash.draw('c-s2-classes', (el) => {
  if (!kx.prep(el, ['s2_classes'])) return;
  const sel = document.querySelector('#kx-s2-var');
  const [grupo, variavel] = (sel ? sel.value : 'Árvores|dap').split('|');
  const rows = dash.data('s2_classes').data.filter(r => r.grupo === grupo && r.variavel === variavel);
  const S = kxEstratos(rows);
  const cats = [...new Map(rows.map(r => [r.classe, r.ordem]))].sort((a, b) => a[1] - b[1]).map(c => c[0]);
  const wide = cats.map(c => Object.fromEntries([['classe', c], ...S.map(s => [s.key, (rows.find(r => r.classe === c && r.estrato === s.key) || {}).registos || 0])]));
  kx.bars(el, { rows: wide, cat: 'classe', series: S, fmt: 'int' });
});
dash.draw('c-s2-div', (el) => {
  if (!kx.prep(el, ['s2_diversidade'])) return;
  const sel = document.querySelector('#kx-s2-grupo');
  const grupo = sel ? sel.value : 'Árvores';
  const rows = dash.data('s2_diversidade').data.filter(r => r.grupo === grupo);
  kx.bars(el, { rows, cat: 'estrato', series: [{ key: 'shannon', label: 'Shannon (H′)' }, { key: 'simpson', label: 'Simpson (1 − D)' }, { key: 'pielou', label: 'Pielou (J′)' }], fmt: 'd2' });
});
dash.draw('c-s2-ivi', (el) => { if (!kx.prep(el, ['s2_ivi'])) return; kx.bars(el, { rows: dash.data('s2_ivi').data.slice(0, 13), cat: 'especie', series: [{ key: 'ivi', label: 'IVI' }], horizontal: true, fmt: 'd1' }); });
dash.draw('c-s2-ni', (el) => {
  if (!kx.prep(el, ['s2_ivi'])) return;
  const rows = [...dash.data('s2_ivi').data].sort((a, b) => b.individuos - a.individuos).slice(0, 10);
  kx.bars(el, { rows, cat: 'especie', series: [{ key: 'Herbaceas', label: 'Herbaceas' }, { key: 'Matagal', label: 'Matagal' }, { key: 'Moita', label: 'Moita' }], horizontal: true, fmt: 'int' });
});
document.querySelectorAll('#kx-s2-var').forEach(s => s.addEventListener('change', () => dash.draw('c-s2-classes')));
document.querySelectorAll('#kx-s2-grupo').forEach(s => s.addEventListener('change', () => dash.draw('c-s2-div')));

// Translocação
dash.draw('c-s4-esp', (el) => {
  if (!kx.prep(el, ['s4_especies'])) return;
  kx.bars(el, { rows: dash.data('s4_especies').data, cat: 'especie', series: [{ key: 'translocar', label: 'Translocar' }, { key: 'reter', label: 'Reter' }, { key: 'remover', label: 'Remover' }], horizontal: true, fmt: 'int' });
});
dash.draw('c-s4-donut', (el) => { const id = el.dataset.kxSrc; if (!kx.prep(el, [id])) return; kx.cards(el, { rows: dash.data(id).data, cat: el.dataset.kxCat, val: 'arvores', pct: 'pct' }); });
dash.draw('c-s4-classes', (el) => {
  if (!kx.prep(el, ['s4_classes'])) return;
  const rows = dash.data('s4_classes').data.filter(r => r.variavel === el.dataset.kxVar);
  const cats = [...new Map(rows.map(r => [r.classe, r.ordem]))].sort((a, b) => a[1] - b[1]).map(c => c[0]);
  const S = [{ key: 'Translocar', label: 'Translocar' }, { key: 'Reter', label: 'Reter' }, { key: 'Remover', label: 'Remover' }];
  const wide = cats.map(c => Object.fromEntries([['classe', c], ...S.map(s => [s.key, (rows.find(r => r.classe === c && r.decisao === s.key) || {}).arvores || 0])]));
  kx.bars(el, { rows: wide, cat: 'classe', series: S, fmt: 'int' });
});

// Fauna
dash.draw('c-fa-esp', (el) => { if (!kx.prep(el, ['fauna_especies'])) return; kx.bars(el, { rows: dash.data('fauna_especies').data, cat: 'especie', series: [{ key: 'registos', label: 'Registos' }], horizontal: true, fmt: 'int' }); });
// Ficha de espécie
const kxSp = () => dash.params().especie || 'Colophospermum mopane';
dash.draw('sel-especie', (sel) => {
  const g = dash.data('especies_ficha');
  const cur = kxSp();
  sel.replaceChildren(...(g.status === 'ok' ? g.data : [{ especie: cur }]).map(r => new Option(r.especie, r.especie)));
  sel.value = cur;
  sel.onchange = () => dash.setParams({ especie: sel.value });
});
dash.draw('ficha', (el) => {
  const sp = kxSp();
  el.dataset.where = 'especie=' + encodeURIComponent(sp);
  const d = dash.data('especies_ficha');
  if (d.status !== 'ok') { el.textContent = '—'; el.classList.toggle('dash-skeleton', d.status === 'loading'); return; }
  el.classList.remove('dash-skeleton');
  const row = d.data.find(r => r.especie === sp);
  el.textContent = row ? kx.fmt(row[el.dataset.field], el.dataset.fmt) : '—';
});
dash.draw('c-sp-dap', (el) => {
  if (!kx.prep(el, ['s13_dap_especie'])) return;
  const rows = dash.data('s13_dap_especie').data.filter(r => r.especie === kxSp()).sort((a, b) => a.ordem - b.ordem);
  kx.bars(el, { rows, cat: 'classe', series: [{ key: 'individuos', label: 'Árvores' }], fmt: 'int' });
});
dash.draw('c-map-s13', (el) => {
  if (!kx.prep(el, ['s13_arvores'])) return;
  const sp = kxSp(), all = dash.data('s13_arvores').data;
  const on = all.filter(r => r.especie === sp), off = all.filter(r => r.especie !== sp);
  kx.map(el, {
    layers: [{ rows: off, color: 'var(--cds-chart-muted)', r: 1.6, alpha: 0.45 }, { rows: on, color: dash.colors[0], r: 2.4, alpha: 0.9 }],
    pick: on,
    tip: (p) => [p.especie, [kxT('dbh') + ' ' + kx.fmt(p.dap_cm, 'd1') + ' cm · ' + kxT('height') + ' ' + kx.fmt(p.altura_m, 'd1') + ' m', kxT('condition') + ': ' + kx.fmt(p.condicao)]],
    legend: [{ label: sp, color: dash.colors[0] }, { label: kxT('other'), color: 'var(--cds-chart-muted)' }]
  });
});
dash.draw('c-map-s4', (el) => {
  if (!kx.prep(el, ['s4_arvores'])) return;
  const sel = document.querySelector('#kx-s4-cor');
  const by = sel ? sel.value : 'decisao';
  const rows = dash.data('s4_arvores').data;
  const cats = by === 'zona' ? ['Dentro', 'Fora'] : ['Translocar', 'Reter', 'Remover'];
  const label = c => by === 'zona' ? kxV(c) + kxT('zoneSuffix') : c;
  kx.map(el, {
    layers: cats.map((c, i) => ({ rows: rows.filter(r => r[by] === c), color: dash.colors[i], r: 3, alpha: 0.85 })),
    pick: rows,
    tip: (p) => [(p.etiqueta || '') + ' · ' + p.especie, [kxT('dbh') + ' ' + kx.fmt(p.dap_cm, 'd1') + ' cm · ' + kxT('height') + ' ' + kx.fmt(p.altura_m, 'd1') + ' m', kxV(p.decisao) + ' · ' + kxV(p.zona) + kxT('zoneShort')]],
    legend: cats.map((c, i) => ({ label: label(c), color: dash.colors[i] }))
  });
});
document.querySelectorAll('#kx-s4-cor').forEach(s => s.addEventListener('change', () => dash.draw('c-map-s4')));

dash.draw('c-fa-nin', (el) => { if (!kx.prep(el, ['fauna_ninhos_estado'])) return; kx.cards(el, { rows: dash.data('fauna_ninhos_estado').data, cat: 'estado_grupo', val: 'ninhos', pct: 'pct' }); });
