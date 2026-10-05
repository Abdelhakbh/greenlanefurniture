"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-context";
import {
  checkoutConfig,
  PENDING_ORDER_KEY,
  type PendingOrder,
} from "@/lib/checkout-config";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function ThankYouView() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PendingOrder | null>(null);

  const method = params.get("method") ?? order?.method ?? "bank";
  const stripePending = params.get("stripe_pending") === "1";
  const ref =
    params.get("ref") ?? order?.ref ?? "—";
  const wooNumber =
    params.get("woo") ?? order?.wooOrderNumber ?? null;
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

  const isPayPal = method === "paypal";

  return (
    <div className="mx-auto max-w-[680px] px-6 py-12">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-lane-green">
        Order received
      </p>
      <h1 className="mt-2 font-display text-[clamp(1.8rem,4vw,2.4rem)] font-medium">
        Thank you — almost done
      </h1>
      {stripePending && method === "card" && (
        <p className="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Card processing is temporarily unavailable. Your order is saved — please
          complete payment below by <strong>bank transfer</strong> or{" "}
          <strong>PayPal</strong> using the same reference.
        </p>
      )}

      <p className="mt-3 text-foreground/70">
        {wooNumber ? (
          <>
            Order <strong className="text-foreground">#{wooNumber}</strong> is in
            our system. Payment reference:{" "}
            <strong className="text-foreground">{ref}</strong>.
          </>
        ) : (
          <>
            Reference: <strong className="text-foreground">{ref}</strong>.
          </>
        )}{" "}
        We’ll prepare your order once payment arrives. WooCommerce may email you
        an order notice if mail is configured on the shop.
      </p>

      <div className="mt-8 rounded-sm border-2 border-pine/30 bg-lane-tint/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">
          {isPayPal && !stripePending ? "PayPal payment" : "Bank transfer"}
        </p>
        <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">
          {formatPrice(total)}
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          Send exactly this amount (in GBP).
        </p>

        {isPayPal && !stripePending ? (
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-foreground/55">PayPal email</dt>
              <dd className="text-lg font-semibold text-foreground">
                {checkoutConfig.paypalEmail}
              </dd>
            </div>
            <div>
              <dt className="text-foreground/55">Payment note / reference</dt>
              <dd className="font-medium">{ref}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">Amount to send</dt>
              <dd className="font-semibold tabular-nums">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>
        ) : (
          <dl className="mt-6 space-y-3 text-sm">
            <div>
              <dt className="text-foreground/55">Account name</dt>
              <dd className="font-medium">{checkoutConfig.bankAccountName}</dd>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-foreground/55">Sort code</dt>
                <dd className="font-medium tabular-nums">
                  {checkoutConfig.bankSortCode}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/55">Account number</dt>
                <dd className="font-medium tabular-nums">
                  {checkoutConfig.bankAccountNumber}
                </dd>
              </div>
            </div>
            <div>
              <dt className="text-foreground/55">Reference (required)</dt>
              <dd className="font-medium">{ref}</dd>
            </div>
            <div>
              <dt className="text-foreground/55">Amount</dt>
              <dd className="font-semibold tabular-nums">
                {formatPrice(total)}
              </dd>
            </div>
          </dl>
        )}
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
