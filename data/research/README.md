# Dữ liệu nghiên cứu từng chai (database)

Mỗi chai một file `data/research/<loai>/<slug>.json`. Đây là dữ liệu thô có nguồn, dùng để:
1. Điền phần thông số của card khung trên web (abv, dung tích, rượu nền, vùng, nguyên liệu chính).
2. Làm nguyên liệu để soạn card đầy đủ 5 mục (lịch sử, sản xuất, nguyên liệu, taste note, ...).

Chỉ ghi điều có nguồn. Không chắc thì để `null` hoặc bỏ trống; không đoán.

```json
{
  "name": "Tên đúng như backlog",
  "slug": "slug-trong-backlog",
  "official_name": "Tên chính thức trên trang nhà sản xuất (nếu khác)",
  "abv": 47.3,
  "abv_by_market": ["47.3% | Mỹ", "43.1% | Anh"],
  "volume_ml": 700,
  "base_ingredient": "Ngũ cốc (lúa mì)",
  "region": "Fife, Scotland",
  "distillery": "Cameronbridge Distillery",
  "owner": "Diageo",
  "year_launched": 1830,
  "botanicals": ["Juniper", "Coriander", "Angelica root", "Liquorice"],
  "botanical_count": 4,
  "production": ["Chưng cất bốn lần", "Nồi đồng (copper pot still)"],
  "history": ["1830 | sự kiện ...", "1998 | sự kiện ..."],
  "nose": ["..."], "palate": ["..."], "finish": ["..."],
  "expressions": ["Tên phiên bản cùng dòng | khác biệt"],
  "serve_official": "Cách uống hãng khuyên (nếu có), ví dụ G&T với lát chanh",
  "notes": "Điều đáng chú ý khác (giải thưởng, chuyện thú vị) – có nguồn",
  "sources": ["https://..."],
  "confidence": "high | medium | low"
}
```

- `nose/palate/finish`: lấy theo mô tả của nhà sản xuất hoặc nguồn ngành uy tín, viết ngắn bằng tiếng Anh như nguồn; người soạn card sẽ dịch.
- `history`: mỗi dòng `năm | sự kiện`, chỉ mốc có nguồn.
- `confidence`: `high` khi có trang chính hãng; `medium` khi chỉ có nhà bán lẻ / ấn phẩm ngành; `low` khi thông tin ít.
