import { site } from "./site";
import { parseMoney, savingPercent } from "./format";
import type { ProductCard } from "./types";

const STORE = process.env.SHOPIFY_STORE_DOMAIN ?? site.shopifyStore;
const BASE = `https://${STORE}`;

export type ShopifyImage = { src: string; alt: string | null };
export type ShopifyVariant = {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: { name: string; values: string[] }[];
};

export type ShopifyCollection = {
  id: number;
  title: string;
  handle: string;
  description: string;
  image: { src: string } | null;
  products_count: number;
};

async function shopifyFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`Shopify fetch failed: ${path} (${res.status})`);
  return res.json() as Promise<T>;
}

export function toProductCard(p: ShopifyProduct): ProductCard {
  const v = p.variants.find((x) => x.available) ?? p.variants[0];
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
    variantId: v?.id ?? 0,
    productId: p.id,
  };
}

export async function getAllProducts(): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  let page = 1;
  while (page < 20) {
    const data = await shopifyFetch<{ products: ShopifyProduct[] }>(
      `/products.json?limit=250&page=${page}`,
    );
    if (!data.products.length) break;
    all.push(...data.products);
    if (data.products.length < 250) break;
    page++;
  }
  return all.filter((p) => p.title && p.handle);
}

export async function getProduct(handle: string) {
  const data = await shopifyFetch<{ product: ShopifyProduct }>(
    `/products/${handle}.json`,
  );
  return data.product;
}

export async function getCollections() {
  const data = await shopifyFetch<{ collections: ShopifyCollection[] }>(
    "/collections.json?limit=50",
  );
  return data.collections.filter((c) => c.handle !== "frontpage");
}

export async function getCollectionProducts(handle: string) {
  const data = await shopifyFetch<{ products: ShopifyProduct[] }>(
    `/collections/${handle}/products.json?limit=250`,
  );
  return data.products;
}

export function shopifyCheckoutUrl(items: { variantId: number; qty: number }[]) {
  if (!items.length) return `${BASE}/cart`;
  const line = items.map((i) => `${i.variantId}:${i.qty}`).join(",");
  return `${BASE}/cart/${line}`;
}

export async function getRelatedProductCards(
  product: ShopifyProduct,
  limit = 4,
): Promise<ProductCard[]> {
  const collections = await getCollections();
  const cat = collections.find(
    (c) => c.title.toLowerCase() === product.product_type.toLowerCase(),
  );
  if (!cat) {
    return getAllProducts()
      .then((all) =>
        all
          .filter(
            (p) =>
              p.handle !== product.handle &&
              (p.product_type === product.product_type ||
                p.tags.some((t) => product.tags.includes(t))),
          )
          .slice(0, limit)
          .map(toProductCard),
      );
  }
  const products = await getCollectionProducts(cat.handle);
  return products
    .filter((p) => p.handle !== product.handle)
    .slice(0, limit)
    .map(toProductCard);
}

export function getFeaturedProducts(products: ShopifyProduct[], limit = 8) {
  const cards = products.map(toProductCard);
  const onSale = cards.filter((p) => p.onSale);
  const rest = cards.filter((p) => !p.onSale);
  return [...onSale, ...rest].slice(0, limit);
}
