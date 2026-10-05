import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getCollectionProducts, getCollections, toProductCard } from "@/lib/catalog";

export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const collections = await getCollections();
  const c = collections.find((x) => x.handle === handle);
  return { title: c?.title ?? "Category" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const collections = await getCollections();
  const collection = collections.find((c) => c.handle === handle);
  if (!collection) notFound();

  const products = await getCollectionProducts(handle);
  const cards = products.map(toProductCard);

  return (
    <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vw,3rem)]">
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium">
        {collection.title}
      </h1>
      <p className="mt-2 text-foreground/60">{cards.length} pieces</p>
      <div className="mt-8 grid grid-cols-2 gap-[clamp(0.8rem,2vw,1.5rem)] md:grid-cols-3 lg:grid-cols-4">
        {cards.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
