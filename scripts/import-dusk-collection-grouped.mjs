/**
 * Import one Dusk collection into WooCommerce, grouping colour listings into one
 * variable product per model (e.g. "Soho Sofa Bed - Grey" + "- Ink" → "Soho Sofa Bed"
 * with a Colour attribute). Each colour keeps its own price and image.
 *
 *   node scripts/import-dusk-collection-grouped.mjs
 *
 * Env:
 *   WORDPRESS_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET
 *   COLLECTION_HANDLE=all-sofas
 *   PRICE_DISCOUNT_PERCENT=40      regular = Dusk price, sale = minus this %
 *   MIN_SALE_PRICE=0               drop colours whose sale price is below this
 *   IMPORT_LIMIT                   max models (testing)
 *   DRY_RUN=1                      print the grouping without touching Woo
 *   REVIEWS=0                      skip Yotpo reviews
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PROGRESS_FILE = path.join(PROJECT_ROOT, "import-progress.json");

const WP = process.env.WORDPRESS_URL?.replace(/\/$/, "");
const KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const SEC = process.env.WOOCOMMERCE_CONSUMER_SECRET;
const SHOPIFY = process.env.SHOPIFY_STORE ?? "dusk.com";
const COLLECTION = process.env.COLLECTION_HANDLE ?? "all-sofas";
const DISCOUNT_PCT = Number.parseFloat(process.env.PRICE_DISCOUNT_PERCENT ?? "40");
const MIN_SALE_PRICE = Number.parseFloat(process.env.MIN_SALE_PRICE ?? "0");
const LIMIT = process.env.IMPORT_LIMIT
  ? Number.parseInt(process.env.IMPORT_LIMIT, 10)
  : Infinity;
const DRY_RUN = process.env.DRY_RUN === "1";
const WITH_REVIEWS = process.env.REVIEWS !== "0";
const BRAND_LABEL = "Green Lane";
const YOTPO_APP = process.env.YOTPO_APP_KEY ?? "Wck3dDhGIqR7sppv1UcGYfPhXYJeBPzzRSPu84t5";
const REVIEWS_MIN = Number.parseInt(process.env.REVIEWS_MIN ?? "50", 10);
const REVIEWS_MAX = Number.parseInt(process.env.REVIEWS_MAX ?? "100", 10);
const MAX_MAIN_IMAGES = 8;

if (!DRY_RUN && (!WP || !KEY || !SEC)) {
  console.error("Missing WORDPRESS_URL / WOOCOMMERCE_CONSUMER_KEY / WOOCOMMERCE_CONSUMER_SECRET");
  process.exit(1);
}

const SOURCE_BRAND = /\bDUSK\b|\bDusk\b|dusk\.co\.uk|dusk\.com/gi;
const TAG_DROP =
  /^(AW\d+|SS\d+|new_\d+days|category_\w+|Core|price-guard-allow-low|extra|bedroom\d+)$/i;

function rebrand(text) {
  if (!text) return text;
  return text
    .replace(SOURCE_BRAND, BRAND_LABEL)
    .replace(/\bGreen Lane Furniture\b/gi, BRAND_LABEL)
    .trim();
}

function cleanPlain(t) {
  return rebrand((t || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function cleanHtml(html) {
  return rebrand(
    (html || "")
      .replace(/<p>\s*<strong>\s*OK Price\s*<\/strong>[\s\S]*?<\/p>\s*/gi, "")
      .replace(/<img\b[^>]*>/gi, "")
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1"),
  );
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeProgress(data) {
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify({ updated_at: new Date().toISOString(), collection: COLLECTION, ...data }, null, 2),
  );
}

const SHOPIFY_HEADERS = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (compatible; GreenLaneCatalogSync/1.0)",
};

async function shopifyJson(url) {
  let lastErr;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(url, { headers: SHOPIFY_HEADERS });
      const text = await res.text();
      if (!res.ok || text.trimStart().startsWith("<")) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return JSON.parse(text);
    } catch (e) {
      lastErr = e;
      await sleep(Math.min(15_000, 1500 * attempt));
    }
  }
  throw lastErr;
}

async function fetchCollection() {
  const meta = await shopifyJson(`https://${SHOPIFY}/collections/${COLLECTION}.json`).catch(
    () => null,
  );
  const products = [];
  for (let page = 1; page < 40; page++) {
    const data = await shopifyJson(
      `https://${SHOPIFY}/collections/${COLLECTION}/products.json?limit=250&page=${page}`,
    );
    if (!data.products?.length) break;
    products.push(...data.products);
    if (data.products.length < 250) break;
    await sleep(400);
  }
  return { title: cleanPlain(meta?.collection?.title ?? COLLECTION), products };
}

function wooUrl(p, search = {}) {
  const u = new URL(`${WP}/wp-json/wc/v3${p}`);
  u.searchParams.set("consumer_key", KEY);
  u.searchParams.set("consumer_secret", SEC);
  for (const [k, v] of Object.entries(search)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function woo(method, p, body, search = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(wooUrl(p, search), {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }));
    const text = await res.text();
    if (res.ok) return text ? JSON.parse(text) : null;
    lastErr = new Error(`${method} ${p} ${res.status}: ${text.slice(0, 400)}`);
    if (res.status && res.status < 500 && res.status !== 429) throw lastErr;
    await sleep(2000 * attempt);
  }
  throw lastErr;
}

const categoryCache = new Map();

async function ensureCategory(name) {
  const key = cleanPlain(name);
  if (!key) return null;
  if (categoryCache.has(key)) return categoryCache.get(key);
  const slug = slugify(key);
  const bySlug = await woo("GET", "/products/categories", null, { slug, per_page: 1 });
  if (bySlug[0]) {
    categoryCache.set(key, bySlug[0].id);
    return bySlug[0].id;
  }
  try {
    const created = await woo("POST", "/products/categories", { name: key, slug });
    categoryCache.set(key, created.id);
    return created.id;
  } catch (e) {
    const m = String(e.message).match(/"resource_id":(\d+)/);
    if (!m) throw e;
    categoryCache.set(key, Number(m[1]));
    return Number(m[1]);
  }
}

let brandId;
async function ensureBrand() {
  if (brandId !== undefined) return brandId;
  try {
    const list = await woo("GET", "/products/brands", null, { search: BRAND_LABEL, per_page: 20 });
    const match = list.find((b) => b.name.toLowerCase() === BRAND_LABEL.toLowerCase());
    brandId = match ? match.id : (await woo("POST", "/products/brands", { name: BRAND_LABEL })).id;
  } catch {
    brandId = null;
  }
  return brandId;
}

function prices(listPrice) {
  const original = Number.parseFloat(listPrice);
  if (!Number.isFinite(original) || original <= 0) return null;
  const sale = original * ((100 - DISCOUNT_PCT) / 100);
  return {
    regular_price: original.toFixed(2),
    sale_price: DISCOUNT_PCT > 0 ? sale.toFixed(2) : "",
    sale,
  };
}

/** "Soho Sofa Bed - Chenille Olive" → { model: "Soho Sofa Bed", colour: "Chenille Olive" } */
function splitTitle(title) {
  const clean = cleanPlain(title);
  const m = clean.match(/^(.*\S)\s*-\s+(.+)$/);
  if (!m) return { model: clean, colour: "" };
  return { model: m[1].trim(), colour: m[2].trim() };
}

function groupByModel(products) {
  const groups = new Map();
  for (const p of products) {
    const v = p.variants?.[0];
    const pr = v ? prices(v.price) : null;
    if (!pr) continue;
    if (pr.sale < MIN_SALE_PRICE) continue;
    const { model, colour } = splitTitle(p.title);
    const key = slugify(model);
    if (!groups.has(key)) groups.set(key, { model, slug: key, colours: [] });
    const g = groups.get(key);
    let label = colour || v.option1 || "Standard";
    if (label === "Default Title") label = "Standard";
    if (g.colours.some((c) => c.label === label)) label = `${label} (${p.handle.split("-").pop()})`;
    g.colours.push({ label, product: p, variant: v, ...pr });
  }
  for (const g of groups.values()) {
    g.colours.sort((a, b) => a.sale - b.sale);
  }
  return [...groups.values()];
}

function imageList(group) {
  const def = group.colours[0];
  const out = [];
  const colourImageIndex = new Map();
  const indexBySrc = new Map();
  const push = (src, alt) => {
    if (!src) return -1;
    if (indexBySrc.has(src)) return indexBySrc.get(src);
    out.push({ src, alt });
    indexBySrc.set(src, out.length - 1);
    return out.length - 1;
  };
  for (const img of (def.product.images || []).slice(0, MAX_MAIN_IMAGES)) {
    push(img.src, `${group.model} - ${def.label}`);
  }
  for (const c of group.colours) {
    const first = c.product.images?.[0]?.src;
    const idx = push(first, `${group.model} - ${c.label}`);
    if (idx >= 0) colourImageIndex.set(c.label, idx);
  }
  return { images: out, colourImageIndex };
}

function collectTags(group) {
  const set = new Set();
  for (const c of group.colours) {
    const tags = Array.isArray(c.product.tags)
      ? c.product.tags
      : String(c.product.tags || "").split(",");
    for (const t of tags) {
      const name = cleanPlain(t);
      if (name && !TAG_DROP.test(name) && !/dusk/i.test(name)) set.add(name);
    }
  }
  return [...set].slice(0, 12).map((name) => ({ name }));
}

async function productBySlug(slug) {
  const list = await woo("GET", "/products", null, { slug, per_page: 1, status: "any" });
  return list[0] ?? null;
}

async function createParent(body, images) {
  for (const count of [images.length, 3, 1, 0]) {
    try {
      return await woo("POST", "/products", { ...body, images: images.slice(0, count) });
    } catch (e) {
      if (!String(e.message).toLowerCase().includes("image") || count === 0) throw e;
      console.warn(`  image upload failed with ${count} images, retrying with fewer`);
    }
  }
  throw new Error("unreachable");
}

async function fetchYotpoReviews(shopifyProductId) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `https://api-cdn.yotpo.com/v3/storefront/store/${YOTPO_APP}/product/${shopifyProductId}/reviews?page=${page}&perPage=20`,
    ).catch(() => null);
    if (!res?.ok) break;
    const j = await res.json();
    const batch = j.reviews || [];
    if (!batch.length) break;
    all.push(...batch);
    if (all.length >= (j.pagination?.total ?? 0) || all.length >= 200) break;
    await sleep(60);
  }
  const cap = Math.floor(Math.random() * (REVIEWS_MAX - REVIEWS_MIN + 1)) + REVIEWS_MIN;
  return [...all].sort(() => Math.random() - 0.5).slice(0, Math.min(cap, REVIEWS_MAX));
}

async function importReviews(wooId, group) {
  const seenIds = new Set();
  let reviews = [];
  for (const c of group.colours) {
    for (const rv of await fetchYotpoReviews(c.product.id)) {
      if (!seenIds.has(rv.id)) {
        seenIds.add(rv.id);
        reviews.push(rv);
      }
    }
    if (reviews.length >= REVIEWS_MAX) break;
  }
  reviews = reviews.slice(0, REVIEWS_MAX);
  let n = 0;
  for (const rv of reviews) {
    const imgs = (rv.images || [])
      .map((i) => i.original_url || i.url || i.thumb_url)
      .filter(Boolean)
      .map((src) => `<p><img src="${src.replace(/"/g, "&quot;")}" alt="Customer photo" loading="lazy" style="max-width:100%;height:auto" /></p>`)
      .join("");
    try {
      await woo("POST", "/products/reviews", {
        product_id: wooId,
        review: `${cleanPlain(rv.content || rv.title || "")}${imgs ? `<br/>${imgs}` : ""}`,
        reviewer: cleanPlain(rv.user?.display_name || "Customer") || "Customer",
        reviewer_email: `review${rv.id}@customers.greenlane.local`,
        rating: Math.min(5, Math.max(1, Math.round(Number(rv.score || 5)))),
        status: "approved",
      });
      n++;
      await sleep(80);
    } catch {
      /* duplicate or rejected review */
    }
  }
  return n;
}

async function importGroup(group, categoryIds) {
  const def = group.colours[0];
  const { images, colourImageIndex } = imageList(group);
  const single = group.colours.length === 1;
  const body = {
    name: single && def.label !== "Standard" ? `${group.model} - ${def.label}` : group.model,
    slug: group.slug,
    type: single ? "simple" : "variable",
    status: "publish",
    description: cleanHtml(def.product.body_html),
    short_description: cleanPlain(def.product.product_type || ""),
    categories: categoryIds.map((id) => ({ id })),
    tags: collectTags(group),
  };
  const bid = await ensureBrand();
  if (bid) body.brands = [{ id: bid }];

  if (single) {
    Object.assign(body, {
      regular_price: def.regular_price,
      sale_price: def.sale_price,
      sku: def.variant.sku || undefined,
      manage_stock: false,
      stock_status: "instock",
    });
    return createParent(body, images);
  }

  body.attributes = [
    {
      name: "Colour",
      visible: true,
      variation: true,
      options: group.colours.map((c) => c.label),
    },
  ];
  body.default_attributes = [{ name: "Colour", option: def.label }];

  const parent = await createParent(body, images);
  const uploaded = parent.images || [];
  const create = group.colours.map((c) => {
    const idx = colourImageIndex.get(c.label);
    const img = idx !== undefined && uploaded.length === images.length ? uploaded[idx] : null;
    return {
      regular_price: c.regular_price,
      sale_price: c.sale_price,
      sku: c.variant.sku || undefined,
      manage_stock: false,
      stock_status: "instock",
      attributes: [{ name: "Colour", option: c.label }],
      ...(img ? { image: { id: img.id } } : {}),
    };
  });
  for (let i = 0; i < create.length; i += 50) {
    const res = await woo("POST", `/products/${parent.id}/variations/batch`, {
      create: create.slice(i, i + 50),
    });
    const errors = (res.create || []).filter((v) => v.error);
    if (errors.length) {
      throw new Error(`variation errors: ${errors.map((e) => e.error.message).join("; ").slice(0, 200)}`);
    }
  }
  return parent;
}

async function main() {
  console.log(`Dusk collection "${COLLECTION}" → ${DRY_RUN ? "DRY RUN" : WP}`);
  console.log(`Pricing: ${DISCOUNT_PCT}% off · min sale £${MIN_SALE_PRICE} · brand ${BRAND_LABEL}`);

  const { title: collectionTitle, products } = await fetchCollection();
  const groups = groupByModel(products).slice(0, LIMIT);
  const colourCount = groups.reduce((n, g) => n + g.colours.length, 0);
  console.log(
    `${products.length} Dusk listings → ${groups.length} models (${colourCount} colours) in "${collectionTitle}"`,
  );

  if (DRY_RUN) {
    for (const g of groups) {
      const range = `£${g.colours[0].sale_price}–£${g.colours.at(-1).sale_price}`;
      console.log(`${g.model} [${g.colours.length}] ${range}: ${g.colours.map((c) => c.label).join(", ")}`);
    }
    return;
  }

  const collectionCat = await ensureCategory(collectionTitle);
  const stats = { total_planned: groups.length, added: 0, skipped_existing: 0, failed: 0, reviews: 0 };
  writeProgress({ phase: "importing", ...stats });

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    try {
      if (await productBySlug(g.slug)) {
        stats.skipped_existing++;
        console.log(`= exists: ${g.model}`);
        continue;
      }
      const typeCat = g.colours[0].product.product_type
        ? await ensureCategory(g.colours[0].product.product_type)
        : null;
      const cats = [collectionCat, typeCat].filter(Boolean);
      const created = await importGroup(g, [...new Set(cats)]);
      stats.added++;
      let reviewNote = "";
      if (WITH_REVIEWS) {
        const n = await importReviews(created.id, g);
        stats.reviews += n;
        if (n) reviewNote = ` · ${n} reviews`;
      }
      console.log(
        `[ADDED ${stats.added}/${groups.length}] ${g.model} · ${g.colours.length} colour(s)${reviewNote}`,
      );
    } catch (e) {
      stats.failed++;
      console.error(`! ${g.model}: ${e.message}`);
    }
    writeProgress({ phase: "importing", processed: i + 1, last_product: g.model, ...stats });
    await sleep(300);
  }

  writeProgress({ phase: "done", processed: groups.length, ...stats });
  console.log(
    `Done. added=${stats.added} existing=${stats.skipped_existing} failed=${stats.failed} reviews=${stats.reviews}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
