import { shopifyCheckoutApiUrl } from "@/lib/shopify-checkout-api";

export type ShopifyCheckoutLine = {
  handle: string;
  qty: number;
  attributes?: Record<string, string>;
  optionLabel?: string;
  title?: string;
  wooProductId?: number;
  wooVariantId?: number;
};

export async function startShopifyCheckout(lines: ShopifyCheckoutLine[]) {
  const res = await fetch(shopifyCheckoutApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Could not start checkout. Please try again.");
  }
  window.location.href = data.url;
}
