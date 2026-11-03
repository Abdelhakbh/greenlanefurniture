/** Public checkout API base (Shopify credentials live on this host). */
export const SHOPIFY_CHECKOUT_API_FALLBACK =
  "https://greenlanefurniture-psi.vercel.app";

export function shopifyCheckoutApiUrl() {
  const base =
    process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT_API?.replace(/\/$/, "") ||
    SHOPIFY_CHECKOUT_API_FALLBACK;
  return `${base}/api/checkout/shopify`;
}
