import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { cleanProductHtml } from "@/lib/clean-html";
import { formatPrice } from "@/lib/format";
import {
  getProduct,
  getRelatedProductCards,
  toProductCard,
} from "@/lib/catalog";

export const revalidate = 600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  try {
    const product = await getProduct(handle);
    return { title: product.title };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  let product;
  try {
    product = await getProduct(handle);
  } catch {
    notFound();
  }

  const card = toProductCard(product);
  const related = await getRelatedProductCards(product, 4);

  const description = cleanProductHtml(product.body_html);

  return (
    <>
      <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] pt-5">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1 text-sm text-foreground/55"
        >
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-foreground">
            Shop
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.title}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-[1240px] items-start gap-[clamp(1.5rem,4vw,3.5rem)] px-[clamp(1rem,4vw,3rem)] py-[clamp(1rem,3vw,2rem)] md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-2.5">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-bone-dim">
            {card.image && (
              <Image
                src={card.image}
                alt={card.imageAlt}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.slice(0, 8).map((img) => (
                <div
                  key={img.src}
                  className="relative size-20 shrink-0 overflow-hidden rounded-sm border"
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:sticky md:top-24">
          {card.onSale && (
            <span className="mb-3 inline-block rounded-sm bg-pine px-2 py-0.5 text-xs font-semibold text-bone">
              −{card.savingPct}%
            </span>
          )}
          <h1 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] font-medium leading-[1.02]">
            {product.title}
          </h1>
          <div className="my-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-2xl font-bold text-amber-ink tabular-nums">
              {formatPrice(card.price)}
            </span>
            {card.compareAt && card.compareAt > card.price && (
              <span className="text-sm text-foreground/55">
                Was{" "}
                <span className="line-through tabular-nums">
                  {formatPrice(card.compareAt)}
                </span>
              </span>
            )}
          </div>
          <AddToCart product={product} />
          <p className="mt-3 text-sm text-foreground/55">
            Incl. VAT · UK delivery · See{" "}
            <Link href="/shipping" className="underline">
              delivery info
            </Link>
          </p>
        </div>
      </div>

      {description && (
        <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] pb-12">
          <div
            className="prose prose-neutral max-w-[68ch] [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_th]:text-left"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>
      )}

      {related.length > 0 && (
        <section className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-12">
          <h2 className="mb-6 font-display text-2xl font-medium">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
