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
import { BankTransferDetails } from "@/components/bank-transfer-details";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export function ThankYouView() {
  const params = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PendingOrder | null>(null);

  const wooNumber = params.get("woo") ?? order?.wooOrderNumber ?? null;
  const orderNumber = wooNumber ?? "—";
  const totalParam = parseFloat(params.get("total") ?? "0");
  const total = order?.total ?? totalParam;
  const discountAmount = order?.discountAmount ?? 0;

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
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-lane-green">
        Order received
      </p>
      <h1 className="mt-2 text-[clamp(1.35rem,2.4vw,1.7rem)] font-semibold leading-snug">
        Pay {formatPrice(total)} now to confirm your furniture
      </h1>
      <p className="mt-3 max-w-[52ch] text-foreground/70">
        Your order is held for you. We pack and dispatch it as soon as this
        bank transfer arrives. Use your order number as the payment reference.
      </p>

      <div className="mt-8 overflow-hidden rounded-xl bg-pine text-bone shadow-lg">
        <div className="px-6 py-7 sm:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-bone/70">
            Send exactly this amount
          </p>
          <p className="mt-1 text-3xl font-semibold leading-none tabular-nums">
            {formatPrice(total)}
          </p>
          <p className="mt-2 text-xs text-bone/80">
            {discountAmount > 0
              ? `${checkoutConfig.bankTransferDiscountPercent}% off is already included (−${formatPrice(discountAmount)}).`
              : `Your ${checkoutConfig.bankTransferDiscountPercent}% bank-transfer discount is already included.`}
          </p>
        </div>

        <div className="bg-white px-6 py-6 text-foreground sm:px-8">
          <p className="text-xs font-medium uppercase tracking-wide text-pine">
            Order number
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-pine bg-lane-tint px-4 py-3">
            <p className="text-xl font-semibold tabular-nums">{orderNumber}</p>
            <CopyButton value={orderNumber} label="Copy order number" />
          </div>
          <p className="mt-2 text-sm text-foreground/60">
            Use this order number as the payment reference.
          </p>

          <BankTransferDetails />
        </div>
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          "Open your bank app or online banking.",
          `Send ${formatPrice(total)} to the account above.`,
          "Use the order number as the payment reference.",
        ].map((step, i) => (
          <li
            key={step}
            className="rounded-lg border border-foreground/10 bg-white px-4 py-4 text-sm leading-relaxed"
          >
            <span className="mb-2 grid size-7 place-items-center rounded-full bg-pine text-xs font-semibold text-bone">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm leading-relaxed text-foreground/65">
        Questions before you pay? Email{" "}
        <a href={`mailto:${site.email}`} className="text-pine underline">
          {site.email}
        </a>{" "}
        or call {site.phone} and quote order <strong>{orderNumber}</strong>.
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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="shrink-0 rounded-md border border-pine/30 bg-white px-3 py-2 text-xs font-semibold text-pine hover:bg-lane-tint"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
