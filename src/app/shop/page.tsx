import { ProductCard } from "@/components/product-card";
import { getAllProducts, toProductCard } from "@/lib/catalog";
import { buildPageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const revalidate = 600;

export const metadata = buildPageMetadata({
  title: "Shop",
  description: `Browse sofas, beds, storage and home furniture from ${site.name}. Free UK delivery on qualifying orders.`,
  path: "/shop",
});

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await getAllProducts();
  const query = q?.trim().toLowerCase();
  const filtered = query
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.product_type.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query)),
      )
    : products;

  const cards = filtered.map(toProductCard);

  return (
    <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vw,3rem)]">
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium">
        Shop all
      </h1>
      <p className="mt-2 text-foreground/60">
        {cards.length} {cards.length === 1 ? "piece" : "pieces"}
        {query ? ` matching “${q}”` : ""}
      </p>
      <form className="mt-6 max-w-md" action="/shop" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search sofas, beds, pouffes…"
          className="w-full rounded-md border border-foreground/20 bg-white px-4 py-2.5 text-sm"
        />
      </form>
      <div className="mt-8 grid grid-cols-2 gap-[clamp(0.8rem,2vw,1.5rem)] md:grid-cols-3 lg:grid-cols-4">
        {cards.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
