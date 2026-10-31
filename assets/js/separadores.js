/* Separadores (tabs) da página. */
/* ---------------- Separadores ---------------- */
(() => {
  const tabs = [...document.querySelectorAll('.kx-tab')];
  const show = (name) => {
    document.querySelectorAll('.kx-page').forEach(s => { s.hidden = s.id !== name; });
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  };
  tabs.forEach(t => t.addEventListener('click', () => { show(t.dataset.tab); dash.setLink(t.dataset.tab); }));
  const start = location.hash.slice(1);
  if (tabs.some(t => t.dataset.tab === start)) show(start);
})();
