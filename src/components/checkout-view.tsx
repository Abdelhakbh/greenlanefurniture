"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart-context";
import {
  StripePaymentSection,
  type StripeBillingDetails,
} from "@/components/stripe-card-panel";
import {
  checkoutConfig,
  computeOrderTotal,
  generateOrderRef,
  PENDING_ORDER_KEY,
  type PendingOrder,
} from "@/lib/checkout-config";
import { formatPrice } from "@/lib/format";

export function CheckoutView() {
  const router = useRouter();
  const { lines } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shipDifferent, setShipDifferent] = useState(false);

  const linesKey = lines.map((l) => `${l.variantId}:${l.qty}`).join("|");
  const orderRef = useMemo(() => generateOrderRef(), [linesKey]);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.qty, 0),
    [lines],
  );
  const shipping = checkoutConfig.shippingAmount;
  const { total } = useMemo(
    () => computeOrderTotal(subtotal, shipping),
    [subtotal, shipping],
  );
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

  function validateForm(form: HTMLFormElement) {
    let ok = true;
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "[data-required]",
    ).forEach((el) => {
      if (!el.value.trim()) {
        el.classList.add("border-red-500");
        ok = false;
      } else el.classList.remove("border-red-500");
    });
    const terms = document.getElementById("terms") as HTMLInputElement | null;
    if (!terms?.checked) ok = false;
    return ok;
  }

  function readBilling(): StripeBillingDetails | null {
    const form = formRef.current;
    if (!form || !validateForm(form)) return null;
    const d = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;
    const first = d.first_name?.trim();
    const last = d.last_name?.trim();
    const email = d.email?.trim();
    const address1 = d.address1?.trim();
    const city = d.city?.trim();
    const postcode = d.postcode?.trim();
    const country = d.country?.trim() || "GB";
    if (!first || !last || !email || !address1 || !city || !postcode) {
      return null;
    }
    return {
      name: `${first} ${last}`,
      email,
      phone: d.phone?.trim() || undefined,
      address: {
        line1: address1,
        city,
        postal_code: postcode,
        country,
      },
    };
  }

  async function onPaymentSuccess(paymentIntentId: string) {
    const form = formRef.current;
    if (!form) return;
    const billing = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: orderRef,
          method: "card",
          shipping,
          paymentIntentId,
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
            "We could not save your order. Please contact us with your card receipt.",
        );
        setSubmitting(false);
        return;
      }

      const pending: PendingOrder = {
        ref: orderRef,
        method: "card",
        total,
        subtotal,
        shipping,
        stripePaymentIntentId: paymentIntentId,
        wooOrderId: data.wooOrderId,
        wooOrderNumber: data.wooOrderNumber,
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
        method: "card",
        ref: orderRef,
        total: total.toFixed(2),
      });
      if (data.wooOrderNumber) q.set("woo", data.wooOrderNumber);
      router.push(`/checkout/thank-you?${q.toString()}`);
    } catch {
      setSubmitError(
        "Network error — if your card was charged, email us with reference " +
          orderRef,
      );
      setSubmitting(false);
    }
  }

  function onPaymentError(message: string) {
    setSubmitError(message);
    setSubmitting(false);
  }

  function getBillingForStripe() {
    setSubmitError("");
    const details = readBilling();
    if (!details) {
      setSubmitError(
        "Please complete all required fields and accept the terms before paying.",
      );
      return null;
    }
    return details;
  }

  function onPayStart() {
    setSubmitting(true);
    setSubmitError("");
  }

  return (
    <div className="mx-auto max-w-[1180px] px-[clamp(1rem,4vw,2rem)] py-8 pb-16">
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_400px]">
        <form
          ref={formRef}
          id="checkout-billing"
          className="space-y-8"
          onSubmit={(e) => e.preventDefault()}
        >
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
            <p className="mb-4 text-sm text-foreground/65">
              Pay securely by debit or credit card. Your card is processed by
              Stripe; we never store card numbers on our servers.
            </p>
            <StripePaymentSection
              orderRef={orderRef}
              lines={lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                qty: l.qty,
              }))}
              shipping={shipping}
              getBilling={getBillingForStripe}
              onPayStart={onPayStart}
              disabled={submitting}
              submitLabel={
                submitting ? "Processing…" : `Pay ${formatPrice(total)}`
              }
              onSuccess={onPaymentSuccess}
              onError={onPaymentError}
            />
            {submitError && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                {submitError}
              </p>
            )}
          </section>
        </form>

        <aside className="rounded-sm border border-foreground/10 bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-medium">Your order</h2>
          <ul className="mt-4 space-y-3 border-b border-foreground/10 pb-4">
            {lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 text-sm">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-bone-dim">
                  {l.image && (
                    <Image
                      src={l.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
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
            <input
              type="checkbox"
              id="terms"
              name="terms"
              form="checkout-billing"
              value="1"
            />
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
        </aside>
      </div>
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
