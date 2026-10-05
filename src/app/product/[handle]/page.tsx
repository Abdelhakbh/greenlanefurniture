import Link from "next/link";

import { notFound } from "next/navigation";

import { AddToCart } from "@/components/add-to-cart";

import { ProductCard } from "@/components/product-card";

import { ProductGallery } from "@/components/product-gallery";

import { ProductTabs } from "@/components/product-tabs";

import { ProductTrustGrid } from "@/components/product-trust-grid";

import { cleanProductHtml } from "@/lib/clean-html";

import {

  getCollections,

  getProduct,

  getRelatedProductCards,

  toProductCard,

} from "@/lib/catalog";

import { JsonLd } from "@/components/json-ld";
import { formatPrice, stripHtml } from "@/lib/format";
import { buildPageMetadata, absoluteUrl } from "@/lib/metadata";
import { site } from "@/lib/site";



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
    const card = toProductCard(product);
    const plain = stripHtml(cleanProductHtml(product.body_html));
    const description =
      plain.slice(0, 155).trim() + (plain.length > 155 ? "…" : "") ||
      `Buy ${product.title} from ${site.name}. UK delivery.`;
    const image = product.images[0]?.src ?? null;
    return buildPageMetadata({
      title: product.title,
      description,
      path: `/product/${handle}`,
      image,
      imageAlt: product.images[0]?.alt ?? product.title,
    });
  } catch {
    return buildPageMetadata({ title: "Product", path: `/product/${handle}` });
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



  const [collections, related] = await Promise.all([

    getCollections(),

    getRelatedProductCards(product, 4),

  ]);



  const category = collections.find(

    (c) => c.title.toLowerCase() === product.product_type.toLowerCase(),

  );



  const card = toProductCard(product);

  const description = cleanProductHtml(product.body_html);

  const plain = stripHtml(description);

  const subtitle =

    plain.length > 220 ? `${plain.slice(0, 217).trim()}…` : plain;



  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: plain.slice(0, 500) || product.title,
    image: product.images.map((i) => i.src).filter(Boolean),
    sku: String(product.id),
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${handle}`),
      priceCurrency: "GBP",
      price: card.price.toFixed(2),
      availability: card.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <JsonLd data={productLd} />
      <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] pt-6 pb-2">

        <nav

          aria-label="Breadcrumb"

          className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-foreground/50"

        >

          <Link href="/" className="hover:text-foreground">

            Home

          </Link>

          <span aria-hidden>/</span>

          <Link href="/shop" className="hover:text-foreground">

            Shop

          </Link>

          {product.product_type && (

            <>

              <span aria-hidden>/</span>

              {category ? (

                <Link

                  href={`/category/${category.handle}`}

                  className="hover:text-foreground"

                >

                  {category.title}

                </Link>

              ) : (

                <span>{product.product_type}</span>

              )}

            </>

          )}

          <span aria-hidden>/</span>

          <span className="line-clamp-1 text-foreground/70">{product.title}</span>

        </nav>

      </div>



      <div className="mx-auto grid max-w-[1240px] items-start gap-10 px-[clamp(1rem,4vw,3rem)] pb-12 lg:grid-cols-2 lg:gap-14">

        <ProductGallery images={product.images} title={product.title} />



        <div className="lg:sticky lg:top-24 lg:self-start">

          <div className="mb-4 flex flex-wrap items-center gap-2">

            {card.onSale && card.savingPct > 0 && (

              <span className="rounded-sm bg-pine px-2 py-0.5 text-xs font-semibold text-bone">

                −{card.savingPct}%

              </span>

            )}

            <span className="rounded-sm border border-foreground/15 bg-white/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-foreground/70">

              Birmingham showroom

            </span>

          </div>



          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.65rem)] font-medium leading-[1.08] tracking-[-0.02em]">

            {product.title}

          </h1>



          {subtitle && (

            <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-foreground/65">

              {subtitle}

            </p>

          )}



          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">

            <span className="text-[1.65rem] font-semibold tabular-nums text-foreground">

              {formatPrice(card.price)}

            </span>

            {card.compareAt && card.compareAt > card.price && (

              <span className="text-sm text-foreground/50">

                Was price{" "}

                <span className="line-through tabular-nums">

                  {formatPrice(card.compareAt)}

                </span>

              </span>

            )}

          </div>



          <div className="mt-8">

            <AddToCart product={product} />

          </div>



          <p className="mt-4 text-sm text-foreground/50">

            Incl. VAT · UK delivery · See{" "}

            <Link href="/shipping" className="underline underline-offset-2">

              delivery info

            </Link>

          </p>



          <ProductTrustGrid />



          <div className="mt-8 rounded-sm border border-lane-green/20 bg-lane-tint/80 p-5">

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lane-green">

              From our Birmingham team

            </p>

            <p className="mt-2 text-sm leading-relaxed text-foreground/75">

              Every piece is chosen for real homes — visit us at{" "}

              {site.address.line} or call {site.phone} for fabric swatches,

              sizes and delivery advice before you order.

            </p>

          </div>

        </div>

      </div>



      <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] pb-16">

        <ProductTabs

          descriptionHtml={description}

          productType={product.product_type}

          tags={product.tags}

        />

      </div>



      {related.length > 0 && (

        <section className="border-t border-foreground/10 bg-white">

          <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-14">

            <h2 className="font-display text-2xl font-medium">

              You might also like

            </h2>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">

              {related.map((p) => (

                <ProductCard key={p.id} product={p} />

              ))}

            </div>

          </div>

        </section>

      )}

    </>

  );

}

