/** Client-safe flag for Shopify checkout UI (no secrets). Default: Shopify. */
export function useShopifyCheckoutUi() {
  return process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT !== "0";
}

export function shopifyCheckoutUiEnabled() {
  return process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT !== "0";
}
