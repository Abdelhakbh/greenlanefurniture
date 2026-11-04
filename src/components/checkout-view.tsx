"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-context";
import { ShopifyCheckoutRedirect } from "@/components/shopify-checkout-redirect";
import { useShopifyCheckoutUi } from "@/lib/shopify-checkout-public";

export function CheckoutView() {
  const { lines } = useCart();
  const shopifyCheckout = useShopifyCheckoutUi();

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-medium">Your bag is empty</h1>
        <Link href="/shop" className="mt-6 inline-block text-pine underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (shopifyCheckout) {
    return <ShopifyCheckoutRedirect lines={lines} />;
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-medium">Secure checkout</h1>
      <p className="mt-3 text-sm text-foreground/70">
        Open your bag and choose <strong>Continue to secure payment</strong> to
        pay by card or digital wallet.
      </p>
      <Link href="/shop" className="mt-6 inline-block text-pine underline">
        Continue shopping
      </Link>
    </div>
  );
}
