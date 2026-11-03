/** Checkout API on the same site (production has Shopify credentials). */
export function shopifyCheckoutApiUrl() {
  const base = process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_API?.replace(/\/$/, "");
  if (base) return `${base}/api/checkout/shopify`;
  return "/api/checkout/shopify";
}
