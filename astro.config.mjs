// Cấu hình Astro: xuất web tĩnh (static), Cloudflare Pages chỉ việc phục vụ thư mục dist/.
import { defineConfig } from "astro/config";

export default defineConfig({
  // Đổi thành tên miền thật khi có (dùng cho hreflang và link chuẩn SEO)
  site: "https://spirit-card.pages.dev",
  output: "static",
  trailingSlash: "ignore",
});
