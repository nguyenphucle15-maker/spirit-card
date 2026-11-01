"""Tính tiến độ dự án từ dữ liệu trong repo, ghi data/progress/items.json và summary.json.
Chạy lại sau mỗi đợt làm việc rồi cập nhật file lên dashboard.

Tốc độ (rate) = số mục làm được trong MỘT lượt sử dụng (khoảng 5 giờ, ~200 lượt tìm kiếm),
đo từ các đợt đã chạy. WINDOWS_PER_DAY = số lượt dùng được mỗi ngày nếu nhắn "tiếp tục" đều.
"""
import json, glob, os, math, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
WINDOWS_PER_DAY = 3
RATE = {               # mục / lượt sử dụng
    "price": 110,      # tra giá nước ngoài (đo: 5 agent ~100–120 chai/lượt)
    "research": 180,   # hồ sơ nghiên cứu (đo: 182 hồ sơ ở lượt đầu)
    "card_vi": 100,    # soạn card đầy đủ tiếng Việt từ hồ sơ (ước tính, sẽ đo lại sau đợt đầu)
    "card_en": 150,    # viết lại bản tiếng Anh (ước tính)
    "funfact": 20,
}
SPIRITS = [("gin", "Gin"), ("tequila", "Tequila"), ("rum", "Rum"), ("vodka", "Vodka"),
           ("brandy", "Brandy"), ("whisky", "Whisky (OB + IB)")]
WHISKY_TOTAL = 268     # 220 OB + 48 IB, chưa nhập backlog

def load(p, default):
    try:
        return json.load(open(p, encoding="utf-8"))
    except FileNotFoundError:
        return default

def cards(loai, statuses=None):
    import yaml
    n = 0
    for f in glob.glob(f"content/cards/{loai}/*.yaml"):
        d = yaml.safe_load(open(f, encoding="utf-8")) or {}
        if statuses is None or d.get("status") in statuses:
            n += 1
    return n

def eta(remaining, kind):
    if remaining <= 0:
        return 0, 0.0
    w = math.ceil(remaining / RATE[kind])
    return w, round(w / WINDOWS_PER_DAY, 1)

rows = []
def add(category, section, item, done, total, kind=None, note="", order=0, status=None):
    total = max(total, 0)
    done = min(done, total) if total else done
    remaining = total - done
    w, days = eta(remaining, kind) if kind else (None, None)
    if status is None:
        status = "Xong" if total and done >= total else ("Đang làm" if done else "Chưa bắt đầu")
    rows.append({
        "id": f"{category}|{section}|{item}", "category": category, "section": section, "item": item,
        "done": done, "total": total, "pct": round(done / total, 4) if total else 0,
        "eta_windows": w, "eta_days": days, "status": status, "note": note, "order": order,
    })

# ---------------- Spirit Card ----------------
o = 0
for loai, label in SPIRITS:
    back = load(f"content/backlog/{loai}.json", [])
    total = len(back) if back else (WHISKY_TOTAL if loai == "whisky" else 0)
    active = [b for b in back if b.get("status") == "Còn lưu hành"]
    priced = sum(1 for b in back if b.get("price_vnd_min"))
    research = len(glob.glob(f"data/research/{loai}/*.json"))
    card_vi = cards(loai)
    published = cards(loai, {"Published"})
    reviewed = cards(loai, {"Reviewed", "Published"})
    o += 1
    add("Spirit Card", label, "1. Danh sách chai", total if back else 0, total,
        note="" if back else "Có file Excel, chưa nhập vào web", order=o * 10 + 1,
        status="Xong" if back else "Chưa bắt đầu")
    add("Spirit Card", label, "2. Giá tham khảo", priced, total, None if back else "price",
        note=(f"Đã tra hết {len(active)} chai còn lưu hành; còn lại là chai cần xác minh hoặc không có giá đáng tin"
              if back and loai != "whisky" else ""), order=o * 10 + 2,
        status=("Xong (phạm vi đã chốt)" if back else None))
    add("Spirit Card", label, "3. Database nghiên cứu", research, total, "research",
        note="ABV, botanicals, lịch sử, taste note của hãng, nguồn", order=o * 10 + 3)
    add("Spirit Card", label, "4. Card đầy đủ (VI)", card_vi, total, "card_vi",
        note="5 mục theo card mẫu Tanqueray", order=o * 10 + 4)
    add("Spirit Card", label, "5. Bản tiếng Anh", 0, total, "card_en", order=o * 10 + 5)
    add("Spirit Card", label, "6. Phúc duyệt và đăng", published, total,
        note="Phụ thuộc thời gian duyệt của Phúc", order=o * 10 + 6,
        status=("Đang làm" if reviewed else "Chưa bắt đầu"))

# ---------------- Fun Fact ----------------
ff = glob.glob("content/funfacts/*.yaml")
add("Fun Fact", "Fun Fact", "Soạn bài (mục tiêu 40)", len(ff), 40, "funfact", order=1)
add("Fun Fact", "Fun Fact", "Phúc duyệt và đăng", 0, 40, order=2,
    note="Đã có sẵn góc nội dung trong bảng tra cứu từng loại rượu")

# ---------------- Workshop ----------------
ws = glob.glob("content/workshops/*.yaml")
add("Workshop", "Workshop around Saigon", "Khung dữ liệu và trang", 1, 1, order=1, status="Xong")
add("Workshop", "Workshop around Saigon", "Nhập sự kiện", len(ws), max(len(ws), 1), order=2,
    status="Chờ Phúc gửi thông tin", note="Lệnh `workshop` + thông tin thô")

# ---------------- Cocktail / Technique / Glassware ----------------
for i, (sec, target) in enumerate([("Cocktail", 0), ("Technique", 0), ("Glassware", 0)], 1):
    add("Cocktail · Technique · Glassware", sec, "Schema", 1, 1, order=i * 10 + 1, status="Xong")
    add("Cocktail · Technique · Glassware", sec, "Trang và nội dung", 0, 1, order=i * 10 + 2,
        status="Làm sau ra mắt", note="Chưa chốt số lượng")

# ---------------- Website ----------------
web = [
    ("Khung web Astro + Cloudflare (miễn phí)", True, ""),
    ("Link xem trước bản nháp (nhánh review)", True, ""),
    ("Trang card: vòng nguyên liệu, biểu đồ 6 đỉnh, pairing A/B/C", True, ""),
    ("Trang loại rượu: vần A–Z, ô tìm kiếm", True, ""),
    ("Giá VN / quy đổi / ngưng sản xuất", True, ""),
    ("Cổng 18+ và cảnh báo", True, ""),
    ("Giao diện song ngữ VI/EN, hreflang", True, ""),
    ("Trang Fun Fact", True, ""),
    ("Trang Workshop", False, "Chưa có trang danh sách"),
    ("Ảnh nguyên liệu (Cloudinary/R2)", False, "Cần Phúc chọn nơi lưu và nguồn ảnh"),
    ("Đăng ký email ở chân trang", False, "Cần Phúc chọn công cụ (Brevo, Mailchimp…)"),
    ("Tên miền riêng", False, "Cần Phúc mua"),
    ("SEO: sitemap, trang hub mô tả loại rượu", False, ""),
]
for i, (it, ok, note) in enumerate(web, 1):
    add("Website", "Kỹ thuật", it, 1 if ok else 0, 1, order=i, note=note,
        status="Xong" if ok else ("Chờ Phúc" if "Phúc" in note else "Chưa làm"))

# ---------------- Tổng ----------------
sc = [r for r in rows if r["category"] == "Spirit Card"]
def tot(stage):
    rs = [r for r in sc if r["item"].startswith(stage)]
    return sum(r["done"] for r in rs), sum(r["total"] for r in rs), sum(r["eta_windows"] or 0 for r in rs)
p_done, p_tot, _ = tot("2.")
r_done, r_tot, r_w = tot("3.")
c_done, c_tot, c_w = tot("4.")
e_done, e_tot, e_w = tot("5.")
_, _, p_w = tot("2.")
vi_windows = r_w + c_w + p_w
gin_rows = {r["item"][:2]: r for r in sc if r["section"] == "Gin"}
gin_w = sum((gin_rows[k]["eta_windows"] or 0) for k in ("3.", "4."))
summary = [{
    "updated": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).strftime("%Y-%m-%d %H:%M"),
    "bottles": c_tot,
    "research_done": r_done, "research_pct": round(r_done / r_tot, 4) if r_tot else 0,
    "cards_done": c_done, "cards_pct": round(c_done / c_tot, 4) if c_tot else 0,
    "priced": p_done, "priced_pct": round(p_done / p_tot, 4) if p_tot else 0,
    "gin_ready_windows": gin_w, "gin_ready_days": round(gin_w / WINDOWS_PER_DAY, 1),
    "vi_windows": vi_windows, "vi_days": round(vi_windows / WINDOWS_PER_DAY, 1),
    "all_windows": vi_windows + e_w, "all_days": round((vi_windows + e_w) / WINDOWS_PER_DAY, 1),
    "windows_per_day": WINDOWS_PER_DAY,
}]
os.makedirs("data/progress", exist_ok=True)
json.dump(rows, open("data/progress/items.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(summary, open("data/progress/summary.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(json.dumps(summary[0], ensure_ascii=False))
print(len(rows), "dòng")
