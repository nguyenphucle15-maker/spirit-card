"""Gộp kết quả tra giá nước ngoài (data/prices/batches/out_*.tsv) thành data/prices/<loai>_foreign.tsv
rồi chạy apply_prices.py cho từng loại.
Bỏ dòng không có giá, tiền tệ lạ, hoặc tên không khớp đúng backlog."""
import csv, glob, json, os, subprocess

LOAIS = ["gin", "vodka", "brandy", "tequila", "rum"]
names = {l: {b["name"] for b in json.load(open(f"content/backlog/{l}.json", encoding="utf-8"))} for l in LOAIS}
batch_loai = {}
for f in glob.glob("data/prices/batches/batch_*.tsv"):
    for r in csv.DictReader(open(f, encoding="utf-8"), delimiter="\t"):
        batch_loai[r["backlog_name"]] = r["loai"]

rows = {l: [] for l in LOAIS}
skipped = 0
for f in sorted(glob.glob("data/prices/batches/out_*.tsv")):
    for r in csv.DictReader(open(f, encoding="utf-8"), delimiter="\t"):
        name = (r.get("backlog_name") or "").strip()
        loai = batch_loai.get(name)
        try:
            price = float((r.get("price") or "").replace(",", ""))
        except ValueError:
            continue
        cur = (r.get("currency") or "").strip().upper()
        if not loai or name not in names[loai] or cur not in {"USD", "GBP", "EUR", "AUD"} or price <= 0:
            skipped += 1
            continue
        src = (r.get("source_url") or "").strip()
        size = (r.get("size_ml") or "").strip()
        rows[loai].append({"backlog_name": name, "price": price, "currency": cur,
                           "source": src, "size_ml": size})

for l in LOAIS:
    with open(f"data/prices/{l}_foreign.tsv", "w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["backlog_name", "price", "currency", "size_ml", "source"], delimiter="\t")
        w.writeheader()
        for r in rows[l]:
            w.writerow(r)
    subprocess.run(["python3", "scripts/apply_prices.py", l], check=True)
print(f"bỏ qua {skipped} dòng không hợp lệ")
