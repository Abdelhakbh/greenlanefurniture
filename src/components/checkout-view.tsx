"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import {
  StripeCardPanel,
  type StripeCardPanelHandle,
} from "@/components/stripe-card-panel";
import {
  checkoutConfig,
  generateOrderRef,
  PENDING_ORDER_KEY,
  type PaymentMethod,
  type PendingOrder,
} from "@/lib/checkout-config";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";
import {
  buildStripePaymentUrl,
  getStripePaymentLink,
  isStripeCardPaused,
  isStripePaymentLinkConfigured,
} from "@/lib/stripe";

export function CheckoutView() {
  const router = useRouter();
  const { lines } = useCart();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const stripeCardRef = useRef<StripeCardPanelHandle>(null);
  const stripePaused = isStripeCardPaused();
  const [shipDifferent, setShipDifferent] = useState(false);
  const [cardError, setCardError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.qty, 0),
    [lines],
  );
  const shipping = checkoutConfig.shippingAmount;
  const total = subtotal + shipping;

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

  function validate(form: HTMLFormElement) {
    let ok = true;
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "[data-required]",
    ).forEach((el) => {
      if (!el.value.trim()) {
        el.classList.add("border-red-500");
        ok = false;
      } else el.classList.remove("border-red-500");
    });
    const terms = form.querySelector<HTMLInputElement>("#terms");
    if (!terms?.checked) ok = false;
    return ok;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCardError("");
    setSubmitError("");
    const form = e.currentTarget;
    if (!validate(form)) return;

    if (method === "card") {
      const cardCheck = await stripeCardRef.current?.validate();
      if (!cardCheck?.ok) {
        setCardError(
          cardCheck?.error ?? "Please check your card details and try again.",
        );
        return;
      }
    }

    setSubmitting(true);
    const billing = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;
    const ref = generateOrderRef();

    let wooOrderId: number | undefined;
    let wooOrderNumber: string | undefined;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref,
          method,
          shipping,
          lines: lines.map((l) => ({
            productId: l.productId,
            variantId: l.variantId,
            qty: l.qty,
          })),
          billing,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        wooOrderId?: number;
        wooOrderNumber?: string;
      };
      if (!res.ok) {
        setSubmitError(
          data.error ??
            "We could not save your order. Please try again or call us.",
        );
        setSubmitting(false);
        return;
      }
      wooOrderId = data.wooOrderId;
      wooOrderNumber = data.wooOrderNumber;
    } catch {
      setSubmitError(
        "Network error — your order was not saved. Check your connection and try again.",
      );
      setSubmitting(false);
      return;
    }

    const pending: PendingOrder = {
      ref,
      method,
      total,
      subtotal,
      shipping,
      wooOrderId,
      wooOrderNumber,
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        title: l.title,
        qty: l.qty,
        price: l.price,
        image: l.image,
        optionLabel: l.optionLabel,
      })),
      billing,
      createdAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pending));
    } catch {
      /* ignore */
    }
    const q = new URLSearchParams({
      method,
      ref,
      total: total.toFixed(2),
    });
    if (wooOrderNumber) q.set("woo", wooOrderNumber);

    if (method === "card") {
      const paymentLink = getStripePaymentLink();
      if (
        isStripePaymentLinkConfigured(paymentLink) &&
        !stripePaused
      ) {
        try {
          sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(pending));
        } catch {
          /* ignore */
        }
        window.location.href = buildStripePaymentUrl(paymentLink, {
          ref,
          email: billing.email,
        });
        return;
      }
      if (stripePaused) q.set("stripe_pending", "1");
      router.push(`/checkout/thank-you?${q.toString()}`);
      return;
    }

    router.push(`/checkout/thank-you?${q.toString()}`);
  }

  return (
    <div className="mx-auto max-w-[1180px] px-[clamp(1rem,4vw,2rem)] py-8 pb-16">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-4">
        <Link href="/" className="font-display text-xl font-medium">
          {site.name}
        </Link>
        <span className="text-foreground/55">Secure checkout</span>
      </header>

      <nav
        aria-label="Checkout progress"
        className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm text-foreground/55"
      >
        <span className="font-medium text-foreground">1. Bag</span>
        <span>→</span>
        <span className="font-medium text-foreground">2. Checkout</span>
        <span>→</span>
        <span>3. Payment</span>
      </nav>

      <div className="mb-8 rounded-sm bg-pine px-4 py-3 text-center text-sm text-bone">
        {stripePaused ? (
          <>
            Card entry uses <strong>Stripe</strong> secure fields. While card
            capture is briefly paused, your order is still saved — use{" "}
            <strong>bank transfer</strong> on the confirmation page if needed.
          </>
        ) : (
          <>
            Pay by <strong>card (Stripe)</strong> or <strong>bank transfer</strong>
            . Card details are handled by Stripe — not stored on our servers.
          </>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="grid items-start gap-10 lg:grid-cols-[1fr_400px]"
      >
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 font-display text-xl font-medium">
              Billing details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name *" name="first_name" required />
              <Field label="Last name *" name="last_name" required />
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm">Country *</label>
              <select
                name="country"
                data-required
                defaultValue="GB"
                className="w-full rounded-sm border border-foreground/20 bg-white px-3 py-2.5 text-sm"
              >
                <option value="GB">United Kingdom</option>
                <option value="IE">Ireland</option>
              </select>
            </div>
            <div className="mt-4">
              <Field label="Street address *" name="address1" required />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Town / City *" name="city" required />
              <Field label="Postcode *" name="postcode" required />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Phone" name="phone" />
              <Field label="Email *" name="email" type="email" required />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shipDifferent}
                onChange={(e) => setShipDifferent(e.target.checked)}
              />
              Ship to a different address?
            </label>
            {shipDifferent && (
              <div className="mt-4 space-y-4 border-t border-dashed border-foreground/15 pt-4">
                <Field label="Shipping street" name="ship_address1" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Shipping city" name="ship_city" />
                  <Field label="Shipping postcode" name="ship_postcode" />
                </div>
              </div>
            )}
            <div className="mt-4">
              <label className="mb-1 block text-sm">Order notes</label>
              <textarea
                name="notes"
                rows={3}
                className="w-full rounded-sm border border-foreground/20 bg-white px-3 py-2 text-sm"
                placeholder="Delivery instructions, etc."
              />
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl font-medium">Payment</h2>
            <div className="space-y-2">
              <PaymentOption
                id="pay-card"
                checked={method === "card"}
                onChange={() => setMethod("card")}
                title="Credit / debit card"
                hint="Secure fields powered by Stripe"
              />
              <PaymentOption
                id="pay-bank"
                checked={method === "bank"}
                onChange={() => setMethod("bank")}
                title="Bank transfer"
                hint="UK bank payment — instructions on confirmation page"
              />
            </div>

            {method === "card" && (
              <div className="mt-4">
                <StripeCardPanel panelRef={stripeCardRef} />
              </div>
            )}

            {cardError && (
              <p className="mt-3 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {cardError}
              </p>
            )}
            {submitError && (
              <p className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                {submitError}
              </p>
            )}
          </section>
        </div>

        <aside className="rounded-sm border border-foreground/10 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-medium">Your order</h2>
          <ul className="mt-4 space-y-3 border-b border-foreground/10 pb-4">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 text-sm">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-bone-dim">
                  {l.image && (
                    <Image src={l.image} alt="" fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{l.title}</p>
                  {l.optionLabel && (
                    <p className="text-xs text-foreground/55">{l.optionLabel}</p>
                  )}
                  <p className="text-foreground/55">Qty {l.qty}</p>
                </div>
                <span className="shrink-0 tabular-nums">
                  {formatPrice(l.price * l.qty)}
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-2 pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="tabular-nums">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between border-t border-foreground/10 pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </div>
          </div>

          <label className="mt-6 flex gap-2 text-sm">
            <input type="checkbox" id="terms" name="terms" value="1" />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="underline">
                terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                privacy policy
              </Link>
              *
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-sm bg-[#2ecc71] py-3.5 text-sm font-bold text-white hover:brightness-95 disabled:opacity-60"
          >
            {method === "card"
              ? stripePaused
                ? "Place order"
                : isStripePaymentLinkConfigured(getStripePaymentLink())
                  ? "Continue to secure payment"
                  : "Place order"
              : "Continue to bank transfer details"}
          </button>
          <p className="mt-3 text-center text-xs text-foreground/45">
            {method === "card" ? (
              <>
                🔒 SSL encrypted
                {stripePaused
                  ? " · Card charge paused — bank transfer on next page if needed"
                  : " · Powered by Stripe"}
              </>
            ) : (
              <>
                Your order is sent to our shop system when you continue.
              </>
            )}
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      <input
        type={type}
        name={name}
        {...(required ? { "data-required": true } : {})}
        className="w-full rounded-sm border border-foreground/20 bg-white px-3 py-2.5 text-sm"
        autoComplete={
          name.includes("email")
            ? "email"
            : name.includes("postcode")
              ? "postal-code"
              : undefined
        }
      />
    </div>
  );
}

function PaymentOption({
  id,
  checked,
  onChange,
  title,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-sm border px-4 py-3 ${
        checked ? "border-pine bg-lane-tint/40" : "border-foreground/15 bg-white"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="payment_method"
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-xs text-foreground/55">{hint}</span>
      </span>
    </label>
  );
}
