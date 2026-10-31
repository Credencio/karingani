# Karingani Node A – Monitoria Ecológica

Dashboard estático com os resultados dos levantamentos de vegetação (Surveys 1 a 4) e do relatório final de fauna do Node A, Karingani Game Reserve. Não precisa de servidor nem de base de dados: o navegador lê os ficheiros JSON da pasta `data/` e faz todos os cálculos (IVI, classes de DAP e altura, índices de diversidade, decisões de translocação).

## Conteúdo

| Separador | O que mostra |
|---|---|
| Vegetação · Surveys 1 e 3 | Indicadores, IVI, famílias, espécies abundantes e raras, classes de DAP e altura, estado reprodutivo, IUCN, estado fitossanitário, funções ecológicas, prioridade para retenção, tabela fitossociológica |
| Ficha de espécie | Escolha uma espécie: números nos três surveys, distribuição de DAP e mapa GPS |
| Estratos · Survey 2 | Amostragem por estrato, classes por grupo, índices de diversidade, IVI, espécies dominantes |
| Translocação · Survey 4 | Decisões (translocar, reter, remover), classes de DAP e altura, mapa das árvores, critérios e especificações de transplante |
| Fauna · Relatório final | Registos por espécie, ninhos, matriz de risco |
| Métodos | Fórmulas e regras usadas em cada cálculo |

## Estrutura

```
index.html                 página
.nojekyll                  diz ao GitHub Pages para servir os ficheiros tal como estão
assets/css/tema.css        cores (modo claro e escuro), tipografia, espaçamentos
assets/css/dashboard.css   estilos dos componentes
assets/js/config.js        lista dos ficheiros de dados e espécie aberta por defeito
assets/js/runtime.js       motor: carrega os dados, corre os cálculos e redesenha
assets/js/calculos.js      todos os cálculos (IVI, diversidade, classes, fichas)
assets/js/graficos.js      gráficos de barras, donuts e mapas (d3)
assets/js/desenhos.js      liga cada elemento da página aos dados
assets/js/separadores.js   navegação entre separadores
assets/vendor/             d3 v7.9.0 (licença ISC em d3-LICENSE.txt)
data/*.json                dados limpos de cada survey
scripts/atualizar_dados.py regenera data/*.json a partir dos Excel
```

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (por exemplo `karingani-dashboard`).
2. Envie o conteúdo desta pasta para a raiz do repositório:
   ```bash
   git init
   git add .
   git commit -m "Dashboard de monitoria ecológica"
   git branch -M main
   git remote add origin https://github.com/<utilizador>/karingani-dashboard.git
   git push -u origin main
   ```
   Também pode arrastar os ficheiros para o repositório em **Add file → Upload files**. Inclua o ficheiro `.nojekyll`, que fica escondido em alguns sistemas.
3. No repositório, abra **Settings → Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. Grave.
4. Ao fim de um ou dois minutos o site fica em `https://<utilizador>.github.io/karingani-dashboard/`.

**Atenção:** num repositório público, ou com o GitHub Pages ativo num plano gratuito, o site e os ficheiros de `data/` (incluindo as coordenadas GPS das árvores) ficam acessíveis a qualquer pessoa com o endereço. Se os dados não puderem ser públicos, use um repositório privado com GitHub Pages privado (planos GitHub Enterprise) ou outro alojamento com acesso restrito.

## Ver no computador antes de publicar

O navegador não deixa ler os ficheiros JSON se abrir o `index.html` diretamente (duplo clique). Use um servidor local:

```bash
python -m http.server 8000
```

e abra `http://localhost:8000`.

## Atualizar os dados

Quando houver novas versões das folhas de cálculo:

```bash
pip install openpyxl
python scripts/atualizar_dados.py \
  --survey13 "Analise da Vegetacao survey 1 e 3.xlsx" \
  --survey2  "Resultados Survey 2 - Anelarda.xlsx" \
  --survey4  "Survey 4 Field Data Spreadsheet.xlsx"
git add data && git commit -m "Atualizar dados" && git push
```

Pode passar só os surveys que mudaram. O script espera os mesmos nomes de folhas e colunas das folhas originais e avisa se faltar alguma coluna.

Os ficheiros de fauna (`data/fauna_registos.json`, `data/fauna_ninhos.json`, `data/fauna_riscos.json`) foram transcritos do relatório de fauna e editam-se à mão, mantendo os mesmos campos. Quando as fichas do Survey 5 tiverem registos, podem passar a ser geradas pelo script.

## Personalizar

- **Cores:** variáveis `--series-1` a `--series-8` e restantes em `assets/css/tema.css`.
- **Espécie aberta por defeito:** `DASH_PARAMS.especie` em `assets/js/config.js`.
- **Constantes de cálculo** (área de 60 ha dos Surveys 1 e 3, 0,1 ha por parcela no Survey 2, classes de DAP e altura): no início de cada cálculo em `assets/js/calculos.js`.
- **Links diretos para separadores:** acrescente `#especies`, `#estratos`, `#translocacao`, `#fauna` ou `#metodos` ao endereço.
