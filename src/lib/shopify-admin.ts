/**
 * Server-only Shopify Admin API (client credentials).
 * Maps Woo cart lines → Shopify variant IDs for checkout redirect.
 */

type ShopifyVariant = {
  id: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  sku: string | null;
};

type ShopifyProduct = {
  id: number;
  handle: string;
  options: { name: string; values: string[] }[];
  variants: ShopifyVariant[];
};

export type CheckoutCartLine = {
  handle: string;
  qty: number;
  attributes?: Record<string, string>;
  title?: string;
};

const cache = new Map<string, { at: number; product: ShopifyProduct | null }>();
const CACHE_MS = 10 * 60 * 1000;

function shopHost() {
  const raw =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE ||
    "uwmdi7-eh.myshopify.com";
  return raw.includes(".") ? raw : `${raw}.myshopify.com`;
}

let token: string | null = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (token && Date.now() < tokenExpiresAt - 60_000) return token;
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const staticToken = process.env.SHOPIFY_ADMIN_TOKEN;
  if (staticToken && !staticToken.startsWith("shpss_")) {
    token = staticToken;
    tokenExpiresAt = Date.now() + 86400_000;
    return token;
  }
  if (!clientId || !clientSecret) {
    throw new Error("Shopify API credentials are not configured");
  }
  const res = await fetch(`https://${shopHost()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) throw new Error("Shopify token exchange failed");
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  token = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ?? 86399) * 1000;
  return token;
}

async function adminGet<T>(path: string): Promise<T> {
  const res = await fetch(`https://${shopHost()}/admin/api/2025-01${path}`, {
    headers: { "X-Shopify-Access-Token": await getAccessToken() },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`Shopify ${path} (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const hit = cache.get(handle);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.product;
  const data = await adminGet<{ products: ShopifyProduct[] }>(
    `/products.json?handle=${encodeURIComponent(handle)}&limit=1&fields=id,handle,options,variants`,
  );
  const product = data.products?.[0] ?? null;
  cache.set(handle, { at: Date.now(), product });
  return product;
}

function variantMatches(
  product: ShopifyProduct,
  variant: ShopifyVariant,
  attributes?: Record<string, string>,
) {
  if (!attributes || !Object.keys(attributes).length) {
    return product.variants.length === 1;
  }
  for (let i = 0; i < product.options.length; i++) {
    const name = product.options[i]?.name;
    if (!name) continue;
    const wanted = attributes[name];
    if (!wanted) continue;
    const actual = variant[`option${i + 1}` as keyof ShopifyVariant];
    if (String(actual ?? "") !== String(wanted)) return false;
  }
  return true;
}

function pickVariant(product: ShopifyProduct, attributes?: Record<string, string>) {
  if (!product.variants.length) return null;
  if (product.variants.length === 1) return product.variants[0];
  const match = product.variants.find((v) => variantMatches(product, v, attributes));
  return match ?? null;
}

export function shopifyCartCheckoutUrl(items: { variantId: number; qty: number }[]) {
  const host = shopHost();
  if (!items.length) return `https://${host}/cart`;
  const merged = new Map<number, number>();
  for (const { variantId, qty } of items) {
    merged.set(variantId, (merged.get(variantId) ?? 0) + qty);
  }
  const line = [...merged.entries()].map(([id, q]) => `${id}:${q}`).join(",");
  // Flag must be `?checkout` (no value). `?checkout=1` breaks with "expected String to be a Hash".
  return `https://${host}/cart/${line}?checkout`;
}

export async function resolveShopifyCheckoutLines(lines: CheckoutCartLine[]) {
  const resolved: { variantId: number; qty: number }[] = [];
  for (const line of lines) {
    const product = await getProductByHandle(line.handle);
    if (!product) {
      throw new Error(`Product not found on Shopify: ${line.title ?? line.handle}`);
    }
    const variant = pickVariant(product, line.attributes);
    if (!variant) {
      throw new Error(
        `Could not match variant on Shopify for ${line.title ?? line.handle}. Try re-selecting options.`,
      );
    }
    resolved.push({ variantId: variant.id, qty: line.qty });
  }
  return resolved;
}

export function shopifyCheckoutEnabled() {
  if (process.env.SHOPIFY_CHECKOUT === "0") return false;
  if (process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT === "0") return false;
  return Boolean(
    process.env.SHOPIFY_CLIENT_ID &&
      process.env.SHOPIFY_CLIENT_SECRET &&
      process.env.SHOPIFY_CHECKOUT !== "0",
  );
}
