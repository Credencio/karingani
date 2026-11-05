#!/usr/bin/env python3
"""Regenera os ficheiros data/*.json do dashboard a partir das folhas de cálculo dos surveys.

Uso (a partir da pasta do repositório):

    pip install openpyxl
    python scripts/atualizar_dados.py \
        --survey13 "Analise da Vegetacao survey 1 e 3.xlsx" \
        --survey2  "Resultados Survey 2 - Anelarda.xlsx" \
        --survey4  "Survey 4 Field Data Spreadsheet.xlsx" \
        --fauna    "Biodiversity_legacy_import.csv"


Pode passar só os surveys que mudaram.

O script espera a mesma estrutura de folhas e colunas das folhas originais:
  Surveys 1 e 3: folha "Dados " (com espaço no fim) e tabela espécie/família em
                 "Composicao floristica" (colunas V:W); folha "Prioridade para retencao".
  Survey 2:      folhas "Dados tratados", "Regeneration", "Grass" e "scribs".
  Survey 4:      folhas "Complete Field Data Spreadsheet", "Cleaned Field Data Spreadsheet",
                 "% In Out Construction Zone", "Translocation Criteria" e
                 "Criteria of All Species)".
"""
import argparse
import json
import os
import sys

try:
    import openpyxl
except ImportError:
    sys.exit("Falta o pacote openpyxl. Instale com: pip install openpyxl")

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def sp(x):
    return (x or "").replace("_", " ").strip() or None


def save(name, rows):
    path = os.path.join(DATA, name + ".json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
    print(f"  {name}.json: {len(rows)} registos")


def col(header, name):
    try:
        return header.index(name)
    except ValueError:
        sys.exit(f"Coluna '{name}' não encontrada. Colunas: {header}")


def survey13(path):
    print("Surveys 1 e 3:", path)
    wb = openpyxl.load_workbook(path, data_only=True)
    fam = {}
    for r in wb["Composicao floristica"].iter_rows(min_row=2, min_col=22, max_col=23, values_only=True):
        if r[0] and r[1]:
            fam[str(r[0]).strip()] = str(r[1]).strip()
    ws = wb["Dados "]
    it = ws.iter_rows(values_only=True)
    h = [str(c).strip() if c is not None else "" for c in next(it)]
    i = {k: col(h, k) for k in ["tree_speci", "tree_IUCN", "dbh_cm", "treeheight", "treecrown_", "reproducti",
                                "tree_healt", "Soil_Stabi", "POINT_X", "POINT_Y", "Viva_morta"]}
    rows, sem_familia = [], set()
    for r in it:
        if r[i["tree_speci"]] is None:
            continue
        e = sp(r[i["tree_speci"]])
        if e not in fam:
            sem_familia.add(e)
        rows.append({
            "especie": e, "familia": fam.get(e), "iucn": r[i["tree_IUCN"]],
            "dap_cm": num(r[i["dbh_cm"]]), "altura_m": num(r[i["treeheight"]]), "copa_m": num(r[i["treecrown_"]]),
            "reprodutivo": r[i["reproducti"]], "saude": r[i["tree_healt"]],
            "condicao": (str(r[i["Viva_morta"]]).strip() if r[i["Viva_morta"]] else None),
            "estab_solo": r[i["Soil_Stabi"]], "lon": num(r[i["POINT_X"]]), "lat": num(r[i["POINT_Y"]]),
        })
    if sem_familia:
        print("  Aviso: espécies sem família na tabela 'Composicao floristica':", ", ".join(sorted(sem_familia)))
    save("s13_arvores", rows)
    pr = wb["Prioridade para retencao"]
    save("s13_prioridade", [{"prioridade": r[0], "arvores": r[1]}
                            for r in pr.iter_rows(min_row=2, max_row=6, max_col=2, values_only=True) if r[0]])


def survey2(path):
    print("Survey 2:", path)
    wb = openpyxl.load_workbook(path, data_only=True)
    cols = ["grupo", "parcela", "estrato", "especie", "iucn", "dap_cm", "altura_m", "copa_m", "reprodutivo",
            "origem", "quantidade", "classe_diametro", "classe_altura", "saude"]
    out = []

    def add(grupo, rec):
        rec["grupo"] = grupo
        out.append({c: rec.get(c) for c in cols})

    est = lambda v: (v or "").strip()
    for r in wb["Dados tratados"].iter_rows(min_row=2, values_only=True):
        if r[7]:
            add("Árvores", {"parcela": r[2], "estrato": est(r[3]), "especie": sp(r[7]), "iucn": r[8], "dap_cm": num(r[10]),
                            "altura_m": num(r[11]), "copa_m": num(r[12]), "reprodutivo": r[13]})
    for r in wb["Regeneration"].iter_rows(min_row=2, values_only=True):
        if r[5]:
            add("Regeneração", {"parcela": r[3], "estrato": est(r[4]), "especie": sp(r[5]), "origem": r[8], "classe_altura": r[9]})
    for r in wb["Grass"].iter_rows(min_row=2, values_only=True):
        if r[5]:
            add("Gramíneas", {"parcela": r[3], "estrato": est(r[4]), "especie": sp(r[5]), "quantidade": num(r[6]),
                              "classe_diametro": r[7], "classe_altura": r[8]})
    for r in wb["scribs"].iter_rows(min_row=2, values_only=True):
        if r[5]:
            add("Arbustos", {"parcela": r[3], "estrato": est(r[4]), "especie": sp(r[5]), "iucn": r[6], "classe_altura": r[8], "saude": r[9]})
    save("s2_registos", out)


def survey4(path):
    print("Survey 4:", path)
    wb = openpyxl.load_workbook(path, data_only=True)
    it = wb["Complete Field Data Spreadsheet"].iter_rows(values_only=True)
    h = [str(c).strip() if c is not None else "" for c in next(it)]
    i = {k: col(h, k) for k in ["tree_speci", "tree_IUCN", "dbh_cm", "treeheight", "treecrown_", "intention",
                                "insideplot", "treetagnum", "POINT_X", "POINT_Y"]}
    dec = {"translocation": "Translocar", "retention": "Reter", "removal": "Remover"}
    rows = []
    for r in it:
        if not r[i["tree_speci"]] or r[i["intention"]] not in dec:
            continue
        rows.append({
            "especie": sp(r[i["tree_speci"]]), "iucn": r[i["tree_IUCN"]], "dap_cm": num(r[i["dbh_cm"]]),
            "altura_m": num(r[i["treeheight"]]), "copa_m": num(r[i["treecrown_"]]), "decisao": dec[r[i["intention"]]],
            "zona": "Dentro" if r[i["insideplot"]] == "in_plot" else "Fora", "etiqueta": r[i["treetagnum"]],
            "lon": num(r[i["POINT_X"]]), "lat": num(r[i["POINT_Y"]]),
        })
    save("s4_arvores", rows)
    tc = wb["Translocation Criteria"]
    save("s4_criterios", [{"especie": sp(r[0]), "sobrevivencia_estimada": str(r[7]).strip() if r[7] else None,
                           "potencial": r[8], "aptidao": r[9], "prioridade": r[10]}
                          for r in tc.iter_rows(min_row=2, values_only=True) if r[0] and isinstance(r[0], str)])
    hdr = ["ordem", "especie", "dap_recomendado_cm", "altura", "diametro_torrao", "profundidade_raizes", "peso_estimado",
           "equipamento", "tempo_viveiro", "engradamento", "poda_radicular", "sobrevivencia_pct", "prioridade", "justificacao"]
    tec = []
    for r in wb["Criteria of All Species)"].iter_rows(min_row=2, values_only=True):
        if r[1]:
            tec.append({k: (str(v).strip() if v is not None else None) for k, v in zip(hdr, r)})
    save("s4_tecnico", tec)


def _clean(text):
    """Remove automatic notes (survey period, import source) from free-text fields."""
    import re
    text = (text or "").strip()
    text = re.sub(r"\s*Survey period:[^.]*\.?", "", text)
    text = re.sub(r"\s*(Source survey|Source):.*$", "", text)
    text = re.sub(r"\s*Field identification: [^.]*\.", "", text)
    return text.strip(" .;") or None


def _outcome(r):
    """Outcome of a fauna record, read from its observations and remarks (rules listed in the Methods tab)."""
    s = ((r.get("observations") or "") + " " + (r.get("fa_remarks") or "")).lower()
    if "not recovered" in s or "recovery was not possible" in s:
        return "Not recovered"
    if "translocat" in s and ("success" in s or "completed" in s):
        return "Translocated"
    if "under monitoring" in s or "not carried out" in s:
        return "Under monitoring"
    if "maintained" in s or "retained in situ" in s:
        return "Kept in place"
    if "removed from the immediate work area" in s or "safely removed" in s:
        return "Removed from work area"
    if "point of release" in s or "released" in s:
        return "Released"
    return "Observed"


def fauna(path):
    import csv
    print("Fauna:", path)
    with open(path, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    tipo = {"fauna": "Fauna", "nest": "Nest", "burrow": "Burrow"}
    out = []
    for r in rows:
        kind = tipo.get((r.get("survey_methods") or "").strip())
        if not kind:
            continue
        esp = r.get("sp_scientific") or r.get("species_other") or sp(r.get("species"))
        if esp in ("other", "unidentified"):
            esp = r.get("species_other")
        active = (r.get("ne_active") or r.get("bu_active") or "").strip().lower()
        comments = r.get("comments") or ""
        rec = {
            "ref": r.get("form_ref"), "tipo": kind, "data": r.get("survey_date"), "local": (r.get("plot_number") or "").strip() or None,
            "lat": num(r.get("Latitude") or r.get("pc_latitude")), "lon": num(r.get("Longitude") or r.get("pc_longitude")),
            "localizacao_aproximada": "LOCATION APPROXIMATE" in comments,
            "grupo": (r.get("taxon_group") or "").strip().capitalize() or None, "especie": (esp or "").strip() or None,
            "nome_en": r.get("sp_common_en") or None, "nome_pt": r.get("sp_common_pt") or None,
            "iucn": r.get("sp_iucn") or None, "protecao_moz": r.get("sp_moz_protection") or None,
            "individuos": num(r.get("fa_individuals")), "prioridade": r.get("fa_priority") or None,
            "resultado": _outcome(r) if kind == "Fauna" else None,
            "estado": ("Active" if active == "yes" else "Inactive" if active == "no" else None) if kind != "Fauna" else None,
            "id_registo": r.get("ne_nest_id") or r.get("bu_burrow_id") or r.get("form_ref"),
            "arvore_ninho": r.get("ne_tree_species") or None, "altura_arvore_m": num(r.get("ne_tree_height")),
            "altura_ninho_m": num(r.get("ne_nest_height")), "ovos": num(r.get("ne_eggs")), "entradas": num(r.get("bu_entrances")),
            "observacoes": _clean(r.get("observations")),
            "notas": _clean(r.get("fa_remarks") or r.get("ne_remarks") or r.get("bu_remarks")),
            "acao": _clean(comments.split(" Imported from")[0]) if kind != "Fauna" else None,
        }
        out.append(rec)
    save("fauna", out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--survey13", help="Excel da Análise da Vegetação, surveys 1 e 3")
    ap.add_argument("--survey2", help="Excel de resultados do Survey 2")
    ap.add_argument("--survey4", help="Excel de dados de campo do Survey 4")
    ap.add_argument("--fauna", help="CSV de biodiversidade (fauna, ninhos e tocas)")
    a = ap.parse_args()
    if not (a.survey13 or a.survey2 or a.survey4 or a.fauna):
        ap.print_help()
        return
    os.makedirs(DATA, exist_ok=True)
    if a.survey13:
        survey13(a.survey13)
    if a.survey2:
        survey2(a.survey2)
    if a.survey4:
        survey4(a.survey4)
    if a.fauna:
        fauna(a.fauna)
    print("Concluído. Faça commit da pasta data/ para atualizar o site.")


if __name__ == "__main__":
    main()
