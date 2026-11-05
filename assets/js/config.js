/* Configuração: de onde vem cada conjunto de dados e os valores iniciais dos filtros.
   Para atualizar os dados, substitua os ficheiros em data/ (ver README.md). */
window.DASH_SOURCES = {
  s13_arvores: 'data/s13_arvores.json',       // Surveys 1 e 3: árvores individuais
  s13_prioridade: 'data/s13_prioridade.json', // Surveys 1 e 3: prioridade para retenção
  s2_registos: 'data/s2_registos.json',       // Survey 2: árvores, regeneração, gramíneas, arbustos
  s4_arvores: 'data/s4_arvores.json',         // Survey 4: árvores avaliadas
  s4_criterios: 'data/s4_criterios.json',     // Survey 4: critérios de translocação
  s4_tecnico: 'data/s4_tecnico.json',         // Survey 4: especificações de transplante
  fauna: 'data/fauna.json'                    // Biodiversidade: registos de fauna, ninhos e tocas (CSV)
};

window.DASH_PARAMS = {
  especie: 'Colophospermum mopane' // espécie aberta por defeito na Ficha de espécie
};
