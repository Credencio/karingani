# Karingani - Monitoring Dashboard

Static dashboard with the results of the vegetation surveys (Surveys 1 to 4) and the final fauna report for Node A, Karingani Game Reserve. It needs no server or database: the browser reads the JSON files in `data/` and runs every calculation (IVI, DBH and height classes, diversity indices, translocation decisions).

The site opens in **English**; the **EN | PT** switch at the top right changes it to Portuguese. *Versão portuguesa destas instruções: [LEIAME.md](LEIAME.md).*

## Contents

| Tab | What it shows |
|---|---|
| Vegetation · Surveys 1 and 3 | Key figures, IVI, families, most abundant and rare species, DBH and height classes, reproductive status, IUCN, tree health, condition, ecological functions, retention priority, phytosociological table |
| Species profile | Pick a species: its figures in the three surveys, DBH distribution and GPS map |
| Strata · Survey 2 | Sampling effort by stratum, classes per group, diversity indices, IVI, dominant species |
| Translocation · Survey 4 | Decisions (translocate, retain, remove), DBH and height classes, tree map, translocation criteria and transplanting specifications |
| Fauna · Final report | Records by species, nests, risk matrix |
| Methods | Formulas and rules behind every figure |

## Structure

```
index.html                 page (English text)
.nojekyll                  tells GitHub Pages to serve the files as they are
assets/css/tema.css        colours, typography, spacing
assets/css/dashboard.css   component styles
assets/js/config.js        list of data files and the species opened by default
assets/js/runtime.js       engine: loads the data, runs the calculations and redraws
assets/js/calculos.js      all calculations (IVI, diversity, classes, species profiles)
assets/js/graficos.js      bar charts, cards and maps (d3)
assets/js/desenhos.js      connects each page element to its data
assets/js/separadores.js   tab navigation
assets/js/i18n.js          translations (English default, Portuguese)
assets/vendor/             d3 v7.9.0 (ISC licence in d3-LICENSE.txt)
data/*.json                cleaned data for each survey
scripts/atualizar_dados.py rebuilds data/*.json from the Excel workbooks
```

## Publish on GitHub Pages

1. Create a repository on GitHub (for example `karingani-dashboard`).
2. Upload the contents of this folder to the root of the repository:
   ```bash
   git init
   git add .
   git commit -m "Ecological monitoring dashboard"
   git branch -M main
   git remote add origin https://github.com/<user>/karingani-dashboard.git
   git push -u origin main
   ```
   You can also drag the files into **Add file → Upload files**. Include the `.nojekyll` file, which some systems hide.
3. In the repository, open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute or two the site is live at `https://<user>.github.io/karingani-dashboard/`.

**Note:** in a public repository, or with GitHub Pages on a free plan, the site and the files in `data/` (including the trees' GPS coordinates) can be seen by anyone with the address.

## Languages

- Open in Portuguese directly with `?lang=pt` (or force English with `?lang=en`), e.g. `https://<user>.github.io/karingani-dashboard/?lang=pt#fauna`. The visitor's last choice is remembered in their browser.
- Page text is in English in `index.html`; the Portuguese version of every element marked `data-i18n` is in `PAGE_PT` in `assets/js/i18n.js`.
- Values that come from the data (categories, strata, fauna tables) are stored in Portuguese in the JSON files; their English translation is in `VALUES_EN`. If you add a new category to the data, add its translation to `VALUES_EN` too; without it the value shows in Portuguese in both languages.
- Scientific names of species and families are not translated.

## Preview locally

Browsers block reading the JSON files when `index.html` is opened directly (double-click). Run a local server instead:

```bash
python -m http.server 8000
```

and open `http://localhost:8000`.

## Update the data

When new versions of the workbooks are available:

```bash
pip install openpyxl
python scripts/atualizar_dados.py \
  --survey13 "Analise da Vegetacao survey 1 e 3.xlsx" \
  --survey2  "Resultados Survey 2 - Anelarda.xlsx" \
  --survey4  "Survey 4 Field Data Spreadsheet.xlsx"
git add data && git commit -m "Update data" && git push
```

You can pass only the surveys that changed. The script expects the same sheet and column names as the original workbooks and reports any missing column. The fauna files (`data/fauna_registos.json`, `data/fauna_ninhos.json`, `data/fauna_riscos.json`) were transcribed from the fauna report and are edited by hand.

## Embed in Google Sites

In Google Sites choose **Insert → Embed → By URL**, paste the GitHub Pages address and pick **Whole page**. Add `?lang=pt` to the address to embed the Portuguese version, or `#translocacao`, `#fauna`, etc. to open a specific tab.

## Customise

- **Colours:** variables in `assets/css/tema.css` and the card tints at the top of the card section in `assets/css/dashboard.css`.
- **Species opened by default:** `DASH_PARAMS.especie` in `assets/js/config.js`.
- **Calculation constants** (60 ha area for Surveys 1 and 3, 0.1 ha per plot in Survey 2, DBH and height classes): at the top of each calculation in `assets/js/calculos.js`.
- **Direct links to tabs:** add `#especies`, `#estratos`, `#translocacao`, `#fauna` or `#metodos` to the address.
