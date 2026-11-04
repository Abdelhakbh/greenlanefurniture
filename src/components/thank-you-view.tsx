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

  const wooNumber = params.get("woo") ?? order?.wooOrderNumber ?? null;
  const orderNumber = wooNumber ?? params.get("ref") ?? "—";
  const totalParam = parseFloat(params.get("total") ?? "0");
  const total = order?.total ?? totalParam;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
      if (raw) setOrder(JSON.parse(raw) as PendingOrder);
      clearCart();
      sessionStorage.removeItem(PENDING_ORDER_KEY);
    } catch {
      /* ignore */
    }
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-lane-green">
        Thank you
      </p>
      <h1 className="mt-2 text-[clamp(1.35rem,2.4vw,1.7rem)] font-semibold leading-snug">
        We&apos;ve received your order
      </h1>
      {total > 0 && (
        <p className="mt-3 text-lg font-semibold tabular-nums text-pine">
          {formatPrice(total)}
        </p>
      )}
      <p className="mt-3 max-w-[52ch] text-foreground/70">
        You&apos;ll get a confirmation email shortly. If you have questions,
        quote order <strong>{orderNumber}</strong>.
      </p>

      <p className="mt-6 text-sm leading-relaxed text-foreground/65">
        Email{" "}
        <a href={`mailto:${site.email}`} className="text-pine underline">
          {site.email}
        </a>{" "}
        or call {site.phone}.
      </p>

      <Link
        href="/shop"
        className="mt-6 inline-block text-sm font-medium text-foreground/60 underline"
      >
        Continue shopping
      </Link>
    </div>
  );
}
