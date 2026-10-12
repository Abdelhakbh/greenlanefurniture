import { parseMoney, savingPercent } from "./format";
import type {
  ProductCard,
  StoreCollection,
  StoreProduct,
  StoreVariant,
} from "./types";

type WooImage = { src: string; alt?: string };
type WooCategory = { id: number; name: string; slug: string };
type WooProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  type: string;
  status: string;
  regular_price: string;
  sale_price: string;
  price: string;
  on_sale: boolean;
  stock_status: string;
  images: WooImage[];
  categories: WooCategory[];
  tags: { name: string }[];
  attributes: { id: number; name: string; variation: boolean; options: string[] }[];
  variations: number[];
};

type WooVariation = {
  id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  attributes: { name: string; option: string }[];
  image?: { src: string } | null;
};

function getConfig() {
  const base = process.env.WORDPRESS_URL?.replace(/\/$/, "");
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!base || !key || !secret) {
    throw new Error(
      "WooCommerce is not configured. Set WORDPRESS_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET.",
    );
  }
  return { base, key, secret };
}

async function wooFetch<T>(path: string, attempt = 0, fresh = false): Promise<T> {
  const { base, key, secret } = getConfig();
  const url = new URL(`${base}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);
  const res = await fetch(
    url.toString(),
    fresh ? { cache: "no-store" } : { next: { revalidate: 300 } },
  );
  if (!res.ok) {
    if (attempt < 5 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      return wooFetch<T>(path, attempt + 1, fresh);
    }
    throw new Error(`WooCommerce fetch failed: ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** An empty list may be a stale cache entry from when the store was empty — confirm live. */
async function wooList<T>(path: string): Promise<T[]> {
  const list = await wooFetch<T[]>(path);
  if (Array.isArray(list) && list.length) return list;
  return wooFetch<T[]>(path, 0, true);
}

async function wooListAllPages<T>(path: string, perPage = 100): Promise<T[]> {
  const all: T[] = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page < 60; page++) {
    const batch = await wooList<T>(`${path}${sep}per_page=${perPage}&page=${page}`);
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < perPage) break;
  }
  return all;
}

/**
 * Listing fields only (no descriptions). Next's data cache rejects responses over 2MB,
 * which silently pins an old, shorter product list.
 */
const LIST_QUERY =
  "status=publish&_fields=id,name,slug,type,status,regular_price,sale_price,price,on_sale,stock_status,images,categories,tags,attributes,variations";
const LIST_PAGE_SIZE = 50;

function variantFromSimple(p: WooProduct): StoreVariant {
  const price = p.price || p.regular_price || "0";
  const compare =
    p.on_sale && p.regular_price ? p.regular_price : null;
  return {
    id: p.id,
    title: "Default Title",
    price,
    compare_at_price: compare,
    available: p.stock_status === "instock",
    option1: null,
    option2: null,
    option3: null,
  };
}

function variantFromWoo(v: WooVariation): StoreVariant {
  const compare =
    v.sale_price && v.regular_price && v.sale_price !== v.regular_price
      ? v.regular_price
      : null;
  const opts = v.attributes.map((a) => a.option);
  return {
    id: v.id,
    title: opts.join(" / ") || "Default Title",
    price: v.price || v.regular_price || "0",
    compare_at_price: compare,
    available: v.stock_status === "instock",
    option1: opts[0] ?? null,
    option2: opts[1] ?? null,
    option3: opts[2] ?? null,
    image: v.image?.src ?? null,
  };
}

async function loadVariations(productId: number): Promise<StoreVariant[]> {
  try {
    const list = await wooFetch<WooVariation[]>(
      `/products/${productId}/variations?per_page=100`,
    );
    const variants = list.map(variantFromWoo);
    return variants.length ? variants : [];
  } catch {
    return [];
  }
}

/** List/catalog views: use parent min price — avoids N variation API calls at build time. */
function variantFromVariableSummary(p: WooProduct): StoreVariant {
  const price = p.price || p.regular_price || "0";
  const compare =
    p.on_sale && p.regular_price && p.regular_price !== price
      ? p.regular_price
      : null;
  return {
    id: p.variations?.[0] ?? p.id,
    title: "Default Title",
    price,
    compare_at_price: compare,
    available: p.stock_status !== "outofstock",
    option1: null,
    option2: null,
    option3: null,
  };
}

async function mapWooProduct(
  p: WooProduct,
  loadVariationDetails = false,
): Promise<StoreProduct> {
  let variants: StoreVariant[] = [];
  if (p.type === "variable" && p.variations?.length) {
    variants = loadVariationDetails
      ? await loadVariations(p.id)
      : [variantFromVariableSummary(p)];
    if (loadVariationDetails && !variants.length) {
      variants = [variantFromVariableSummary(p)];
    }
  } else {
    variants = [variantFromSimple(p)];
  }

  const options =
    p.attributes
      ?.filter((a) => a.variation && a.options?.length)
      .map((a) => ({ name: a.name, values: a.options })) ?? [];

  return {
    id: p.id,
    title: p.name,
    handle: p.slug,
    body_html: p.description || p.short_description || "",
    product_type: p.categories[0]?.name ?? "",
    tags: p.tags?.map((t) => t.name) ?? [],
    variants,
    images: p.images.map((i) => ({ src: i.src, alt: i.alt ?? null })),
    options,
  };
}

function wooAttributeParam(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `attribute_${slug}`;
}

export function toProductCard(p: StoreProduct): ProductCard {
  const sorted = [...p.variants].sort(
    (a, b) => parseMoney(a.price) - parseMoney(b.price),
  );
  const v = sorted.find((x) => x.available) ?? sorted[0];
  const price = parseMoney(v?.price ?? "0");
  const compareAt = v?.compare_at_price
    ? parseMoney(v.compare_at_price)
    : null;
  const img = p.images[0];
  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    type: p.product_type,
    image: img?.src ?? "",
    imageAlt: img?.alt ?? p.title,
    price,
    compareAt,
    savingPct: savingPercent(price, compareAt),
    onSale: compareAt !== null && compareAt > price,
    available: v?.available ?? false,
    variantId: v?.id ?? p.id,
    productId: p.id,
  };
}

export async function getAllProducts(): Promise<StoreProduct[]> {
  try {
    const all = await wooListAllPages<WooProduct>(`/products?${LIST_QUERY}`, LIST_PAGE_SIZE);
    const mapped = await Promise.all(all.map((p) => mapWooProduct(p, false)));
    return mapped.filter((p) => p.title && p.handle);
  } catch (e) {
    console.error("getAllProducts failed", e);
    return [];
  }
}

export async function getProduct(handle: string) {
  const found = await wooFetch<WooProduct[]>(
    `/products?slug=${encodeURIComponent(handle)}&status=publish`,
  );
  const p = found[0];
  if (!p) throw new Error("Product not found");
  return mapWooProduct(p, true);
}

export async function getCollections(): Promise<StoreCollection[]> {
  try {
    return await fetchCollections();
  } catch (e) {
    console.error("getCollections failed", e);
    return [];
  }
}

async function fetchCollections(): Promise<StoreCollection[]> {
  const cats = await wooListAllPages<{
    id: number;
    name: string;
    slug: string;
    description: string;
    count: number;
    image: { src: string } | null;
  }>("/products/categories?hide_empty=true");
  return cats
    .filter((c) => c.slug !== "uncategorized")
    .map((c) => ({
      id: c.id,
      title: c.name,
      handle: c.slug,
      description: c.description ?? "",
      image: c.image?.src ? { src: c.image.src } : null,
      products_count: c.count,
    }));
}


export async function getCollectionProducts(handle: string) {
  const cats = await wooList<{ id: number; slug: string }>(
    `/products/categories?slug=${encodeURIComponent(handle)}`,
  );
  const cat = cats[0];
  if (!cat) return [];
  const products = await wooListAllPages<WooProduct>(
    `/products?category=${cat.id}&${LIST_QUERY}`,
    LIST_PAGE_SIZE,
  );
  return Promise.all(products.map((p) => mapWooProduct(p, false)));
}

export function getPublicStoreBaseUrl() {
  const raw =
    process.env.WORDPRESS_URL ?? process.env.NEXT_PUBLIC_WORDPRESS_URL;
  return raw?.replace(/\/$/, "") ?? "";
}

export function buildStoreCheckoutUrl(
  base: string,
  items: {
    productId: number;
    variantId: number;
    qty: number;
    attributes?: Record<string, string>;
  }[],
) {
  if (!items.length) return `${base}/cart/`;
  if (items.length === 1) {
    const item = items[0];
    const params = new URLSearchParams({
      "add-to-cart": String(item.productId),
      quantity: String(item.qty),
    });
    if (item.variantId && item.variantId !== item.productId) {
      params.set("variation_id", String(item.variantId));
    }
    for (const [name, value] of Object.entries(item.attributes ?? {})) {
      if (value) params.set(wooAttributeParam(name), value);
    }
    return `${base}/cart/?${params.toString()}`;
  }
  return `${base}/cart/`;
}

export function storeCheckoutUrl(
  items: Parameters<typeof buildStoreCheckoutUrl>[1],
) {
  const base = getPublicStoreBaseUrl() || getConfig().base;
  return buildStoreCheckoutUrl(base, items);
}

export async function getRelatedProductCards(
  product: StoreProduct,
  limit = 4,
): Promise<ProductCard[]> {
  const collections = await getCollections();
  const cat = collections.find((c) => c.title === product.product_type);
  if (!cat) return [];
  const products = await getCollectionProducts(cat.handle);
  return products
    .filter((p) => p.handle !== product.handle)
    .slice(0, limit)
    .map(toProductCard);
}

export function getFeaturedProducts(products: StoreProduct[], limit = 8) {
  const cards = products.map(toProductCard);
  const onSale = cards.filter((p) => p.onSale);
  const rest = cards.filter((p) => !p.onSale);
  return [...onSale, ...rest].slice(0, limit);
}

export function getStoreBaseUrl() {
  return getConfig().base;
}
