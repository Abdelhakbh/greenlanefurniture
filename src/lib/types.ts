export type StoreImage = { src: string; alt: string | null };

export type StoreVariant = {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  option1: string | null;
  option2: string | null;
  option3: string | null;
};

export type StoreProduct = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  product_type: string;
  tags: string[];
  variants: StoreVariant[];
  images: StoreImage[];
  options: { name: string; values: string[] }[];
};

export type StoreCollection = {
  id: number;
  title: string;
  handle: string;
  description: string;
  image: { src: string } | null;
  products_count: number;
};

export type ProductCard = {
  id: number;
  handle: string;
  title: string;
  type: string;
  image: string;
  imageAlt: string;
  price: number;
  compareAt: number | null;
  savingPct: number;
  onSale: boolean;
  available: boolean;
  /** Woo: variation id (simple products use product id). Shopify: variant id. */
  variantId: number;
  productId: number;
};
