"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";
import { PENDING_ORDER_KEY, type PendingOrder } from "@/lib/checkout-config";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function ThankYouView() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PendingOrder | null>(null);

  const ref = params.get("ref") ?? order?.ref ?? "—";
  const wooNumber = params.get("woo") ?? order?.wooOrderNumber ?? null;
  const totalParam = parseFloat(params.get("total") ?? "0");
  const total = order?.total ?? totalParam;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
      if (raw) setOrder(JSON.parse(raw) as PendingOrder);
      clearCart();
    } catch {
      /* ignore */
    }
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-[680px] px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-lane-green">
        Order received
      </p>
      <h1 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.4rem)] font-medium">
        Thank you — payment confirmed
      </h1>

      <p className="mt-3 text-foreground/70">
        {wooNumber ? (
          <>
            Order <strong className="text-foreground">#{wooNumber}</strong> ·
            reference <strong className="text-foreground">{ref}</strong>
          </>
        ) : (
          <>
            Reference <strong className="text-foreground">{ref}</strong>
          </>
        )}
        . Your card payment of{" "}
        <strong className="text-foreground">{formatPrice(total)}</strong> was
        successful.
      </p>

      <div className="mt-8 rounded-sm border border-foreground/10 bg-lane-tint/30 p-6 text-sm leading-relaxed text-foreground/75">
        <p>
          A receipt may be emailed to you from Stripe. We&apos;ll contact you
          when your order is dispatched.
        </p>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-foreground/65">
        Questions? Email{" "}
        <a href={`mailto:${site.email}`} className="text-pine underline">
          {site.email}
        </a>{" "}
        or call {site.phone} and quote reference <strong>{ref}</strong>.
      </p>

      <Link
        href="/shop"
        className="mt-8 inline-block rounded-sm bg-pine px-6 py-3 text-sm font-semibold text-bone"
      >
        Continue shopping
      </Link>
    </div>
  );
}
