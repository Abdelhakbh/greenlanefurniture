"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { StoreProduct } from "@/lib/catalog";
import { toProductCard } from "@/lib/catalog";
import { useCart } from "./cart-context";

export function AddToCart({ product }: { product: StoreProduct }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? 0);
  const [added, setAdded] = useState(false);

  const variant =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const card = toProductCard({
    ...product,
    variants: variant ? [variant] : product.variants,
  });
  const hasOptions =
    product.variants.length > 1 ||
    (product.options.length > 0 &&
      !(
        product.options.length === 1 &&
        product.options[0]?.name === "Title" &&
        product.options[0]?.values[0] === "Default Title"
      ));

  const optionName = product.options[0]?.name ?? "Option";

  const optionLabel = hasOptions
    ? product.options
        .map((o, i) => {
          const val =
            i === 0
              ? variant?.option1
              : i === 1
                ? variant?.option2
                : variant?.option3;
          return val ? `${o.name}: ${val}` : null;
        })
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return (
    <div className="space-y-5">
      {hasOptions && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-medium text-foreground/80">
            {optionName}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const label =
                v.option1 && v.title.includes(" / ")
                  ? v.option1
                  : v.title === "Default Title"
                    ? "One size"
                    : (v.option1 ?? v.title);
              const selected = variantId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={selected}
                  disabled={!v.available}
                  className={`rounded-sm border px-4 py-2.5 text-sm transition-colors ${
                    selected
                      ? "border-foreground bg-white shadow-sm"
                      : "border-foreground/20 bg-white/60 hover:border-foreground/50 disabled:opacity-40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="inline-flex h-12 shrink-0 items-center overflow-hidden rounded-sm border border-foreground/20 bg-white">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-full w-11 place-items-center hover:bg-foreground/5"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-full w-11 place-items-center hover:bg-foreground/5"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={!variant?.available}
          onClick={() => {
            if (!variant) return;
            const attributes: Record<string, string> = {};
            product.options.forEach((o, i) => {
              const val =
                i === 0
                  ? variant?.option1
                  : i === 1
                    ? variant?.option2
                    : variant?.option3;
              if (val) attributes[o.name] = val;
            });
            add(
              {
                productId: product.id,
                variantId: variant.id,
                handle: product.handle,
                title: product.title,
                image: card.image,
                price: card.price,
                optionLabel,
                attributes: Object.keys(attributes).length ? attributes : undefined,
              },
              qty,
            );
            setAdded(true);
            setTimeout(() => setAdded(false), 1400);
          }}
          className="h-12 min-h-12 flex-1 rounded-sm bg-[#c9b896] px-6 text-sm font-semibold tracking-wide text-foreground uppercase hover:brightness-95 disabled:opacity-50 sm:min-w-[200px]"
        >
          {!variant?.available
            ? "Out of stock"
            : added
              ? (
                  <span className="inline-flex items-center justify-center gap-2 normal-case">
                    <Check className="size-4" /> Added to bag
                  </span>
                )
              : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
