"""Ghi giá vào content/backlog/<loai>.json.
Nguồn 1 (có bán tại VN): data/prices/<loai>_matches.tsv, nhận cặp điểm >= 0.85 hoặc có trong data/prices/<loai>_manual.tsv
  (retail_name<TAB>backlog_name; backlog_name để trống = loại bỏ cặp đó).
Nguồn 2 (không có tại VN): data/prices/<loai>_foreign.tsv (backlog_name, price, currency, source) → quy đổi theo tỷ giá.
"""
import csv, json, sys, os
loai = sys.argv[1]
FX = {"USD": 26000, "GBP": 35102, "EUR": 29642, "AUD": 18439}   # tỷ giá bán Vietcombank, xem data/prices/fx.md
FX_DATE = "30/10/2026"
UPDATED = "2026-10-31"
rd = lambda p: list(csv.DictReader(open(p, encoding="utf-8"), delimiter="\t")) if os.path.exists(p) else []

back = json.load(open(f"content/backlog/{loai}.json", encoding="utf-8"))
by = {b["name"]: b for b in back}
manual = {r["retail_name"]: r["backlog_name"] for r in rd(f"data/prices/{loai}_manual.tsv")}
vn = {}
for m in rd(f"data/prices/{loai}_matches.tsv"):
    target = manual.get(m["retail_name"], m["backlog_name"] if float(m["score"]) >= 0.85 else None)
    if not target: continue
    vn.setdefault(target, []).append((int(m["price_vnd"]), m["source"]))
for b in back:
    for k in ("price_vnd_min","price_vnd_max","price_updated","price_vn_available","price_foreign","fx_rate","price_sources"): b.pop(k, None)
n_vn = n_fx = 0
for name, ps in vn.items():
    b = by[name]; prices = [p for p, _ in ps if p > 1000]
    if not prices: continue
    b.update(price_vnd_min=min(prices), price_vnd_max=max(prices), price_updated=UPDATED,
             price_vn_available=True, price_sources=sorted({s for _, s in ps})); n_vn += 1
for f in rd(f"data/prices/{loai}_foreign.tsv"):
    b = by.get(f["backlog_name"])
    if not b or b.get("price_vn_available"): continue
    cur = f["currency"]; amt = float(f["price"])
    vnd = int(round(amt * FX[cur], -4))
    b.update(price_vnd_min=vnd, price_vnd_max=vnd, price_updated=UPDATED, price_vn_available=False,
             price_foreign=f"{amt:g} {cur}" + (f" (chai {f['size_ml']}ml)" if f.get("size_ml") not in (None, "", "700", "750") else ""), fx_rate=f"1 {cur} = " + f"{FX[cur]:,}".replace(",", ".") + f" VND, {FX_DATE}",
             price_sources=[f["source"]]); n_fx += 1
json.dump(back, open(f"content/backlog/{loai}.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{loai}: {n_vn} chai giá VN, {n_fx} chai giá quy đổi, {len(back)-n_vn-n_fx} chưa có giá / {len(back)}")
