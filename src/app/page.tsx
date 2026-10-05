import Image from "next/image";
import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { ProductCard } from "@/components/product-card";
import { faqs, site } from "@/lib/site";
import {
  getAllProducts,
  getCollections,
  getFeaturedProducts,
  toProductCard,
} from "@/lib/catalog";

export const revalidate = 600;

export default async function HomePage() {
  const [products, collections] = await Promise.all([
    getAllProducts(),
    getCollections(),
  ]);
  const featured = getFeaturedProducts(products, 8).map((p) => {
    const full = products.find((x) => x.handle === p.handle)!;
    return toProductCard(full);
  });

  return (
    <>
      <section className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(2.5rem,5vw,4.5rem)]">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-lane-green">
          Birmingham showroom
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.4rem,5vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.02em]">
          {site.headline}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/70">
          {site.subhead}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="rounded-md bg-pine px-6 py-3 text-sm font-semibold text-bone hover:brightness-105"
          >
            Browse the shop
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-foreground/25 px-6 py-3 text-sm font-semibold hover:bg-foreground/5"
          >
            Visit or call us
          </Link>
        </div>
      </section>

      <section className="border-y border-foreground/10 bg-white">
        <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)]">
          <h2 className="font-display text-2xl font-medium">Shop by room</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {collections.slice(0, 8).map((c) => (
              <Link
                key={c.handle}
                href={`/category/${c.handle}`}
                className="group overflow-hidden rounded-lg border bg-bone"
              >
                <div className="relative aspect-[4/3] bg-bone-dim">
                  {c.image?.src && (
                    <Image
                      src={c.image.src}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(min-width: 1024px) 25vw, 50vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg">{c.title}</h3>
                  <p className="text-sm text-foreground/55">
                    {c.products_count} pieces
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(2.5rem,5vw,4rem)]">
        <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-medium">
          Our best sellers
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-[clamp(0.8rem,2vw,1.5rem)] md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-lane-tint">
        <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(2.5rem,5vw,4rem)]">
          <h2 className="font-display text-2xl font-medium">
            A Birmingham furniture showroom
          </h2>
          <p className="mt-4 max-w-[68ch] leading-relaxed text-foreground/75">
            At Green Lane Furniture, we help you furnish living rooms, bedrooms
            and dining spaces with pieces you can see in person at{" "}
            {site.address.line}. {site.legalName} (company number{" "}
            {site.companyNumber}) — call {site.phone} or email {site.email}.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(2.5rem,5vw,4rem)]">
        <h2 className="mb-6 font-display text-2xl font-medium">
          Frequently asked questions
        </h2>
        <FaqList items={faqs} />
      </section>
    </>
  );
}
