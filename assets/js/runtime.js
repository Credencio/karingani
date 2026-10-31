/* Motor do dashboard (sem dependências além da d3).
   Carrega os ficheiros JSON de data/, executa os cálculos (dash.calc) e redesenha
   os elementos marcados com data-draw sempre que os dados, os filtros, o tamanho
   da janela ou o separador visível mudam. */
(function () {
  'use strict';
  const SOURCES = window.DASH_SOURCES || {};
  const DEFAULTS = Object.assign({}, window.DASH_PARAMS || {});
  let params = Object.assign({}, DEFAULTS);

  const files = {};      // id -> {status, data, message}
  const calcs = {};      // id -> {inputs, fn, result}
  const draws = new Map(); // nome -> função de desenho
  const dataHooks = [];

  function load(id) {
    if (files[id]) return;
    if (!SOURCES[id]) { files[id] = { status: 'missing', data: [], message: 'Fonte desconhecida: ' + id }; return; }
    files[id] = { status: 'loading', data: [] };
    fetch(SOURCES[id], { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status + ' ao ler ' + SOURCES[id]); return r.json(); })
      .then(d => {
        const rows = Array.isArray(d) ? d : (d.rows || d.data || d.results || []);
        files[id] = { status: 'ok', data: rows };
        schedule();
      })
      .catch(e => {
        console.error('[dashboard] Falha ao carregar', id, e);
        files[id] = { status: 'error', data: [], message: String(e) };
        schedule();
      });
  }

  function data(id) {
    const c = calcs[id];
    if (c) {
      if (c.result) return c.result;
      const ins = c.inputs.map(data);
      if (ins.some(x => x.status === 'error' || x.status === 'missing')) return { status: 'error', data: [], message: 'Uma das fontes do cálculo falhou' };
      if (ins.some(x => x.status !== 'ok')) return { status: 'loading', data: [] };
      try {
        const out = c.fn(...ins.map(x => x.data));
        c.result = { status: 'ok', data: out, columns: out && out[0] ? Object.keys(out[0]) : [], meta: [] };
      } catch (e) {
        console.error('[dashboard] Erro no cálculo', id, e);
        c.result = { status: 'error', data: [], message: String(e) };
      }
      return c.result;
    }
    load(id);
    const f = files[id];
    return { status: f.status, data: f.data, message: f.message, refreshing: false, meta: [], columns: f.data[0] ? Object.keys(f.data[0]) : [] };
  }

  const isShown = el => el.isConnected && !el.closest('[hidden]');

  function runDraw(name) {
    const fn = draws.get(name);
    if (!fn) return;
    document.querySelectorAll('[data-draw]').forEach(el => {
      if (el.getAttribute('data-draw') !== name || !isShown(el)) return;
      try { fn(el); } catch (e) { console.error('[dashboard] Erro no desenho', name, e); }
    });
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      dataHooks.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
      for (const name of draws.keys()) runDraw(name);
    });
  }

  const palette = () => {
    const cs = getComputedStyle(document.documentElement);
    return [1, 2, 3, 4, 5, 6, 7, 8].map(i => cs.getPropertyValue('--series-' + i).trim() || '#888');
  };

  window.dash = {
    data,
    calc(id, def) { calcs[id] = { inputs: def.inputs || [], fn: def.fn, title: def.title, description: def.description }; },
    loader() { /* não usado em ficheiros estáticos */ },
    draw(name, fn) {
      if (fn === undefined) { runDraw(name); return; }
      draws.set(name, typeof fn === 'function' ? fn : (fn.update || (() => {})));
      schedule();
    },
    onData(fn) { dataHooks.push(fn); schedule(); },
    params: () => Object.assign({}, params),
    setParams(obj) {
      for (const [k, v] of Object.entries(obj || {})) { if (v === null || v === undefined) delete params[k]; else params[k] = v; }
      schedule();
    },
    resetParams() { params = Object.assign({}, DEFAULTS); schedule(); },
    setLink(name) { try { history.replaceState(null, '', name ? '#' + name : location.pathname + location.search); } catch (e) { /* ignorar */ } },
    refresh(id) { delete files[id]; Object.values(calcs).forEach(c => { c.result = null; }); schedule(); },
    get colors() { return palette(); }
  };

  // Redesenhar quando um separador fica visível, a janela muda de tamanho ou o tema muda.
  document.addEventListener('DOMContentLoaded', () => {
    const mo = new MutationObserver(schedule);
    document.querySelectorAll('.kx-page').forEach(sec => mo.observe(sec, { attributes: true, attributeFilter: ['hidden'] }));
    schedule();
  });
  let lastW = window.innerWidth, t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(window.innerWidth - lastW) > 4) { lastW = window.innerWidth; schedule(); } }, 150); });
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', schedule);
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();
