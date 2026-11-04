/** Headless storefront: never show or block purchase for out-of-stock. */
export function storefrontAvailable(_backendAvailable?: boolean): boolean {
  return true;
}
