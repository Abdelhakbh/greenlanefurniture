/**
 * Server-only Shopify Admin API (client credentials).
 * Maps Woo cart lines → Shopify variant IDs for checkout redirect.
 */

import { getWooVariation } from "@/lib/woocommerce";

type ShopifyVariant = {
  id: number;
  title?: string;
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
  /** e.g. "Bed Size: King Size" when attributes missing from saved cart */
  optionLabel?: string;
  title?: string;
  wooProductId?: number;
  wooVariantId?: number;
};

const cache = new Map<string, { at: number; product: ShopifyProduct | null }>();
const CACHE_MS = 10 * 60 * 1000;

function normalizeShopHost(raw: string) {
  const trimmed = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return trimmed.includes(".") ? trimmed : `${trimmed}.myshopify.com`;
}

/** Admin API + OAuth — always the *.myshopify.com host. */
function adminShopHost() {
  const raw =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE ||
    "uwmdi7-eh.myshopify.com";
  const host = normalizeShopHost(raw);
  if (host.endsWith(".myshopify.com")) return host;
  const slug = host.split(".")[0];
  return `${slug}.myshopify.com`;
}

/** Public cart/checkout URLs — custom subdomain when connected in Shopify (e.g. checkout.example.com). */
function checkoutShopHost() {
  const checkout = process.env.SHOPIFY_CHECKOUT_DOMAIN?.trim();
  if (checkout) return normalizeShopHost(checkout);
  return adminShopHost();
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
  const res = await fetch(`https://${adminShopHost()}/admin/oauth/access_token`, {
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

async function adminFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`https://${adminShopHost()}/admin/api/2025-01${path}`, {
    method,
    headers: {
      "X-Shopify-Access-Token": await getAccessToken(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Shopify ${method} ${path} (${res.status}) ${detail.slice(0, 120)}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

async function adminGet<T>(path: string): Promise<T> {
  return adminFetch<T>("GET", path);
}

async function adminPut<T>(path: string, body: unknown): Promise<T> {
  return adminFetch<T>("PUT", path, body);
}

async function adminPost<T>(path: string, body: unknown): Promise<T> {
  return adminFetch<T>("POST", path, body);
}

let primaryLocationId: number | null = null;
const stockedVariantIds = new Set<number>();

async function getPrimaryLocationId() {
  if (primaryLocationId) return primaryLocationId;
  const data = await adminGet<{ locations: { id: number; active: boolean }[] }>(
    "/locations.json",
  );
  const loc = data.locations.find((l) => l.active) ?? data.locations[0];
  primaryLocationId = loc?.id ?? null;
  return primaryLocationId;
}

/** Shopify checkout: allow sale even when tracked inventory is 0. */
export async function ensureShopifyVariantInStock(variantId: number) {
  if (stockedVariantIds.has(variantId)) return;
  const data = await adminGet<{
    variant: {
      id: number;
      inventory_item_id: number | null;
      inventory_policy: string;
    };
  }>(`/variants/${variantId}.json?fields=id,inventory_item_id,inventory_policy`);

  const variant = data.variant;
  if (variant.inventory_policy !== "continue") {
    await adminPut(`/variants/${variantId}.json`, {
      variant: { id: variantId, inventory_policy: "continue" },
    });
  }

  if (variant.inventory_item_id) {
    const locationId = await getPrimaryLocationId();
    if (locationId) {
      await adminPost("/inventory_levels/set.json", {
        location_id: locationId,
        inventory_item_id: variant.inventory_item_id,
        available: 999,
      });
    }
  }

  stockedVariantIds.add(variantId);
}

export async function syncAllShopifyInventory() {
  const locationId = await getPrimaryLocationId();
  if (!locationId) throw new Error("No Shopify location found");

  let sinceId = 0;
  let products = 0;
  let variants = 0;

  for (;;) {
    const path = `/products.json?limit=250&fields=id,variants${
      sinceId ? `&since_id=${sinceId}` : ""
    }`;
    const data = await adminGet<{
      products: {
        id: number;
        variants: { id: number; inventory_item_id: number | null }[];
      }[];
    }>(path);
    const batch = data.products ?? [];
    if (!batch.length) break;

    for (const product of batch) {
      sinceId = product.id;
      products++;
      for (const variant of product.variants ?? []) {
        await ensureShopifyVariantInStock(variant.id);
        variants++;
      }
    }
    if (batch.length < 250) break;
  }

  return { products, variants, locationId };
}

async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const hit = cache.get(handle);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.product;

  const data = await adminGet<{ products: ShopifyProduct[] }>(
    `/products.json?handle=${encodeURIComponent(handle)}&limit=1`,
  );
  const base = data.products?.[0] ?? null;
  if (!base?.id) {
    cache.set(handle, { at: Date.now(), product: null });
    return null;
  }

  const vdata = await adminGet<{ variants: ShopifyVariant[] }>(
    `/products/${base.id}/variants.json?limit=250`,
  );
  const product: ShopifyProduct = {
    ...base,
    variants: vdata.variants ?? base.variants ?? [],
  };
  cache.set(handle, { at: Date.now(), product });
  return product;
}

function normOptionValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s&-]/g, "");
}

function normalizeSizeLabel(value: string) {
  const v = normOptionValue(value);
  if (v === "king" || v === "kingsize" || v === "king-size") return "king size";
  if (v === "superking" || v === "super-king") return "super king";
  if (v === "small double" || v === "small-double") return "small double";
  return v;
}

function collectLineAttributes(line: CheckoutCartLine): Record<string, string> {
  const merged: Record<string, string> = { ...(line.attributes ?? {}) };
  if (line.optionLabel?.trim()) {
    for (const part of line.optionLabel.split(" · ")) {
      const chunk = part.trim();
      if (!chunk) continue;
      const colon = chunk.indexOf(":");
      if (colon > 0) {
        merged[chunk.slice(0, colon).trim()] = chunk.slice(colon + 1).trim();
      } else if (!Object.keys(merged).length) {
        merged.Option = chunk;
      }
    }
  }
  return merged;
}

function normOptionName(name: string) {
  return name.trim().toLowerCase().replace(/colour/g, "color");
}

function variantOptionValues(variant: ShopifyVariant) {
  const raw = [variant.option1, variant.option2, variant.option3, variant.title]
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .map((v) => String(v));
  const normalized = raw.flatMap((v) => {
    const n = normOptionValue(v);
    const size = normalizeSizeLabel(v);
    return n === size ? [n] : [n, size];
  });
  return [...new Set(normalized)];
}

function variantMatchesByOptionNames(
  product: ShopifyProduct,
  variant: ShopifyVariant,
  attributes: Record<string, string>,
) {
  const attrByNorm = new Map<string, string>();
  for (const [key, val] of Object.entries(attributes)) {
    if (!val?.trim()) continue;
    attrByNorm.set(normOptionName(key), normOptionValue(val));
  }
  if (!attrByNorm.size) return false;

  let compared = 0;
  for (let i = 0; i < product.options.length; i++) {
    const name = product.options[i]?.name;
    if (!name) continue;
    const wanted = normalizeSizeLabel(
      attrByNorm.get(normOptionName(name)) ?? "",
    );
    if (!wanted) continue;
    compared++;
    const actual = variant[`option${i + 1}` as keyof ShopifyVariant];
    const actualNorm = normalizeSizeLabel(String(actual ?? ""));
    if (actualNorm !== wanted && normOptionValue(String(actual ?? "")) !== wanted) {
      return false;
    }
  }
  return compared > 0;
}

function variantMatchesByValues(variant: ShopifyVariant, attributes: Record<string, string>) {
  const wanted = Object.values(attributes)
    .filter((v) => v?.trim())
    .flatMap((v) => {
      const n = normOptionValue(v);
      const s = normalizeSizeLabel(v);
      return n === s ? [n] : [n, s];
    });
  if (!wanted.length) return false;
  const options = variantOptionValues(variant);
  return wanted.every((w) => options.includes(w));
}

function scoreVariantMatch(variant: ShopifyVariant, attributes: Record<string, string>) {
  const wanted = Object.values(attributes)
    .filter((v) => v?.trim())
    .flatMap((v) => {
      const n = normOptionValue(v);
      const s = normalizeSizeLabel(v);
      return n === s ? [n] : [n, s];
    });
  if (!wanted.length) return 0;
  const options = variantOptionValues(variant);
  let score = 0;
  for (const w of wanted) {
    if (options.includes(w)) score += 2;
    else if (options.some((o) => o.includes(w) || w.includes(o))) score += 1;
  }
  return score;
}

function pickVariant(product: ShopifyProduct, line: CheckoutCartLine) {
  if (!product.variants.length) return null;
  if (product.variants.length === 1) return product.variants[0];

  const attrs = collectLineAttributes(line);
  if (!Object.keys(attrs).length) return product.variants[0] ?? null;

  const byName = product.variants.find((v) =>
    variantMatchesByOptionNames(product, v, attrs),
  );
  if (byName) return byName;

  const byValues = product.variants.find((v) => variantMatchesByValues(v, attrs));
  if (byValues) return byValues;

  const scored = product.variants
    .map((v) => ({ v, score: scoreVariantMatch(v, attrs) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 1 || (scored.length > 1 && scored[0].score > scored[1].score)) {
    return scored[0].v;
  }

  const singleValue = Object.values(attrs).filter((v) => v?.trim());
  if (singleValue.length === 1) {
    const w = normalizeSizeLabel(singleValue[0]!);
    const exact = product.variants.find((v) =>
      variantOptionValues(v).includes(w),
    );
    if (exact) return exact;
  }

  return null;
}

async function createShopifyVariantFromWoo(
  product: ShopifyProduct,
  wooProductId: number,
  wooVariantId: number,
): Promise<ShopifyVariant | null> {
  let wooVar;
  try {
    wooVar = await getWooVariation(wooProductId, wooVariantId);
  } catch {
    return null;
  }
  if (!wooVar?.attributes?.length) return null;

  const opts = ["", "", ""] as string[];
  for (let i = 0; i < product.options.length && i < 3; i++) {
    const optName = product.options[i]?.name;
    const match = wooVar.attributes.find(
      (a) =>
        normOptionName(a.name) === normOptionName(optName ?? a.name),
    );
    opts[i] = match?.option ?? wooVar.attributes[i]?.option ?? "";
  }
  if (!opts[0] && wooVar.attributes[0]) {
    opts[0] = wooVar.attributes[0].option;
  }

  const price = wooVar.price || wooVar.regular_price;
  if (!price) return null;

  const data = await adminPost<{ variant: ShopifyVariant }>(
    `/products/${product.id}/variants.json`,
    {
      variant: {
        option1: opts[0] || null,
        option2: opts[1] || null,
        option3: opts[2] || null,
        price,
        inventory_policy: "continue",
        inventory_management: null,
      },
    },
  );

  cache.delete(product.handle);
  return data.variant ?? null;
}

export function shopifyCartCheckoutUrl(items: { variantId: number; qty: number }[]) {
  const host = checkoutShopHost();
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
    let variant = pickVariant(product, line);
    if (
      !variant &&
      line.wooProductId &&
      line.wooVariantId &&
      line.wooVariantId !== line.wooProductId
    ) {
      variant = await createShopifyVariantFromWoo(
        product,
        line.wooProductId,
        line.wooVariantId,
      );
      if (variant) {
        const refreshed = await getProductByHandle(line.handle);
        variant =
          refreshed?.variants.find((v) => v.id === variant!.id) ?? variant;
      }
    }
    if (!variant) {
      throw new Error(
        `Could not match variant on Shopify for ${line.title ?? line.handle}. Try re-selecting options.`,
      );
    }
    await ensureShopifyVariantInStock(variant.id);
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
