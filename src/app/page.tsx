import Image from "next/image";
import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { ProductCard } from "@/components/product-card";
import {
  collectionsWithCovers,
  pickFeaturedCollections,
  pickHeroImage,
  supportTeamImage,
} from "@/lib/collection-covers";
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
  const featured = getFeaturedProducts(products, 12).map((p) => {
    const full = products.find((x) => x.handle === p.handle)!;
    return toProductCard(full);
  });
  const featuredCollections = pickFeaturedCollections(collections, 4);
  const roomCollections = collectionsWithCovers(
    featuredCollections,
    products,
  );
  const heroSrc = pickHeroImage(products);

  return (
    <>
      <section className="relative overflow-hidden bg-bone-dim">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,5vw,3.5rem)] lg:grid-cols-2">
          <div className="relative z-10">
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
                className="rounded-md border border-foreground/25 bg-bone/80 px-6 py-3 text-sm font-semibold hover:bg-bone"
              >
                Visit or call us
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-lg lg:aspect-[5/4]">
            {heroSrc && (
              <Image
                src={heroSrc}
                alt="Living room with Green Lane Furniture sofa"
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/10 bg-white">
        <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)]">
          <h2 className="font-display text-2xl font-medium">Shop by room</h2>
          <p className="mt-2 text-foreground/60">
            Browse collections — sofas, beds, storage and more.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roomCollections.map((c) => (
              <Link
                key={c.handle}
                href={`/category/${c.handle}`}
                className="group overflow-hidden rounded-lg border bg-bone shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-bone-dim">
                  {c.coverSrc ? (
                    <Image
                      src={c.coverSrc}
                      alt={c.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(min-width: 1024px) 25vw, 50vw"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-sm text-foreground/40">
                      {c.title}
                    </div>
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-medium">
            Our best sellers
          </h2>
          <Link
            href="/shop"
            className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-[clamp(0.8rem,2vw,1.5rem)] md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="bg-lane-tint">
        <div className="mx-auto grid max-w-[1240px] items-stretch gap-[clamp(1.5rem,4vw,3rem)] px-[clamp(1rem,4vw,3rem)] py-[clamp(2.5rem,5vw,4rem)] lg:grid-cols-2">
          <div className="relative order-2 aspect-[3/4] w-full min-h-[520px] overflow-hidden rounded-2xl shadow-md sm:min-h-0 lg:order-1 lg:aspect-[4/5]">
            <Image
              src={supportTeamImage}
              alt="Green Lane Furniture customer support team member"
              fill
              className="object-cover object-[center_22%]"
              sizes="(min-width: 1024px) 620px, 100vw"
            />
          </div>
          <div className="order-1 flex flex-col justify-center lg:order-2 lg:py-6">
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.25rem)] font-medium">
              A Birmingham furniture showroom
            </h2>
            <p className="mt-4 max-w-[68ch] text-[1.05rem] leading-relaxed text-foreground/75">
              At Green Lane Furniture, we help you furnish living rooms,
              bedrooms and dining spaces with pieces you can see in person at{" "}
              {site.address.line}. {site.legalName} (company number{" "}
              {site.companyNumber}) — call{" "}
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="font-medium text-pine underline-offset-2 hover:underline"
              >
                {site.phone}
              </a>{" "}
              or email{" "}
              <a
                href={`mailto:${site.email}`}
                className="font-medium text-pine underline-offset-2 hover:underline"
              >
                {site.email}
              </a>
              .
            </p>
            <p className="mt-4 text-sm text-foreground/60">
              Our team can help with sizes, fabrics and delivery — Monday to
              Saturday in store or by phone.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-md bg-pine px-5 py-2.5 text-sm font-semibold text-bone hover:brightness-105"
            >
              Contact support
            </Link>
          </div>
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
