# Spirit Card

Website thông tin rượu. Nội dung nằm trong Notion, web dựng bằng Astro, chạy trên Cloudflare Pages.

```
Notion (status = Published) → Astro build → Cloudflare Pages
```

## Cấu trúc thư mục

| Đường dẫn | Việc của nó |
|---|---|
| `src/lib/notion.js` | Đọc 3 database Notion, chỉ lấy dòng `Published` |
| `src/lib/sample.js` | Card mẫu Tanqueray, chỉ dùng khi chạy thử trên máy mà chưa có token |
| `src/lib/i18n.js` | Chữ cố định trên giao diện (VI / EN) |
| `src/layouts/Base.astro` | Khung trang: SEO, hreflang, menu, cổng 18+, chân trang |
| `src/components/` | Vòng nguyên liệu, biểu đồ 6 đỉnh, pairing A/B/C |
| `src/pages/[lang]/[loai]/[slug].astro` | Trang card, ví dụ `/vi/gin/tanqueray-london-dry-gin` |
| `src/pages/[lang]/[loai]/index.astro` | Hub loại rượu, ví dụ `/vi/gin/` |
| `.github/workflows/daily-build.yml` | Build lại mỗi ngày lúc 3:00 sáng giờ Việt Nam |

## Chạy thử trên máy

```bash
npm install
npm run dev        # mở http://localhost:4321/vi/gin/tanqueray-london-dry-gin
```

Chưa có `.env` thì web dùng card mẫu. Muốn đọc Notion thật: copy `.env.example` thành `.env` rồi điền `NOTION_TOKEN`.

## Cloudflare Pages

- Framework preset: **Astro** · Build command: `npm run build` · Output: `dist`
- Environment variables: `NOTION_TOKEN`, `NOTION_DS_SPIRIT`, `NOTION_DS_FUNFACT`, `NOTION_DS_WORKSHOP`
- Deploy Hook → dán vào GitHub secret `CLOUDFLARE_DEPLOY_HOOK` để build tự động mỗi ngày.

## Quy tắc

- Không nút mua, không link nơi bán rượu.
- Mọi trang có cổng 18+ và cảnh báo uống có trách nhiệm.
- Phân mục chưa đủ 20 card thì ẩn khỏi menu (`MENU_MIN` trong `i18n.js`).
