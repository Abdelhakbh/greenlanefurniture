import Image from "next/image";
import Link from "next/link";
import type { ProductCard as ProductCardType } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: ProductCardType }) {
  return (
    <Link
      href={`/product/${product.handle}`}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-bone-dim">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-foreground/40">
            No image
          </div>
        )}
        {product.onSale && product.savingPct > 0 && (
          <span className="absolute left-2.5 top-2.5 rounded-sm bg-pine px-2 py-0.5 text-xs font-semibold text-bone">
            −{product.savingPct}%
          </span>
        )}
      </div>
      <div className="pt-3">
        {product.type && (
          <p className="text-sm text-foreground/55">{product.type}</p>
        )}
        <h3 className="font-display text-[1.05rem] leading-tight">
          {product.title}
        </h3>
        <p className="mt-1 font-semibold text-amber-ink tabular-nums">
          {formatPrice(product.price)}
          {product.compareAt && product.compareAt > product.price && (
            <span className="ml-2 text-sm font-normal text-foreground/55">
              was{" "}
              <span className="line-through">
                {formatPrice(product.compareAt)}
              </span>
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
