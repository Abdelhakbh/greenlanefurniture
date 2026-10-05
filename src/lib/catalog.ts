import * as shopify from "./shopify";
import * as woo from "./woocommerce";

export type {
  ProductCard,
  StoreCollection,
  StoreProduct,
} from "./types";

/** @deprecated use StoreProduct */
export type ShopifyProduct = import("./types").StoreProduct;
/** @deprecated use StoreCollection */
export type ShopifyCollection = import("./types").StoreCollection;

function useWooCommerce() {
  return Boolean(
    process.env.WORDPRESS_URL &&
      process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET,
  );
}

export const toProductCard = (...args: Parameters<typeof woo.toProductCard>) =>
  useWooCommerce() ? woo.toProductCard(...args) : shopify.toProductCard(...args);

export async function getAllProducts() {
  return useWooCommerce() ? woo.getAllProducts() : shopify.getAllProducts();
}

export async function getProduct(handle: string) {
  return useWooCommerce() ? woo.getProduct(handle) : shopify.getProduct(handle);
}

export async function getCollections() {
  return useWooCommerce() ? woo.getCollections() : shopify.getCollections();
}

export async function getCollectionProducts(handle: string) {
  return useWooCommerce()
    ? woo.getCollectionProducts(handle)
    : shopify.getCollectionProducts(handle);
}

export async function getRelatedProductCards(
  product: import("./types").StoreProduct,
  limit = 4,
) {
  return useWooCommerce()
    ? woo.getRelatedProductCards(product, limit)
    : shopify.getRelatedProductCards(product, limit);
}

export function storeCheckoutUrl(
  items: {
    productId: number;
    variantId: number;
    qty: number;
    attributes?: Record<string, string>;
  }[],
) {
  if (useWooCommerce()) {
    return woo.storeCheckoutUrl(items);
  }
  return shopify.shopifyCheckoutUrl(
    items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
  );
}

export function getFeaturedProducts(
  products: import("./types").StoreProduct[],
  limit = 8,
) {
  return useWooCommerce()
    ? woo.getFeaturedProducts(products, limit)
    : shopify.getFeaturedProducts(products, limit);
}
