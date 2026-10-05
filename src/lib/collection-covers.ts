import type { StoreCollection, StoreProduct } from "./types";

/** Homepage + footer: hide generic catch-all categories. */
const HIDDEN_COLLECTION = /^furniture$/i;

/** Prefer these four for “Shop by room” (slug or title match). */
const FEATURED_COLLECTION_ORDER = [
  /sofa/i,
  /bed/i,
  /pouffe|ottoman/i,
  /sideboard|storage|tv/i,
];

export function isVisibleCollection(c: StoreCollection) {
  return (
    c.products_count > 0 &&
    !HIDDEN_COLLECTION.test(c.title.trim()) &&
    !HIDDEN_COLLECTION.test(c.handle.replace(/-/g, " "))
  );
}

export function pickFeaturedCollections(
  collections: StoreCollection[],
  limit = 4,
): StoreCollection[] {
  const visible = collections.filter(isVisibleCollection);
  const picked: StoreCollection[] = [];
  for (const pattern of FEATURED_COLLECTION_ORDER) {
    const match = visible.find(
      (c) =>
        !picked.includes(c) &&
        (pattern.test(c.title) || pattern.test(c.handle.replace(/-/g, " "))),
    );
    if (match) picked.push(match);
  }
  for (const c of visible.sort((a, b) => b.products_count - a.products_count)) {
    if (picked.length >= limit) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked.slice(0, limit);
}

const roomStock: { match: RegExp; src: string }[] = [
  {
    match: /sofa|loveseat|corner|chaise/i,
    src: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /bed|mattress/i,
    src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /pouffe|ottoman/i,
    src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /sideboard|tv|unit|stand|table/i,
    src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
  },
  {
    match: /chair|armchair|accent/i,
    src: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=900&q=80",
  },
];

function stockCover(title: string, slug: string) {
  const hay = `${title} ${slug}`;
  return roomStock.find((r) => r.match.test(hay))?.src ?? roomStock[0].src;
}

export function collectionsWithCovers(
  collections: StoreCollection[],
  products: StoreProduct[],
): (StoreCollection & { coverSrc: string })[] {
  const anyImg = products.find((p) => p.images[0]?.src)?.images[0]?.src;

  return collections.map((c) => {
    if (c.image?.src) {
      return { ...c, coverSrc: c.image.src };
    }
    const inCategory = products.filter(
      (p) =>
        p.product_type.toLowerCase() === c.title.toLowerCase() ||
        c.title.toLowerCase().includes(p.product_type.toLowerCase()) ||
        p.product_type.toLowerCase().includes(c.title.toLowerCase()),
    );
    const fromProduct =
      inCategory.find((p) => p.images[0]?.src)?.images[0]?.src ??
      products.find((p) =>
        p.title.toLowerCase().includes(c.title.toLowerCase().split(" ")[0] ?? ""),
      )?.images[0]?.src;
    const coverSrc = fromProduct ?? stockCover(c.title, c.handle) ?? anyImg ?? "";
    return { ...c, coverSrc };
  });
}

export function pickHeroImage(products: StoreProduct[]): string {
  const prefer = products.find(
    (p) =>
      /sofa|shoreditch|soho|living|3 seater/i.test(p.title) && p.images[0]?.src,
  );
  if (prefer?.images[0]?.src) return prefer.images[0].src;
  const any = products.find((p) => p.images[0]?.src)?.images[0]?.src;
  if (any) return any;
  return "https://images.unsplash.com/photo-1618221195710-dd6b41fa6046?auto=format&fit=crop&w=1400&q=85";
}

export const supportTeamImage = "/support-team.png";
