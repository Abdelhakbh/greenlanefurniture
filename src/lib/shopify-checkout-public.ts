/** Client-safe flag for Shopify checkout UI (no secrets). */
export function useShopifyCheckoutUi() {
  return process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT !== "0";
}
