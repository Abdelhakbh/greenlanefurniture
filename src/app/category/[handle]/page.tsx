import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { getCollectionProducts, getCollections, toProductCard } from "@/lib/catalog";
import { buildPageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

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
  const title = c?.title ?? "Category";
  return buildPageMetadata({
    title,
    description:
      c?.description ||
      `Shop ${title} at ${site.name}. Quality furniture with UK delivery.`,
    path: `/category/${handle}`,
    image: c?.image?.src ?? null,
    imageAlt: title,
  });
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

  const children = collections
    .filter((c) => c.parentId === collection.id)
    .sort((a, b) => b.products_count - a.products_count);
  const parent = collections.find((c) => c.id === collection.parentId);
  const products = children.length
    ? []
    : await getCollectionProducts(handle);
  const cards = products.map(toProductCard);
  const sections = children.length
    ? await Promise.all(
        children.map(async (child) => ({
          child,
          cards: (await getCollectionProducts(child.handle)).map(toProductCard),
        })),
      )
    : [];

  return (
    <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vw,3rem)]">
      {parent ? (
        <Link
          href={`/category/${parent.handle}`}
          className="text-sm font-semibold uppercase tracking-[0.14em] text-lane-green"
        >
          {parent.title}
        </Link>
      ) : null}
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium">
        {collection.title}
      </h1>
      <p className="mt-2 text-foreground/60">
        {(sections.length
          ? sections.reduce((sum, section) => sum + section.cards.length, 0)
          : cards.length
        ).toString()}{" "}
        pieces
      </p>
      {sections.length ? (
        <div className="mt-8 space-y-12">
          {sections.map((section) => (
            <section key={section.child.handle}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-[clamp(1.4rem,3vw,2rem)] font-medium">
                  <Link href={`/category/${section.child.handle}`}>
                    {section.child.title}
                  </Link>
                </h2>
                <Link
                  href={`/category/${section.child.handle}`}
                  className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
                >
                  {section.cards.length} pieces
                </Link>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-[clamp(0.8rem,2vw,1.5rem)] md:grid-cols-3 lg:grid-cols-4">
                {section.cards.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-[clamp(0.8rem,2vw,1.5rem)] md:grid-cols-3 lg:grid-cols-4">
          {cards.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
