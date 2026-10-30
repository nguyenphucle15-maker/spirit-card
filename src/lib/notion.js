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

// Lưu kết quả trong một lần build, tránh gọi Notion lặp lại cho từng trang
let cardsCache, factsCache, workshopsCache;

export async function getSpiritCards() {
  if (cardsCache) return cardsCache;
  if (USE_SAMPLE) {
    cardsCache = SAMPLE_CARDS.map((s) => mapSpiritCard(s.id, (k) => s[k] ?? null));
  } else {
    const pages = await queryPublished(import.meta.env.NOTION_DS_SPIRIT);
    cardsCache = pages.map((p) => mapSpiritCard(p.id, (k) => read(p, k)));
  }
  cardsCache = cardsCache.filter((c) => c.slug && c.categorySlug);
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
