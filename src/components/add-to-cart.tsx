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
    <div className="space-y-4">
      {hasOptions && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            {product.options[0]?.name}
          </legend>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                aria-pressed={variantId === v.id}
                disabled={!v.available}
                className={`min-w-11 rounded-md border px-3 py-2 text-sm transition-colors ${
                  variantId === v.id
                    ? "border-foreground bg-foreground text-background"
                    : "hover:border-foreground disabled:opacity-40"
                }`}
              >
                {v.option1 && v.title.includes(" / ")
                  ? v.option1
                  : v.title === "Default Title"
                    ? "One size"
                    : v.option1 ?? v.title}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex items-stretch gap-3">
        <div className="inline-flex items-center overflow-hidden rounded-md border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-12 w-11 place-items-center hover:bg-foreground/5"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-9 text-center tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="grid h-12 w-11 place-items-center hover:bg-foreground/5"
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
          className="h-12 flex-1 rounded-md bg-pine text-sm font-semibold text-bone hover:brightness-105 disabled:opacity-50"
        >
          {!variant?.available
            ? "Out of stock"
            : added
              ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Check className="size-4" /> Added
                  </span>
                )
              : "Add to bag"}
        </button>
      </div>
    </div>
  );
}
