// src/lib/content.js
// Đọc nội dung từ các file trong thư mục content/ của repo (không còn dùng Notion).
// Tên trường bám đúng 02-schema.md.
//
//   content/cards/<loai>/<slug>.yaml   → Spirit Card
//   content/funfacts/<slug>.yaml       → Fun Fact
//   content/workshops/<slug>.yaml      → Workshop
//   content/backlog/<loai>.json        → danh sách chai (dùng cho card khung chạy thử)
//
// Hiển thị theo trạng thái:
//   - Nhánh main (web chính): chỉ status = Published (+ card khung chạy thử nếu bật).
//   - Nhánh khác main (link xem trước) và khi chạy trên máy: hiện cả Draft, Reviewed, có nhãn.

import YAML from "yaml";

const cardFiles = import.meta.glob("/content/cards/**/*.yaml", { query: "?raw", import: "default", eager: true });
const factFiles = import.meta.glob("/content/funfacts/*.yaml", { query: "?raw", import: "default", eager: true });
const workshopFiles = import.meta.glob("/content/workshops/*.yaml", { query: "?raw", import: "default", eager: true });
const backlogFiles = import.meta.glob("/content/backlog/*.json", { import: "default", eager: true });

// ---------- Chế độ hiển thị ----------
// Cloudflare Workers Builds cung cấp tên nhánh qua biến WORKERS_CI_BRANCH.
const env = (k) => (typeof process !== "undefined" ? process.env[k] : undefined) ?? import.meta.env[k];
const BRANCH = env("WORKERS_CI_BRANCH") || "";
export const PREVIEW = import.meta.env.DEV || env("SHOW_DRAFTS") === "1" || (BRANCH !== "" && BRANCH !== "main");
const VISIBLE = PREVIEW ? ["Draft", "Reviewed", "Published"] : ["Published"];
const SHOW_BACKLOG = env("SHOW_BACKLOG") !== "0";

// ---------- Tách trường dạng danh sách ----------
// "mỗi mục một dòng, các phần ngăn bằng ' | '"
const str = (v) => (v == null ? "" : String(v));
const lines = (s) => str(s).split("\n").map((l) => l.trim()).filter(Boolean);
const rows = (s, keys) =>
  lines(s).map((l) => {
    const parts = l.split("|").map((x) => x.trim());
    return Object.fromEntries(keys.map((k, i) => [k, parts[i] ?? ""]));
  });
const list = (v) => (Array.isArray(v) ? v.map(String) : lines(v).flatMap((l) => l.split(",").map((x) => x.trim())).filter(Boolean));
const num = (v) => (v === "" || v == null || isNaN(Number(v)) ? null : Number(v));
const date = (v) => (v ? String(v).slice(0, 10) : null);

// "sweet:1, fruity:1, floral:1, herbal_spicy:4, woody:0, smoky:0" → 6 đỉnh, kẹp 0–5
export const FLAVOR_AXES = ["sweet", "fruity", "floral", "herbal_spicy", "woody", "smoky"];
function flavor(v) {
  const out = Object.fromEntries(FLAVOR_AXES.map((k) => [k, 0]));
  const pairs = typeof v === "object" && v ? Object.entries(v) : str(v).split(",").map((p) => p.split(":"));
  for (const [k, val] of pairs) {
    const key = str(k).trim();
    if (FLAVOR_AXES.includes(key)) out[key] = Math.min(5, Math.max(0, Number(val) || 0));
  }
  return out;
}

const bi = (d, base, fn = (x) => x) => ({ vi: fn(d[`${base}_vi`]), en: fn(d[`${base}_en`]) });

export function slugify(s) {
  return str(s)
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/['’]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const parse = (raw, file) => {
  try { return YAML.parse(raw) || {}; }
  catch (e) { throw new Error(`Lỗi định dạng trong ${file}: ${e.message}`); }
};

// ---------- Spirit Card ----------

export function mapSpiritCard(d, file = "") {
  const category = str(d.category);
  const categorySlug = category.toLowerCase();
  const slug = str(d.slug) || slugify(d.name);
  return {
    id: `${categorySlug}/${slug}`,
    file,
    status: d.status || "Draft",
    // Phần đầu
    name: str(d.name),
    slug,
    category,
    categorySlug,
    sub_category: d.sub_category || null,
    brand: d.brand || null,
    producer: d.producer || null,
    country: d.country || null,
    region: d.region || null,
    bottling: d.bottling || null,
    abv: num(d.abv),
    volume_ml: num(d.volume_ml),
    age_statement: d.age_statement || null,
    base_ingredient: d.base_ingredient || null,
    cask: d.cask || null,
    year_founded: num(d.year_founded),
    price: {
      min: num(d.price_vnd_min),
      max: num(d.price_vnd_max),
      updated: date(d.price_updated),
      // false = không bán tại Việt Nam, giá là quy đổi từ giá nước ngoài
      availableVN: d.price_vn_available !== false,
      foreign: d.price_foreign || null,   // ví dụ "35 USD"
      fx: d.fx_rate || null,              // ví dụ "1 USD = 25.990 VND"
    },
    tier: d.tier || "Tiêu chuẩn",
    production_status: d.production_status || null, // Còn lưu hành / Ngừng sản xuất / Bản giới hạn / đã hết
    rating_10: num(d.rating_10),
    tasted_date: date(d.tasted_date),

    // Mục 1. Lịch sử & sản xuất
    history_summary: bi(d, "history_summary", str),
    history_timeline: bi(d, "history_timeline", (s) => rows(s, ["year", "event"])),
    production_notes: bi(d, "production_notes", lines),
    abv_by_market: rows(d.abv_by_market, ["abv", "market"]),
    expressions: rows(d.expressions, ["name", "difference"]),

    // Mục 2. Nguyên liệu & hương vị
    key_ingredients: list(d.key_ingredients),
    ingredient_notes: bi(d, "ingredient_notes", (s) => rows(s, ["name", "name_vi", "description"])),
    ingredient_images: Object.fromEntries(rows(d.ingredient_images, ["name", "url"]).map((r) => [r.name, r.url])),
    flavor_profile: flavor(d.flavor_profile),
    flavor_tags: list(d.flavor_tags),
    nose: bi(d, "nose", lines),
    palate: bi(d, "palate", lines),
    finish: bi(d, "finish", lines),

    // Mục 3. Cách uống
    serve: {
      neat: bi(d, "serve_neat", str),
      rocks: bi(d, "serve_rocks", str),
      tonic: bi(d, "serve_tonic", str),
      garnish: bi(d, "tonic_garnish", str),
      garnish_why: bi(d, "tonic_garnish_why", str),
    },

    // Mục 4. Pairing (A/B/C)
    pairing: bi(d, "pairing", (s) => rows(s, ["group", "dish", "method", "reason", "serve"])),

    // Mục 5. Bài đọc gợi ý: ghi dạng "gin/beefeater-london-dry-gin" và slug fun fact
    suggested_reads: list(d.suggested_reads),
    suggested_funfacts: list(d.suggested_funfacts),
    sources: lines(d.sources),
    backlog: d.backlog || null,
  };
}

// ---------- Card khung chạy thử từ backlog ----------
// content/backlog/gin.json: [{ name, type, producer, country, year, status, note }, ...]
function backlogCards() {
  if (!SHOW_BACKLOG) return [];
  const out = [];
  for (const [file, rowsData] of Object.entries(backlogFiles)) {
    const categorySlug = file.split("/").pop().replace(".json", "");
    if (categorySlug === "whisky") continue; // whisky làm sau
    const category = categorySlug[0].toUpperCase() + categorySlug.slice(1);
    for (const r of rowsData) {
      const c = mapSpiritCard({
        name: r.name, category, sub_category: r.type, producer: r.producer,
        country: r.country, year_founded: r.year, status: "Published",
        price_vnd_min: r.price_vnd_min, price_vnd_max: r.price_vnd_max, price_updated: r.price_updated,
        price_vn_available: r.price_vn_available, price_foreign: r.price_foreign, fx_rate: r.fx_rate,
      }, file);
      out.push({ ...c, isTest: true, backlogStatus: r.status || null, backlogNote: r.note || null });
    }
  }
  return out;
}

let cardsCache;
export function getSpiritCards() {
  if (cardsCache) return cardsCache;
  const real = Object.entries(cardFiles)
    .map(([file, raw]) => mapSpiritCard(parse(raw, file), file))
    .filter((c) => c.slug && c.categorySlug && VISIBLE.includes(c.status));

  const seen = new Set(real.map((c) => c.id));
  const realNames = new Set(real.map((c) => slugify(c.name)));
  const tests = [];
  for (const c of backlogCards()) {
    if (!c.slug || realNames.has(c.slug)) continue; // đã có card thật
    if (seen.has(c.id)) { c.slug = `${c.slug}-${tests.length}`; c.id = `${c.categorySlug}/${c.slug}`; }
    seen.add(c.id);
    tests.push(c);
  }
  cardsCache = [...real, ...tests];
  return cardsCache;
}

// ---------- Fun Fact ----------

let factsCache;
export function getFunFacts() {
  if (factsCache) return factsCache;
  factsCache = Object.entries(factFiles)
    .map(([file, raw]) => {
      const d = parse(raw, file);
      return {
        id: str(d.slug) || file.split("/").pop().replace(".yaml", ""),
        slug: str(d.slug) || file.split("/").pop().replace(".yaml", ""),
        status: d.status || "Draft",
        title: bi(d, "title", str),
        category: list(d.category),
        topic: d.topic || null,
        body: bi(d, "body", str),
        related_cards: list(d.related_cards),
        sources: lines(d.sources),
      };
    })
    .filter((f) => VISIBLE.includes(f.status));
  return factsCache;
}

// ---------- Workshop ----------

let workshopsCache;
export function getWorkshops() {
  if (workshopsCache) return workshopsCache;
  workshopsCache = Object.entries(workshopFiles)
    .map(([file, raw]) => {
      const d = parse(raw, file);
      return {
        id: file,
        status: d.status || "Draft",
        event_name: str(d.event_name),
        date: { start: d.date_start ? String(d.date_start) : null, end: d.date_end ? String(d.date_end) : null },
        venue: d.venue || null,
        organizer: d.organizer || null,
        type: d.type || null,
        price_vnd: d.price_vnd != null ? String(d.price_vnd) : null,
        register_url: d.register_url || null,
        description: bi(d, "description", str),
        related_cards: list(d.related_cards),
        event_status: d.event_status || null,
      };
    })
    .filter((w) => VISIBLE.includes(w.status))
    .sort((a, b) => (a.date.start || "").localeCompare(b.date.start || ""));
  return workshopsCache;
}

// ---------- Bài đọc gợi ý → link ----------

export function resolveReads(card, allCards, allFunFacts, lang = "vi") {
  const cardLinks = card.suggested_reads
    .map((ref) => allCards.find((c) => c.id === ref || c.slug === ref))
    .filter(Boolean)
    .map((c) => ({ kind: "Spirit Card", title: c.name, url: `/${lang}/${c.categorySlug}/${c.slug}` }));
  const factLinks = card.suggested_funfacts
    .map((ref) => allFunFacts.find((f) => f.slug === ref))
    .filter(Boolean)
    .map((f) => ({ kind: "Fun Fact", title: f.title[lang] || f.title.vi, url: `/${lang}/fun-fact/${f.slug}` }));
  return [...cardLinks, ...factLinks].slice(0, 4);
}
