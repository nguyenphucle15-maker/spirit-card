// src/lib/notion.js
// Đọc dữ liệu từ Notion lúc build, chuyển mỗi dòng thành object gọn cho Astro.
// Tên trường bám đúng 02-schema.md. Chỉ lấy bản ghi status = Published.
//
// Biến môi trường (file .env khi chạy trên máy, Settings của Cloudflare Pages khi chạy online):
//   NOTION_TOKEN, NOTION_DS_SPIRIT, NOTION_DS_FUNFACT, NOTION_DS_WORKSHOP
//
// Chưa có NOTION_TOKEN:
//   - chạy `npm run dev` trên máy → dùng card mẫu Tanqueray (src/lib/sample.js) để xem giao diện
//   - build thật → không có trang card nào (không bao giờ đăng dữ liệu mẫu lên web)

import notionPkg from "@notionhq/client"; // thư viện dạng CommonJS nên import kiểu này
import { SAMPLE_CARDS } from "./sample.js";

const { Client } = notionPkg;

const TOKEN = import.meta.env.NOTION_TOKEN;
const notion = TOKEN ? new Client({ auth: TOKEN }) : null;
const USE_SAMPLE = !TOKEN && import.meta.env.DEV;

// ---------- 1. Đọc từng kiểu trường Notion ----------

const plain = (rich = []) => rich.map((t) => t.plain_text).join("");

function read(page, name) {
  const p = page.properties[name];
  if (!p) return null; // trường chưa có trong Notion → null, không làm hỏng build
  switch (p.type) {
    case "title":            return plain(p.title);
    case "rich_text":        return plain(p.rich_text);
    case "number":           return p.number;
    case "select":           return p.select?.name ?? null;
    case "multi_select":     return p.multi_select.map((o) => o.name);
    case "date":             return p.date ? { start: p.date.start, end: p.date.end } : null;
    case "url":              return p.url;
    case "relation":         return p.relation.map((r) => r.id);
    case "last_edited_time": return p.last_edited_time;
    default:                 return null;
  }
}

// ---------- 2. Tách trường dạng danh sách ----------
// "mỗi mục một dòng, các phần ngăn bằng ' | '"

const lines = (s) => (s || "").split("\n").map((l) => l.trim()).filter(Boolean);
const rows = (s, keys) =>
  lines(s).map((l) => {
    const parts = l.split("|").map((x) => x.trim());
    return Object.fromEntries(keys.map((k, i) => [k, parts[i] ?? ""]));
  });

// "sweet:1, fruity:1, floral:1, herbal_spicy:4, woody:0, smoky:0" → 6 đỉnh, kẹp 0–5
export const FLAVOR_AXES = ["sweet", "fruity", "floral", "herbal_spicy", "woody", "smoky"];
function flavor(s) {
  const out = Object.fromEntries(FLAVOR_AXES.map((k) => [k, 0]));
  (s || "").split(",").forEach((pair) => {
    const [k, v] = pair.split(":").map((x) => x?.trim());
    if (FLAVOR_AXES.includes(k)) out[k] = Math.min(5, Math.max(0, Number(v) || 0));
  });
  return out;
}

// Song ngữ: đọc cặp field_vi / field_en
const bi = (get, base, fn = (x) => x) => ({
  vi: fn(get(`${base}_vi`)),
  en: fn(get(`${base}_en`)),
});

// ---------- 3. Lấy toàn bộ dòng Published (tự lật trang, mỗi lần 100 dòng) ----------

async function queryPublished(dataSourceId) {
  if (!notion || !dataSourceId) return [];
  const results = [];
  let cursor;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: { property: "status", select: { equals: "Published" } },
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

// ---------- 4. Spirit Card ----------

export function mapSpiritCard(id, get) {
  const category = get("category") || "";
  return {
    id,
    // Phần đầu
    name: get("name"),
    slug: get("slug"),
    category,
    categorySlug: category.toLowerCase(), // dùng cho /vi/[loai]/[slug]
    sub_category: get("sub_category"),
    brand: get("brand"),
    producer: get("producer"),
    country: get("country"),
    region: get("region"),
    bottling: get("bottling"),
    abv: get("abv"),
    volume_ml: get("volume_ml"),
    age_statement: get("age_statement"),
    base_ingredient: get("base_ingredient"),
    cask: get("cask"),
    year_founded: get("year_founded"),
    price: {
      min: get("price_vnd_min"),
      max: get("price_vnd_max"),
      updated: get("price_updated")?.start ?? null,
    },
    tier: get("tier"),
    rating_10: get("rating_10"),
    tasted_date: get("tasted_date")?.start ?? null,

    // Mục 1. Lịch sử & sản xuất
    history_summary: bi(get, "history_summary"),
    history_timeline: bi(get, "history_timeline", (s) => rows(s, ["year", "event"])),
    production_notes: bi(get, "production_notes", lines),
    abv_by_market: rows(get("abv_by_market"), ["abv", "market"]),
    expressions: rows(get("expressions"), ["name", "difference"]),

    // Mục 2. Nguyên liệu & hương vị
    key_ingredients: get("key_ingredients") || [],
    ingredient_notes: bi(get, "ingredient_notes", (s) => rows(s, ["name", "name_vi", "description"])),
    ingredient_images: Object.fromEntries(
      rows(get("ingredient_images"), ["name", "url"]).map((r) => [r.name, r.url])
    ),
    flavor_profile: flavor(get("flavor_profile")),
    flavor_tags: get("flavor_tags") || [],
    nose: bi(get, "nose", lines),
    palate: bi(get, "palate", lines),
    finish: bi(get, "finish", lines),

    // Mục 3. Cách uống
    serve: {
      neat: bi(get, "serve_neat"),
      rocks: bi(get, "serve_rocks"),
      tonic: bi(get, "serve_tonic"),
      garnish: bi(get, "tonic_garnish"),
      garnish_why: bi(get, "tonic_garnish_why"),
    },

    // Mục 4. Pairing (A/B/C)
    pairing: bi(get, "pairing", (s) => rows(s, ["group", "dish", "method", "reason", "serve"])),

    // Mục 5. Bài đọc gợi ý, nguồn (Notion tách 2 cột Relation, web gộp lại)
    suggested_reads: get("suggested_reads") || [],
    suggested_funfacts: get("suggested_funfacts") || [],
    sources: lines(get("sources")),
    last_updated: get("last_updated"),
  };
}

// ---------- 4b. CHẠY THỬ: card khung từ backlog (Spirit Database) ----------
// Mỗi chai trong backlog thành một trang card khung (tên, loại, nước, năm, nhà sản xuất),
// gắn nhãn "Bản thử nghiệm". Chai đã có card thật thì bỏ qua.
// Tắt: đặt biến môi trường SHOW_BACKLOG=0 trên Cloudflare (hoặc xoá phần này).
// Whisky chưa đưa vào theo yêu cầu; rum, tequila chưa có bảng dữ liệu trong Notion.
const SHOW_BACKLOG = import.meta.env.SHOW_BACKLOG !== "0";

export const BACKLOGS = [
  { category: "Gin", ds: "f404619d-eff5-4ad5-b611-a580c81f0eca",
    name: "Tên gin", type: "Loại gin", producer: "Thuộc distillery nào" },
  { category: "Vodka", ds: "330b5690-1d5d-449d-89ed-53f084a32209",
    name: "Tên vodka", type: "Loại vodka", producer: "Thuộc distillery nào" },
  { category: "Brandy", ds: "a0148da2-ed3d-4f81-a327-680d6ef94052",
    name: "Tên brandy", type: "Loại brandy", producer: "Thuộc nhà sản xuất nào" },
];

export function slugify(s) {
  return (s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/['’]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Một dòng backlog → card khung, cùng cấu trúc với card thật
export function mapBacklogRow(cfg, page) {
  const get = (k) => read(page, k);
  const name = get(cfg.name);
  const base = mapSpiritCard(page.id, (k) => {
    switch (k) {
      case "name": return name;
      case "slug": return slugify(name);
      case "category": return cfg.category;
      case "sub_category": return get(cfg.type);
      case "producer": return get(cfg.producer);
      case "country": return get("Nước sản xuất");
      case "year_founded": return get("Năm sản xuất");
      default: return null;
    }
  });
  return {
    ...base,
    isTest: true,
    backlogStatus: get("Tình trạng"),
    backlogNote: get("Ghi chú"),
    linked: (get("spirit_card") || []).length > 0, // đã có card thật
  };
}

async function queryAll(dataSourceId) {
  const results = [];
  let cursor;
  do {
    const res = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor, page_size: 100 });
    results.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function getBacklogCards() {
  if (!notion || !SHOW_BACKLOG) return [];
  const out = [];
  for (const cfg of BACKLOGS) {
    try {
      const pages = await queryAll(cfg.ds);
      out.push(...pages.map((p) => mapBacklogRow(cfg, p)).filter((c) => !c.linked));
    } catch (e) {
      // Integration chưa được nối với trang Spirit Database → bỏ qua, build vẫn chạy
      console.warn(`[backlog] Không đọc được ${cfg.category}: ${e.message}`);
    }
  }
  return out;
}

// Lưu kết quả trong một lần build, tránh gọi Notion lặp lại cho từng trang
let cardsCache, factsCache, workshopsCache;

export async function getSpiritCards() {
  if (cardsCache) return cardsCache;
  let real;
  if (USE_SAMPLE) {
    real = SAMPLE_CARDS.map((s) => mapSpiritCard(s.id, (k) => s[k] ?? null));
  } else {
    const pages = await queryPublished(import.meta.env.NOTION_DS_SPIRIT);
    real = pages.map((p) => mapSpiritCard(p.id, (k) => read(p, k)));
  }
  real = real.filter((c) => c.slug && c.categorySlug);

  // Ghép card khung, bỏ trùng đường dẫn với card thật hoặc giữa các dòng backlog
  const seen = new Set(real.map((c) => `${c.categorySlug}/${c.slug}`));
  const tests = [];
  for (const c of await getBacklogCards()) {
    if (!c.slug) continue;
    let key = `${c.categorySlug}/${c.slug}`;
    if (seen.has(key)) {
      if (real.some((r) => `${r.categorySlug}/${r.slug}` === key)) continue; // đã có card thật
      c.slug = `${c.slug}-${c.id.slice(0, 4)}`;
      key = `${c.categorySlug}/${c.slug}`;
    }
    seen.add(key);
    tests.push(c);
  }
  cardsCache = [...real, ...tests];
  return cardsCache;
}

// ---------- 5. Fun Fact ----------

export async function getFunFacts() {
  if (factsCache) return factsCache;
  const pages = await queryPublished(import.meta.env.NOTION_DS_FUNFACT);
  factsCache = pages
    .map((page) => {
      const get = (k) => read(page, k);
      return {
        id: page.id,
        title: bi(get, "title"),
        slug: get("slug"),
        category: get("category") || [],
        topic: get("topic"),
        body: bi(get, "body"),
        related_cards: get("related_cards") || [],
        sources: lines(get("sources")),
      };
    })
    .filter((f) => f.slug);
  return factsCache;
}

// ---------- 6. Workshop ----------

export async function getWorkshops() {
  if (workshopsCache) return workshopsCache;
  const pages = await queryPublished(import.meta.env.NOTION_DS_WORKSHOP);
  workshopsCache = pages
    .map((page) => {
      const get = (k) => read(page, k);
      return {
        id: page.id,
        event_name: get("event_name"),
        date: get("date"),
        venue: get("venue"),
        organizer: get("organizer"),
        type: get("type"),
        price_vnd: get("price_vnd"),
        register_url: get("register_url"),
        description: bi(get, "description"),
        related_cards: get("related_cards") || [],
        event_status: get("event_status"),
      };
    })
    .sort((a, b) => (a.date?.start || "").localeCompare(b.date?.start || ""));
  return workshopsCache;
}

// ---------- 7. Đổi id Relation thành link bài viết ----------

export function resolveReads(card, allCards, allFunFacts, lang = "vi") {
  const cardLinks = card.suggested_reads
    .map((id) => allCards.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => ({ kind: "Spirit Card", title: c.name, url: `/${lang}/${c.categorySlug}/${c.slug}` }));
  const factLinks = card.suggested_funfacts
    .map((id) => allFunFacts.find((f) => f.id === id))
    .filter(Boolean)
    .map((f) => ({ kind: "Fun Fact", title: f.title[lang] || f.title.vi, url: `/${lang}/fun-fact/${f.slug}` }));
  return [...cardLinks, ...factLinks].slice(0, 4);
}
