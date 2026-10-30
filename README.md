# Spirit Card

Website thông tin rượu. Nội dung nằm ngay trong repo (thư mục `content/`), web dựng bằng Astro, chạy trên Cloudflare Workers.

```
content/*.yaml  →  push lên GitHub  →  Cloudflare tự build  →  web
```

## Nội dung nằm ở đâu

| Đường dẫn | Nội dung |
|---|---|
| `content/cards/<loai>/<slug>.yaml` | Spirit Card. Tên trường theo `02-schema.md` |
| `content/funfacts/<slug>.yaml` | Fun Fact |
| `content/workshops/<slug>.yaml` | Workshop |
| `content/backlog/<loai>.json` | Danh sách chai, dùng tạo card khung chạy thử |

Trường dạng danh sách: mỗi mục một dòng, các phần ngăn bằng ` | `. Dòng bắt đầu bằng `#` là ghi chú nội bộ, không hiện trên web.

## Duyệt trước khi đăng

- **Nhánh `main`** = web chính: chỉ hiện card `status: Published` (và card khung chạy thử).
- **Nhánh khác** (ví dụ `review`): Cloudflare tạo link xem trước riêng, hiện cả `Draft` và `Reviewed` kèm nhãn Bản nháp.
- Duyệt xong: đổi `status: Published` rồi gộp vào `main`.

## Code

| Đường dẫn | Việc của nó |
|---|---|
| `src/lib/content.js` | Đọc các file trong `content/`, lọc theo trạng thái |
| `src/lib/i18n.js` | Chữ cố định trên giao diện (VI / EN), ngưỡng ẩn menu |
| `src/layouts/Base.astro` | SEO, hreflang, menu, cổng 18+, chân trang |
| `src/components/` | Vòng nguyên liệu, biểu đồ 6 đỉnh, pairing A/B/C |
| `src/pages/[lang]/[loai]/[slug].astro` | Trang card |

## Chạy trên máy

```bash
npm install
npm run dev     # http://localhost:4321/vi/  (hiện cả bản nháp)
```

## Biến tuỳ chọn trên Cloudflare (Settings → Build → Variables)

- `SHOW_BACKLOG=0`: tắt card khung chạy thử.
- `SHOW_DRAFTS=1`: hiện cả bản nháp trên web chính (chỉ dùng tạm).

## Quy tắc

- Không nút mua, không link nơi bán rượu.
- Mọi trang có cổng 18+ và cảnh báo uống có trách nhiệm.
- Phân mục chưa đủ 20 card thì ẩn khỏi menu (`MENU_MIN` trong `i18n.js`).
