import { ProductCard } from "@/components/product-card";
import { getAllProducts, toProductCard } from "@/lib/catalog";

export const revalidate = 600;

export const metadata = { title: "Sale" };

export default async function SalePage() {
  const products = await getAllProducts();
  const cards = products.map(toProductCard).filter((p) => p.onSale);

  return (
    <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4vw,3rem)]">
      <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium">
        Sale
      </h1>
      <p className="mt-2 text-foreground/60">{cards.length} offers</p>
      <div className="mt-8 grid grid-cols-2 gap-[clamp(0.8rem,2vw,1.5rem)] md:grid-cols-3 lg:grid-cols-4">
        {cards.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
