"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CartLine } from "@/components/cart-context";
import { startShopifyCheckout } from "@/lib/start-shopify-checkout";

export function ShopifyCheckoutRedirect({ lines }: { lines: CartLine[] }) {
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await startShopifyCheckout(
          lines.map((l) => ({
            handle: l.handle,
            qty: l.qty,
            attributes: l.attributes,
            title: l.title,
          })),
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Checkout unavailable.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lines]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium">Checkout</h1>
        <p className="mt-4 text-sm text-red-800">{error}</p>
        <Link href="/shop" className="mt-6 inline-block text-pine underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-medium">Secure checkout</h1>
      <p className="mt-3 text-sm text-foreground/70">
        Redirecting you to Shopify to pay by card, Shop Pay, or other methods…
      </p>
      <div
        className="mx-auto mt-8 size-8 animate-spin rounded-full border-2 border-pine border-t-transparent"
        aria-hidden
      />
    </div>
  );
}
