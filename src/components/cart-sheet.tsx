"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "./cart-context";
import { formatPrice } from "@/lib/format";

export function CartSheet() {
  const { lines, open, setOpen, setQty, remove, checkoutUrl, count } =
    useCart();

  if (!open) return null;

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close bag"
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-bone shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-xl font-medium">Your bag ({count})</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-foreground/5"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <p className="text-foreground/60">Your bag is empty.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-3">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-bone-dim">
                    {line.image && (
                      <Image
                        src={line.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${line.handle}`}
                      className="font-medium leading-snug hover:underline"
                      onClick={() => setOpen(false)}
                    >
                      {line.title}
                    </Link>
                    {line.optionLabel && (
                      <p className="text-xs text-foreground/55">
                        {line.optionLabel}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-semibold text-amber-ink tabular-nums">
                      {formatPrice(line.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded border"
                        onClick={() => setQty(line.variantId, line.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        className="grid size-8 place-items-center rounded border"
                        onClick={() => setQty(line.variantId, line.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-xs text-foreground/55 underline"
                        onClick={() => remove(line.variantId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-5 py-4">
          <div className="mb-4 flex justify-between text-sm">
            <span>Subtotal</span>
            <span className="font-semibold tabular-nums">
              {formatPrice(subtotal)}
            </span>
          </div>
          <a
            href={checkoutUrl}
            className={`block w-full rounded-md py-3 text-center text-sm font-semibold ${
              lines.length
                ? "bg-pine text-bone hover:brightness-105"
                : "pointer-events-none bg-foreground/20 text-foreground/50"
            }`}
          >
            Go to checkout
          </a>
          <p className="mt-2 text-center text-xs text-foreground/55">
            Pay by bank transfer or PayPal
          </p>
        </div>
      </aside>
    </div>
  );
}
