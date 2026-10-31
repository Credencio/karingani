/* Cálculos: cada dash.calc transforma os dados brutos (data/*.json) nas tabelas que os gráficos usam. */
/* ---------------- Cálculos: Surveys 1 e 3 ---------------- */
dash.calc('s13_resumo', {
  inputs: ['s13_arvores'], title: 'Vegetação · resumo',
  description: 'Totais, estatísticas do DAP e índices de Shannon, Simpson (1−D) e Pielou das árvores dos Surveys 1 e 3.',
  fn: (s13_arvores) => {
    const n = s13_arvores.length;
    const by = new Map(); const fams = new Set();
    for (const r of s13_arvores) { by.set(r.especie, (by.get(r.especie) || 0) + 1); if (r.familia) fams.add(r.familia); }
    const dap = s13_arvores.map(r => Number(r.dap_cm)).filter(v => Number.isFinite(v));
    const mean = dap.reduce((a, b) => a + b, 0) / dap.length;
    const sd = Math.sqrt(dap.reduce((a, v) => a + (v - mean) ** 2, 0) / dap.length);
    let H = 0, D = 0;
    for (const c of by.values()) { const p = c / n; H -= p * Math.log(p); D += p * p; }
    return [{ individuos: n, especies: by.size, familias: fams.size, dap_medio: mean, dap_min: Math.min(...dap), dap_max: Math.max(...dap), dap_dp: sd, shannon: H, simpson: 1 - D, pielou: H / Math.log(by.size) }];
  }
});
dash.calc('s13_ivi', {
  inputs: ['s13_arvores'], title: 'Vegetação · IVI por espécie',
  description: 'Densidade, frequência e dominância (área basal = 3,14·DAP²/40000) absolutas e relativas e IVI por espécie; área de referência 60 ha e uma ocorrência por espécie, como na folha.',
  fn: (s13_arvores) => {
    const AREA = 60;
    const by = new Map();
    for (const r of s13_arvores) {
      const o = by.get(r.especie) || { especie: r.especie, familia: r.familia, individuos: 0, ab: 0 };
      o.individuos += 1; o.ab += 3.14 * (Number(r.dap_cm) || 0) ** 2 / 40000; by.set(r.especie, o);
    }
    const rows = [...by.values()];
    const sDA = rows.reduce((a, o) => a + o.individuos / AREA, 0);
    const sFA = rows.length / AREA;
    const sDoA = rows.reduce((a, o) => a + o.ab / AREA, 0);
    return rows.map(o => {
      const da = o.individuos / AREA, fa = 1 / AREA, doa = o.ab / AREA;
      const dr = da / sDA * 100, fr = fa / sFA * 100, dor = doa / sDoA * 100;
      return { especie: o.especie, familia: o.familia, individuos: o.individuos, da, dr, fa, fr, doa, dor, ivi: dr + fr + dor };
    }).sort((a, b) => b.ivi - a.ivi);
  }
});
dash.calc('s13_abund', {
  inputs: ['s13_arvores'], title: 'Vegetação · espécies abundantes e raras',
  description: 'As nove espécies com mais e com menos indivíduos e a sua percentagem no total.',
  fn: (s13_arvores) => {
    const by = new Map();
    for (const r of s13_arvores) { const o = by.get(r.especie) || { especie: r.especie, familia: r.familia, individuos: 0 }; o.individuos += 1; by.set(r.especie, o); }
    const n = s13_arvores.length;
    const all = [...by.values()].sort((a, b) => b.individuos - a.individuos).map(o => ({ ...o, pct: o.individuos / n * 100 }));
    return [...all.slice(0, 9).map(o => ({ ...o, grupo: 'Abundante' })), ...all.slice(-9).reverse().map(o => ({ ...o, grupo: 'Rara' }))];
  }
});
dash.calc('s13_familias', {
  inputs: ['s13_arvores'], title: 'Vegetação · famílias',
  description: 'Número de espécies e de indivíduos por família botânica e percentagem do total.',
  fn: (s13_arvores) => {
    const by = new Map();
    for (const r of s13_arvores) { const f = r.familia || 'Sem família'; const o = by.get(f) || { familia: f, sp: new Set(), individuos: 0 }; o.individuos += 1; o.sp.add(r.especie); by.set(f, o); }
    const n = s13_arvores.length;
    return [...by.values()].map(o => ({ familia: o.familia, especies: o.sp.size, individuos: o.individuos, pct: o.individuos / n * 100 })).sort((a, b) => b.individuos - a.individuos);
  }
});
dash.calc('s13_dap', {
  inputs: ['s13_arvores'], title: 'Vegetação · classes de DAP',
  description: 'Número e percentagem de árvores por classe de DAP: 5–10, 10–20, 20–30, 30–40, 40–50 e ≥50 cm.',
  fn: (s13_arvores) => {
    const C = [['5–10', 5, 10], ['10–20', 10, 20], ['20–30', 20, 30], ['30–40', 30, 40], ['40–50', 40, 50], ['≥50', 50, Infinity]];
    const v = s13_arvores.map(r => Number(r.dap_cm));
    return C.map(([classe, a, b], i) => { const n = v.filter(x => x >= a && x < b).length; return { classe, ordem: i, individuos: n, pct: n / v.length * 100 }; });
  }
});
dash.calc('s13_altura', {
  inputs: ['s13_arvores'], title: 'Vegetação · classes de altura',
  description: 'Número e percentagem de árvores por classe de altura: 0–2, 2–5, 5–10, 10–15 e ≥15 m.',
  fn: (s13_arvores) => {
    const C = [['0–2 m', 0, 2], ['2–5 m', 2, 5], ['5–10 m', 5, 10], ['10–15 m', 10, 15], ['≥15 m', 15, Infinity]];
    const v = s13_arvores.map(r => Number(r.altura_m));
    return C.map(([classe, a, b], i) => { const n = v.filter(x => x >= a && x < b).length; return { classe, ordem: i, individuos: n, pct: n / v.length * 100 }; });
  }
});
dash.calc('s13_estado', {
  inputs: ['s13_arvores'], title: 'Vegetação · estado das árvores',
  description: 'Contagem e percentagem por estado reprodutivo, categoria IUCN, estado fitossanitário e condição (viva, morta, caída).',
  fn: (s13_arvores) => {
    const L = { reproductive: 'Reprodutiva', non_reproductive: 'Não reprodutiva', healthy: 'Saudável', damaged_stressed: 'Danificada ou stressada' };
    const ind = [['Estado reprodutivo', r => L[r.reprodutivo] || 'Sem registo'], ['IUCN', r => r.iucn || 'Sem registo'], ['Fitossanitário', r => L[r.saude] || 'Sem registo'], ['Condição', r => r.condicao || 'Sem registo']];
    const n = s13_arvores.length, out = [];
    for (const [indicador, f] of ind) {
      const m = new Map(); for (const r of s13_arvores) { const k = f(r); m.set(k, (m.get(k) || 0) + 1); }
      for (const [categoria, c] of [...m].sort((a, b) => b[1] - a[1])) out.push({ indicador, categoria, individuos: c, pct: c / n * 100 });
    }
    return out;
  }
});
dash.calc('s13_funcoes', {
  inputs: ['s13_arvores'], title: 'Vegetação · funções ecológicas',
  description: 'Árvores por função: sombra (copa ≥5 m), alimentação (reprodutivas), abrigo e carbono (DAP ≥30 cm), solo (estabilização registada), fixação de N (Fabaceae).',
  fn: (s13_arvores) => {
    const n = s13_arvores.length;
    const F = [['Sombra', r => Number(r.copa_m) >= 5], ['Alimentação', r => r.reprodutivo === 'reproductive'], ['Abrigo', r => Number(r.dap_cm) >= 30], ['Carbono', r => Number(r.dap_cm) >= 30], ['Solo', r => r.estab_solo === 'yes'], ['Fixação de N', r => r.familia === 'Fabaceae']];
    return F.map(([funcao, f]) => { const c = s13_arvores.filter(f).length; return { funcao, individuos: c, pct: c / n * 100 }; });
  }
});

dash.calc('s13_dap_especie', {
  inputs: ['s13_arvores'], title: 'Espécie · classes de DAP',
  description: 'Número de árvores de cada espécie por classe de DAP (5–10 … ≥50 cm), Surveys 1 e 3.',
  fn: (s13_arvores) => {
    const C = [['5–10', 5, 10], ['10–20', 10, 20], ['20–30', 20, 30], ['30–40', 30, 40], ['40–50', 40, 50], ['≥50', 50, Infinity]];
    const by = new Map();
    for (const r of s13_arvores) { const v = Number(r.dap_cm); const i = C.findIndex(([, a, b]) => v >= a && v < b); if (i < 0) continue; const k = r.especie + '|' + i; by.set(k, (by.get(k) || 0) + 1); }
    const sp = [...new Set(s13_arvores.map(r => r.especie))];
    return sp.flatMap(especie => C.map(([classe], ordem) => ({ especie, classe, ordem, individuos: by.get(especie + '|' + ordem) || 0 })));
  }
});
dash.calc('especies_ficha', {
  inputs: ['s13_arvores', 's2_registos', 's4_arvores', 's4_criterios'], title: 'Ficha por espécie',
  description: 'Para cada espécie: indivíduos, IVI e posição, DAP e altura médios, % reprodutivas e saudáveis (Surveys 1 e 3); árvores por estrato, regeneração e parcelas (Survey 2); decisões e critérios de translocação (Survey 4).',
  fn: (s13_arvores, s2_registos, s4_arvores, s4_criterios) => {
    const AREA = 60, N = s13_arvores.length;
    const a = new Map();
    for (const r of s13_arvores) {
      const o = a.get(r.especie) || { n: 0, ab: 0, dap: 0, alt: 0, nalt: 0, rep: 0, ok: 0, iucn: r.iucn };
      o.n++; const d = Number(r.dap_cm) || 0; o.ab += 3.14 * d * d / 40000; o.dap += d;
      if (Number.isFinite(Number(r.altura_m)) && r.altura_m !== null) { o.alt += Number(r.altura_m); o.nalt++; }
      if (r.reprodutivo === 'reproductive') o.rep++; if (r.saude === 'healthy') o.ok++; a.set(r.especie, o);
    }
    const S = a.size, sAB = [...a.values()].reduce((s, o) => s + o.ab, 0);
    const ivi = new Map([...a].map(([e, o]) => [e, o.n / N * 100 + 100 / S + o.ab / sAB * 100]));
    const rank = new Map([...ivi].sort((x, y) => y[1] - x[1]).map(([e], i) => [e, i + 1]));
    const b = new Map();
    for (const r of s2_registos) {
      const o = b.get(r.especie) || { arv: 0, Herbaceas: 0, Matagal: 0, Moita: 0, reg: 0, p: new Set() };
      if (r.grupo === 'Árvores') { o.arv++; o[r.estrato] = (o[r.estrato] || 0) + 1; o.p.add(r.parcela); }
      if (r.grupo === 'Regeneração') { o.reg++; o.p.add(r.parcela); }
      b.set(r.especie, o);
    }
    const c = new Map();
    for (const r of s4_arvores) { const o = c.get(r.especie) || { n: 0, Translocar: 0, Reter: 0, Remover: 0 }; o.n++; o[r.decisao]++; c.set(r.especie, o); }
    const crit = new Map(s4_criterios.map(x => [x.especie, x]));
    const all = [...new Set([...a.keys(), ...[...b.keys()].filter(e => b.get(e).arv + b.get(e).reg > 0), ...c.keys()])].sort();
    return all.map(especie => {
      const x = a.get(especie), y = b.get(especie), z = c.get(especie), k = crit.get(especie) || {};
      return {
        especie, iucn: x ? x.iucn : null,
        s13_n: x ? x.n : 0, s13_pct: x ? x.n / N * 100 : 0, s13_ivi: x ? ivi.get(especie) : null, s13_posicao_ivi: x ? rank.get(especie) : null,
        s13_dap_medio: x ? x.dap / x.n : null, s13_altura_media: x && x.nalt ? x.alt / x.nalt : null,
        s13_reprod_pct: x ? x.rep / x.n * 100 : null, s13_saudavel_pct: x ? x.ok / x.n * 100 : null,
        s2_arvores: y ? y.arv : 0, s2_herbaceas: y ? y.Herbaceas : 0, s2_matagal: y ? y.Matagal : 0, s2_moita: y ? y.Moita : 0, s2_regeneracao: y ? y.reg : 0, s2_parcelas: y ? y.p.size : 0,
        s4_arvores: z ? z.n : 0, s4_translocar: z ? z.Translocar : 0, s4_reter: z ? z.Reter : 0, s4_remover: z ? z.Remover : 0,
        sobrevivencia_estimada: k.sobrevivencia_estimada || null, prioridade: k.prioridade || null
      };
    });
  }
});

/* ---------------- Cálculos: Survey 2 ---------------- */
dash.calc('s2_resumo', {
  inputs: ['s2_registos'], title: 'Estratos · amostragem',
  description: 'Parcelas (0,1 ha cada), área e número de registos por grupo em cada estrato, e densidade de árvores por hectare.',
  fn: (s2_registos) => {
    const PARCELA_HA = 0.1;
    const by = new Map();
    for (const r of s2_registos) {
      const o = by.get(r.estrato) || { estrato: r.estrato, p: new Set(), arvores: 0, regeneracao: 0, gramineas: 0, arbustos: 0 };
      o.p.add(r.parcela);
      if (r.grupo === 'Árvores') o.arvores++; else if (r.grupo === 'Regeneração') o.regeneracao++; else if (r.grupo === 'Gramíneas') o.gramineas++; else if (r.grupo === 'Arbustos') o.arbustos++;
      by.set(r.estrato, o);
    }
    return [...by.values()].map(o => ({ estrato: o.estrato, parcelas: o.p.size, area_ha: o.p.size * PARCELA_HA, arvores: o.arvores, regeneracao: o.regeneracao, gramineas: o.gramineas, arbustos: o.arbustos, dens_arvores: o.arvores / (o.p.size * PARCELA_HA) })).sort((a, b) => a.estrato.localeCompare(b.estrato));
  }
});
dash.calc('s2_diversidade', {
  inputs: ['s2_registos'], title: 'Estratos · diversidade',
  description: 'Shannon (H′), Simpson (1−D) e Pielou (J′) por grupo e estrato, com base no número de registos por espécie; "Todos" junta os estratos.',
  fn: (s2_registos) => {
    const div = (rows) => {
      const m = new Map(); for (const r of rows) m.set(r.especie, (m.get(r.especie) || 0) + 1);
      const n = rows.length; let H = 0, D = 0;
      for (const c of m.values()) { const p = c / n; H -= p * Math.log(p); D += p * p; }
      return { registos: n, especies: m.size, shannon: H, simpson: 1 - D, pielou: m.size > 1 ? H / Math.log(m.size) : null };
    };
    const out = [];
    for (const grupo of ['Árvores', 'Regeneração', 'Gramíneas', 'Arbustos']) {
      const g = s2_registos.filter(r => r.grupo === grupo);
      for (const estrato of [...new Set(g.map(r => r.estrato))].sort()) out.push({ grupo, estrato, ...div(g.filter(r => r.estrato === estrato)) });
      out.push({ grupo, estrato: 'Todos', ...div(g) });
    }
    return out;
  }
});
dash.calc('s2_ivi', {
  inputs: ['s2_registos'], title: 'Estratos · IVI das árvores',
  description: 'Indivíduos por estrato, parcelas de ocorrência e IVI (DR + FR + DoR) das árvores; área = parcelas × 0,1 ha; área basal = 3,1416·DAP²/40000.',
  fn: (s2_registos) => {
    const t = s2_registos.filter(r => r.grupo === 'Árvores');
    const nP = new Set(t.map(r => r.parcela)).size, AREA = nP * 0.1;
    const by = new Map();
    for (const r of t) {
      const o = by.get(r.especie) || { especie: r.especie, Herbaceas: 0, Matagal: 0, Moita: 0, individuos: 0, p: new Set(), ab: 0 };
      o.individuos++; o[r.estrato] = (o[r.estrato] || 0) + 1; o.p.add(r.parcela); o.ab += 3.1416 * (Number(r.dap_cm) || 0) ** 2 / 40000; by.set(r.especie, o);
    }
    const rows = [...by.values()];
    const sDA = rows.reduce((a, o) => a + o.individuos / AREA, 0), sFA = rows.reduce((a, o) => a + o.p.size / nP, 0), sDoA = rows.reduce((a, o) => a + o.ab / AREA, 0);
    return rows.map(o => {
      const da = o.individuos / AREA, fa = o.p.size / nP, doa = o.ab / AREA;
      const dr = da / sDA * 100, fr = fa / sFA * 100, dor = doa / sDoA * 100;
      return { especie: o.especie, Herbaceas: o.Herbaceas, Matagal: o.Matagal, Moita: o.Moita, individuos: o.individuos, parcelas: o.p.size, da, dr, fa, fr, doa, dor, ivi: dr + fr + dor };
    }).sort((a, b) => b.ivi - a.ivi);
  }
});
dash.calc('s2_classes', {
  inputs: ['s2_registos'], title: 'Estratos · classes',
  description: 'Registos por classe e estrato: DAP, altura e estado reprodutivo das árvores; proveniência e altura da regeneração; diâmetro e altura das gramíneas; altura e IUCN dos arbustos.',
  fn: (s2_registos) => {
    const dapC = v => v < 10 ? '5–10 cm' : v < 20 ? '10–20 cm' : v < 30 ? '20–30 cm' : v < 40 ? '30–40 cm' : v < 50 ? '40–50 cm' : '≥50 cm';
    const altC = v => v < 2 ? '0–2 m' : v < 5 ? '2–5 m' : v < 10 ? '5–10 m' : '≥10 m';
    const L = { reproductive: 'Reprodutiva', non_reproductive: 'Não reprodutiva', Uncategorized: 'Sem registo', Stem_Resprout: 'Rebento de toiça', Root_Sucker: 'Rebento de raiz', Seed: 'Semente', 'low_less0.5m': '<0,5 m', 'medium_0.5to1.3m': '0,5–1,3 m', 'high_1.3to5m': '1,3–5 m', low: 'Baixa', med: 'Média', tall: 'Alta', prostrate: 'Prostrada', low_less_1m: '<1 m', medium_1to3m: '1–3 m', high_more3m: '>3 m' };
    const LD = { low: 'Pequeno', med: 'Médio', high: 'Grande' };
    const ORDER = ['5–10 cm', '10–20 cm', '20–30 cm', '30–40 cm', '40–50 cm', '≥50 cm', '0–2 m', '2–5 m', '5–10 m', '≥10 m', 'Reprodutiva', 'Não reprodutiva', 'Sem registo', 'Rebento de toiça', 'Rebento de raiz', 'Semente', '<0,5 m', '0,5–1,3 m', '1,3–5 m', 'Pequeno', 'Médio', 'Grande', 'Prostrada', 'Baixa', 'Média', 'Alta', '<1 m', '1–3 m', '>3 m', 'LC', 'NE'];
    const specs = [
      ['Árvores', 'dap', r => Number.isFinite(Number(r.dap_cm)) && r.dap_cm !== null ? dapC(Number(r.dap_cm)) : null],
      ['Árvores', 'altura', r => r.altura_m !== null && Number.isFinite(Number(r.altura_m)) ? altC(Number(r.altura_m)) : null],
      ['Árvores', 'reprodutivo', r => L[r.reprodutivo] || null],
      ['Regeneração', 'origem', r => L[r.origem] || null],
      ['Regeneração', 'altura', r => L[r.classe_altura] || null],
      ['Gramíneas', 'diametro', r => LD[r.classe_diametro] || null],
      ['Gramíneas', 'altura', r => L[r.classe_altura] || null],
      ['Arbustos', 'altura', r => L[r.classe_altura] || null],
      ['Arbustos', 'iucn', r => r.iucn || null]];
    const out = [];
    for (const [grupo, variavel, f] of specs) {
      const m = new Map();
      for (const r of s2_registos) { if (r.grupo !== grupo) continue; const c = f(r); if (!c) continue; const k = c + '|' + r.estrato; m.set(k, (m.get(k) || 0) + 1); }
      for (const [k, registos] of m) { const [classe, estrato] = k.split('|'); out.push({ grupo, variavel, classe, ordem: ORDER.indexOf(classe), estrato, registos }); }
    }
    return out.sort((a, b) => a.ordem - b.ordem || a.estrato.localeCompare(b.estrato));
  }
});
dash.calc('s2_dominantes', {
  inputs: ['s2_registos'], title: 'Estratos · espécies dominantes',
  description: 'As três espécies com mais registos em cada grupo e estrato.',
  fn: (s2_registos) => {
    const by = new Map();
    for (const r of s2_registos) { const k = r.grupo + '|' + r.estrato; const m = by.get(k) || new Map(); m.set(r.especie, (m.get(r.especie) || 0) + 1); by.set(k, m); }
    const G = ['Árvores', 'Regeneração', 'Gramíneas', 'Arbustos'];
    return [...by].map(([k, m]) => { const [grupo, estrato] = k.split('|'); return { grupo, estrato, especies_dominantes: [...m].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e, c]) => e + ' (' + c + ')').join(' · ') }; })
      .sort((a, b) => G.indexOf(a.grupo) - G.indexOf(b.grupo) || a.estrato.localeCompare(b.estrato));
  }
});

/* ---------------- Cálculos: Survey 4 ---------------- */
dash.calc('s4_resumo', {
  inputs: ['s4_arvores'], title: 'Translocação · resumo',
  description: 'Total de árvores avaliadas, número e percentagem por decisão e árvores dentro da zona de construção.',
  fn: (s4_arvores) => {
    const n = s4_arvores.length, c = d => s4_arvores.filter(r => r.decisao === d).length;
    const t = c('Translocar'), k = c('Reter'), m = c('Remover'), dentro = s4_arvores.filter(r => r.zona === 'Dentro').length;
    return [{ arvores: n, especies: new Set(s4_arvores.map(r => r.especie)).size, translocar: t, reter: k, remover: m, pct_translocar: t / n * 100, pct_reter: k / n * 100, pct_remover: m / n * 100, dentro, fora: n - dentro, pct_dentro: dentro / n * 100 }];
  }
});
dash.calc('s4_decisao', {
  inputs: ['s4_arvores'], title: 'Translocação · por decisão',
  description: 'Número e percentagem de árvores a translocar, reter e remover.',
  fn: (s4_arvores) => ['Translocar', 'Reter', 'Remover'].map(decisao => { const c = s4_arvores.filter(r => r.decisao === decisao).length; return { decisao, arvores: c, pct: c / s4_arvores.length * 100 }; })
});
dash.calc('s4_zona', {
  inputs: ['s4_arvores'], title: 'Translocação · zona de construção',
  description: 'Número e percentagem de árvores dentro e fora da zona de construção.',
  fn: (s4_arvores) => ['Dentro', 'Fora'].map(zona => { const c = s4_arvores.filter(r => r.zona === zona).length; return { zona, arvores: c, pct: c / s4_arvores.length * 100 }; })
});
dash.calc('s4_especies', {
  inputs: ['s4_arvores', 's4_criterios'], title: 'Translocação · por espécie',
  description: 'Árvores por espécie e decisão, com os critérios de translocação da folha de critérios.',
  fn: (s4_arvores, s4_criterios) => {
    const crit = new Map(s4_criterios.map(c => [c.especie, c]));
    const by = new Map();
    for (const r of s4_arvores) { const o = by.get(r.especie) || { especie: r.especie, arvores: 0, translocar: 0, reter: 0, remover: 0 }; o.arvores++; o[r.decisao.toLowerCase()]++; by.set(r.especie, o); }
    return [...by.values()].map(o => { const c = crit.get(o.especie) || {}; return { ...o, pct: o.arvores / s4_arvores.length * 100, sobrevivencia_estimada: c.sobrevivencia_estimada || null, potencial: c.potencial || null, aptidao: c.aptidao || null, prioridade: c.prioridade || null }; })
      .sort((a, b) => b.arvores - a.arvores);
  }
});
dash.calc('s4_classes', {
  inputs: ['s4_arvores'], title: 'Translocação · classes de DAP e altura',
  description: 'Árvores por classe de DAP (5–10 … ≥60 cm) e de altura (<3, 3–4, 4–5, ≥5 m), por decisão.',
  fn: (s4_arvores) => {
    const D = [['5–10', 5, 10], ['10–20', 10, 20], ['20–30', 20, 30], ['30–40', 30, 40], ['40–50', 40, 50], ['50–60', 50, 60], ['≥60', 60, Infinity]];
    const A = [['<3', 0, 3], ['3–4', 3, 4], ['4–5', 4, 5], ['≥5', 5, Infinity]];
    const out = [];
    for (const [variavel, C, f] of [['dap', D, r => Number(r.dap_cm)], ['altura', A, r => Number(r.altura_m)]])
      C.forEach(([classe, a, b], ordem) => { for (const decisao of ['Translocar', 'Reter', 'Remover']) out.push({ variavel, classe, ordem, decisao, arvores: s4_arvores.filter(r => r.decisao === decisao && f(r) >= a && f(r) < b).length }); });
    return out;
  }
});

/* ---------------- Cálculos: Fauna ---------------- */
dash.calc('fauna_especies', {
  inputs: ['fauna_registos'], title: 'Fauna · registos por espécie',
  description: 'Soma dos registos de cada espécie (resgates, tentativas e observações).',
  fn: (fauna_registos) => {
    const by = new Map();
    for (const r of fauna_registos) { const o = by.get(r.especie) || { especie: r.especie, grupo: r.grupo, registos: 0 }; o.registos += Number(r.registos); by.set(r.especie, o); }
    return [...by.values()].sort((a, b) => b.registos - a.registos);
  }
});
dash.calc('fauna_ninhos_estado', {
  inputs: ['fauna_ninhos'], title: 'Fauna · ninhos por estado',
  description: 'Número e percentagem de ninhos por estado agrupado (ativo, inativo, relocalizado, por reavaliar).',
  fn: (fauna_ninhos) => {
    const m = new Map(); for (const r of fauna_ninhos) m.set(r.estado_grupo, (m.get(r.estado_grupo) || 0) + 1);
    return [...m].map(([estado_grupo, ninhos]) => ({ estado_grupo, ninhos, pct: ninhos / fauna_ninhos.length * 100 })).sort((a, b) => b.ninhos - a.ninhos);
  }
});
dash.calc('fauna_resumo', {
  inputs: ['fauna_registos', 'fauna_ninhos'], title: 'Fauna · resumo',
  description: 'Total de registos de fauna, espécies, ninhos registados e ninhos ativos.',
  fn: (fauna_registos, fauna_ninhos) => [{ registos: fauna_registos.reduce((a, r) => a + Number(r.registos), 0), especies: new Set(fauna_registos.map(r => r.especie)).size, ninhos: fauna_ninhos.length, ninhos_ativos: fauna_ninhos.filter(r => r.estado_grupo === 'Ativo').length }]
});
