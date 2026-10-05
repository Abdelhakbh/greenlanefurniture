/**
 * Sync: greenlanefurniture.co.uk (Shopify JSON) → WooCommerce REST API.
 * Creates **variable** products when Shopify has multiple variants / options.
 *
 * Usage:
 *   $env:WORDPRESS_URL="https://silver-ostrich-907933.hostingersite.com"
 *   $env:WOOCOMMERCE_CONSUMER_KEY="ck_..."
 *   $env:WOOCOMMERCE_CONSUMER_SECRET="cs_..."
 *   node scripts/import-from-shopify.mjs
 *
 * Optional:
 *   $env:IMPORT_LIMIT="10"
 *   $env:UPGRADE_VARIANTS="1"   — re-import existing simple products as variable
 *   $env:GROUP_COLOUR_VARIANTS="1" (default) — merge "Name - Colour" siblings into one variable product
 *   $env:UPGRADE_MERGE="1"     — delete old simple products when merging by colour
 */

const WP = process.env.WORDPRESS_URL?.replace(/\/$/, "");
const KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const SEC = process.env.WOOCOMMERCE_CONSUMER_SECRET;
const SHOPIFY = process.env.SHOPIFY_STORE_DOMAIN ?? "greenlanefurniture.co.uk";
const LIMIT = process.env.IMPORT_LIMIT
  ? Number.parseInt(process.env.IMPORT_LIMIT, 10)
  : Infinity;
const UPGRADE_VARIANTS = process.env.UPGRADE_VARIANTS === "1";
const GROUP_COLOUR_VARIANTS = process.env.GROUP_COLOUR_VARIANTS !== "0";
const UPGRADE_MERGE = process.env.UPGRADE_MERGE === "1";
const COLOUR_ATTR = "Colour";

if (!WP || !KEY || !SEC) {
  console.error(
    "Set WORDPRESS_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET",
  );
  process.exit(1);
}

function wooUrl(path, search = {}) {
  const u = new URL(`${WP}/wp-json/wc/v3${path}`);
  u.searchParams.set("consumer_key", KEY);
  u.searchParams.set("consumer_secret", SEC);
  for (const [k, v] of Object.entries(search)) u.searchParams.set(k, String(v));
  return u.toString();
}

async function woo(method, path, body, search = {}) {
  const res = await fetch(wooUrl(path, search), {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function fetchAllShopifyProducts() {
  const all = [];
  let page = 1;
  while (page < 20) {
    const res = await fetch(
      `https://${SHOPIFY}/products.json?limit=250&page=${page}`,
    );
    const data = await res.json();
    if (!data.products?.length) break;
    all.push(...data.products);
    if (data.products.length < 250) break;
    page++;
  }
  return all;
}

const categoryCache = new Map();

async function ensureCategory(name) {
  if (!name) return null;
  const key = name.trim();
  if (categoryCache.has(key)) return categoryCache.get(key);
  const found = await woo("GET", "/products/categories", null, {
    search: key,
    per_page: 100,
  });
  const match = found.find(
    (c) => c.name.toLowerCase() === key.toLowerCase(),
  );
  if (match) {
    categoryCache.set(key, match.id);
    return match.id;
  }
  const created = await woo("POST", "/products/categories", { name: key });
  categoryCache.set(key, created.id);
  return created.id;
}

function stripOkPrice(html) {
  return html.replace(
    /<p>\s*<strong>\s*OK Price\s*<\/strong>[\s\S]*?<\/p>\s*/gi,
    "",
  );
}

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitBaseAndColour(title) {
  const parts = title.split(" - ").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const base = parts[0];
  const colour = parts.slice(1).join(" - ");
  if (!base || !colour) return null;
  return { base, colour };
}

/** Green Lane lists each finish as its own Shopify product — group by shared base name. */
function buildColourGroups(products) {
  const byBase = new Map();
  for (const p of products) {
    if (!isDefaultTitleOnly(p)) continue;
    const split = splitBaseAndColour(p.title);
    if (!split) continue;
    const key = split.base.toLowerCase();
    if (!byBase.has(key)) {
      byBase.set(key, { baseTitle: split.base, members: [] });
    }
    byBase.get(key).members.push({ ...split, product: p });
  }
  const groups = [];
  const handlesInGroups = new Set();
  for (const g of byBase.values()) {
    if (g.members.length < 2) continue;
    g.slug = slugify(g.baseTitle);
    g.members.sort((a, b) => a.colour.localeCompare(b.colour));
    for (const m of g.members) handlesInGroups.add(m.product.handle);
    groups.push(g);
  }
  return { groups, handlesInGroups };
}

function isDefaultTitleOnly(p) {
  const o = p.options?.[0];
  return (
    p.variants.length === 1 &&
    o?.name === "Title" &&
    o?.values?.[0] === "Default Title"
  );
}

function isVariableShopifyProduct(p) {
  if (isDefaultTitleOnly(p)) return false;
  if (p.variants.length > 1) return true;
  return p.options.some((o) => o.values.length > 1);
}

function shopifyOptionsForWoo(p) {
  return p.options.filter(
    (o) => !(o.name === "Title" && o.values.length === 1 && o.values[0] === "Default Title"),
  );
}

function variantPrices(v) {
  const price = v.price;
  const regular =
    v.compare_at_price && parseFloat(v.compare_at_price) > parseFloat(price)
      ? v.compare_at_price
      : price;
  return {
    regular_price: regular,
    sale_price: regular !== price ? price : "",
  };
}

function variantAttributes(p, v) {
  const opts = shopifyOptionsForWoo(p);
  const values = [v.option1, v.option2, v.option3].filter(Boolean);
  return opts.map((o, i) => ({
    name: o.name,
    option: values[i] ?? v.title,
  }));
}

async function productExists(slug) {
  const list = await woo("GET", "/products", null, { slug, per_page: 1 });
  return list[0] ?? null;
}

async function createWithImages(body, images, title) {
  const attempts = [
    images.slice(0, 8),
    images.slice(0, 3),
    images.slice(0, 1),
    [],
  ];
  let lastErr;
  for (const batch of attempts) {
    try {
      return await woo("POST", "/products", { ...body, images: batch });
    } catch (e) {
      lastErr = e;
      if (!String(e.message).includes("image")) throw e;
      console.warn(`  retry images (${batch.length}) for ${title}`);
    }
  }
  throw lastErr;
}

async function importSimpleProduct(p, catId, images) {
  const v = p.variants[0];
  const { regular_price, sale_price } = variantPrices(v);
  const body = {
    name: p.title,
    slug: p.handle,
    type: "simple",
    status: "publish",
    description: stripOkPrice(p.body_html || ""),
    short_description: p.product_type || "",
    regular_price,
    sale_price,
    manage_stock: false,
    stock_status: v.available ? "instock" : "outofstock",
    categories: catId ? [{ id: catId }] : [],
    sku: v.sku || undefined,
  };
  const created = await createWithImages(body, images, p.title);
  console.log(`imported (simple): ${p.title} (#${created.id})`);
  return created.id;
}

async function deleteProductById(id) {
  await woo("DELETE", `/products/${id}`, null, { force: true });
}

async function importGroupedColourProduct(group) {
  const { baseTitle, slug, members } = group;
  const handles = members.map((m) => m.product.handle);
  let existing = await productExists(slug);

  if (existing) {
    const ok =
      UPGRADE_MERGE &&
      (existing.type !== "variable" || existing.variations?.length !== members.length);
    if (!ok) {
      console.log(`skip (group exists): ${baseTitle}`);
      return existing.id;
    }
    console.log(`upgrade merge → variable: ${baseTitle}`);
    await deleteProductById(existing.id);
    existing = null;
  }

  if (UPGRADE_MERGE) {
    for (const h of handles) {
      const ex = await productExists(h);
      if (ex && ex.id !== existing?.id) {
        console.log(`  remove old simple: ${ex.name} (#${ex.id})`);
        await deleteProductById(ex.id);
      }
    }
  } else {
    for (const h of handles) {
      const ex = await productExists(h);
      if (ex) {
        console.log(`skip (group partial exists): ${baseTitle}`);
        return ex.id;
      }
    }
  }

  const lead = members
    .reduce((best, m) =>
      (m.product.body_html?.length ?? 0) > (best.product.body_html?.length ?? 0)
        ? m
        : best,
    members[0]).product;

  const catId = await ensureCategory(lead.product_type || "Furniture");
  const imageSeen = new Set();
  const images = [];
  for (const m of members) {
    for (const img of m.product.images) {
      if (imageSeen.has(img.src)) continue;
      imageSeen.add(img.src);
      images.push({ src: img.src, alt: `${baseTitle} — ${m.colour}` });
    }
  }

  const colourValues = members.map((m) => m.colour);
  const body = {
    name: baseTitle,
    slug,
    type: "variable",
    status: "publish",
    description: stripOkPrice(lead.body_html || ""),
    short_description: lead.product_type || "",
    categories: catId ? [{ id: catId }] : [],
    attributes: [
      {
        name: COLOUR_ATTR,
        visible: true,
        variation: true,
        options: colourValues,
      },
    ],
  };

  const parent = await createWithImages(body, images, baseTitle);

  for (const m of members) {
    const p = m.product;
    const v = p.variants[0];
    const { regular_price, sale_price } = variantPrices(v);
    await woo("POST", `/products/${parent.id}/variations`, {
      regular_price,
      sale_price,
      manage_stock: false,
      stock_status: v.available ? "instock" : "outofstock",
      sku: v.sku || undefined,
      attributes: [{ name: COLOUR_ATTR, option: m.colour }],
    });
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(
    `imported (grouped colour, ${members.length} variants): ${baseTitle} (#${parent.id})`,
  );
  return parent.id;
}

async function importVariableProduct(p, catId, images) {
  const wooOptions = shopifyOptionsForWoo(p);
  const attributes = wooOptions.map((o) => ({
    name: o.name,
    visible: true,
    variation: true,
    options: o.values,
  }));

  const body = {
    name: p.title,
    slug: p.handle,
    type: "variable",
    status: "publish",
    description: stripOkPrice(p.body_html || ""),
    short_description: p.product_type || "",
    categories: catId ? [{ id: catId }] : [],
    attributes,
  };

  const parent = await createWithImages(body, images, p.title);

  for (const v of p.variants) {
    const { regular_price, sale_price } = variantPrices(v);
    await woo("POST", `/products/${parent.id}/variations`, {
      regular_price,
      sale_price,
      manage_stock: false,
      stock_status: v.available ? "instock" : "outofstock",
      sku: v.sku || undefined,
      attributes: variantAttributes(p, v),
    });
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(
    `imported (variable, ${p.variants.length} variants): ${p.title} (#${parent.id})`,
  );
  return parent.id;
}

async function importProduct(p) {
  const slug = p.handle;
  let existing = await productExists(slug);
  const variable = isVariableShopifyProduct(p);

  if (existing) {
    const needsUpgrade =
      UPGRADE_VARIANTS && variable && existing.type === "simple";
    if (needsUpgrade) {
      console.log(`upgrade → variable: ${p.title}`);
      await woo("DELETE", `/products/${existing.id}`, null, { force: true });
      existing = null;
    } else {
      console.log(`skip (exists): ${p.title}`);
      return existing.id;
    }
  }

  const catId = await ensureCategory(p.product_type || "Furniture");
  const images = p.images.map((img) => ({ src: img.src, alt: p.title }));

  if (variable) {
    return importVariableProduct(p, catId, images);
  }
  return importSimpleProduct(p, catId, images);
}

async function main() {
  console.log(`Shopify: ${SHOPIFY} → Woo: ${WP}`);
  if (UPGRADE_VARIANTS) console.log("UPGRADE_VARIANTS=1 (simple → variable when needed)");
  if (GROUP_COLOUR_VARIANTS) {
    console.log("GROUP_COLOUR_VARIANTS=1 (merge Name - Colour siblings)");
    if (UPGRADE_MERGE) console.log("UPGRADE_MERGE=1 (replace old simple products in each group)");
  }
  const products = await fetchAllShopifyProducts();
  const slice = products.slice(0, LIMIT);
  const { groups, handlesInGroups } = GROUP_COLOUR_VARIANTS
    ? buildColourGroups(slice)
    : { groups: [], handlesInGroups: new Set() };

  const groupedHandles = new Set(handlesInGroups);
  const singles = slice.filter((p) => !groupedHandles.has(p.handle));

  console.log(
    `Importing ${slice.length} of ${products.length} (${groups.length} colour groups, ${singles.length} standalone)...`,
  );

  for (const g of groups) {
    try {
      await importGroupedColourProduct(g);
      await new Promise((r) => setTimeout(r, 450));
    } catch (e) {
      console.error(`FAILED group ${g.baseTitle}:`, e.message);
    }
  }

  for (const p of singles) {
    try {
      await importProduct(p);
      await new Promise((r) => setTimeout(r, 350));
    } catch (e) {
      console.error(`FAILED ${p.title}:`, e.message);
    }
  }
  console.log("Done.");
}

main();
