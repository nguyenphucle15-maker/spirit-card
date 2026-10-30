"""Khớp giá bán lẻ (data/prices/raw/<loai>_vn.tsv) với backlog (content/backlog/<loai>.json).
In ra các cặp khớp để soát tay; ghi kết quả vào data/prices/<loai>_matches.tsv."""
import csv, json, re, sys, unicodedata
from difflib import SequenceMatcher

STOP = {"ruou","gin","vodka","rum","rhum","ron","tequila","brandy","cognac","the","de","la","dry","london","original","classic","handmade","handcrafted","small","batch","1l","700ml","750ml","1lit","no","n"}

def norm(s):
    s = unicodedata.normalize("NFD", s); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("đ","d").replace("Đ","D").lower().replace("&"," and ")
    s = re.sub(r"['’.]", "", s); s = re.sub(r"[^a-z0-9]+", " ", s)
    return s.strip()

def toks(s): return [t for t in norm(s).split() if t not in STOP]

def score(a, b):
    ta, tb = set(toks(a)), set(toks(b))
    if not ta or not tb: return 0
    inter = len(ta & tb)
    cover = inter / len(ta)            # tên bán lẻ phải nằm gần trọn trong tên backlog
    jac = inter / len(ta | tb)
    seq = SequenceMatcher(None, " ".join(sorted(ta)), " ".join(sorted(tb))).ratio()
    return 0.5*cover + 0.3*jac + 0.2*seq

loai = sys.argv[1]
back = json.load(open(f"content/backlog/{loai}.json", encoding="utf-8"))
rows = list(csv.DictReader(open(f"data/prices/raw/{loai}_vn.tsv", encoding="utf-8"), delimiter="\t"))
out = []
for r in rows:
    best = max(back, key=lambda b: score(r["name"], b["name"]))
    s = score(r["name"], best["name"])
    out.append((s, r["name"], best["name"], r["price_vnd"], r["source"]))
out.sort(reverse=True)
with open(f"data/prices/{loai}_matches.tsv", "w", encoding="utf-8") as f:
    f.write("score\tretail_name\tbacklog_name\tprice_vnd\tsource\n")
    for o in out: f.write("\t".join([f"{o[0]:.2f}", *o[1:]]) + "\n")
for o in out: print(f"{o[0]:.2f}  {o[1]:40.40}  ->  {o[2]}")
