"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart-context";
import { BankTransferDetails } from "@/components/bank-transfer-details";
import { StripePaymentSection } from "@/components/stripe-card-panel";
import { payee } from "@/lib/payee";
import {
  CARD_UNAVAILABLE_MESSAGE,
  checkoutConfig,
  computeBankTransferTotals,
  generateOrderRef,
  PENDING_ORDER_KEY,
  type PendingOrder,
} from "@/lib/checkout-config";
import { formatPrice } from "@/lib/format";

export function CheckoutView() {
  const router = useRouter();
  const { lines } = useCart();
  const [shipDifferent, setShipDifferent] = useState(false);
  const [cardNotice, setCardNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.qty, 0),
    [lines],
  );
  const shipping = checkoutConfig.shippingAmount;
  const { discountAmount, total } = useMemo(
    () => computeBankTransferTotals(subtotal, shipping),
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
    setSubmitError("");
    const form = e.currentTarget;
    if (!validate(form)) {
      setSubmitError(
        "Please complete all required fields and accept the terms.",
      );
      return;
    }

    setSubmitting(true);
    const billing = Object.fromEntries(new FormData(form).entries()) as Record<
      string,
      string
    >;
    const ref = generateOrderRef();

    let wooOrderId: number | undefined;
    let wooOrderNumber: string | undefined;
    let amountDue = total;
    let appliedDiscount = discountAmount;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref,
          method: "bank",
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
        amountDue?: number;
        discountAmount?: number;
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
      if (typeof data.amountDue === "number") amountDue = data.amountDue;
      if (typeof data.discountAmount === "number") {
        appliedDiscount = data.discountAmount;
      }
    } catch {
      setSubmitError(
        "Network error — your order was not saved. Check your connection and try again.",
      );
      setSubmitting(false);
      return;
    }

    const pending: PendingOrder = {
      ref,
      method: "bank",
      total: amountDue,
      subtotal,
      shipping,
      discountAmount: appliedDiscount,
      discountPercent: checkoutConfig.bankTransferDiscountPercent,
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
      method: "bank",
      ref,
      total: amountDue.toFixed(2),
    });
    if (wooOrderNumber) q.set("woo", wooOrderNumber);
    router.push(`/checkout/thank-you?${q.toString()}`);
  }

  return (
    <div className="mx-auto max-w-[1180px] px-[clamp(1rem,4vw,2rem)] py-8 pb-16">
      <div className="mb-8 rounded-lg border border-[#c4e8d4] bg-[#edf8f0] px-4 py-3.5 text-sm leading-relaxed text-[#1e4620]">
        <p className="font-medium">
          Pay by <strong>bank transfer</strong> and get{" "}
          {checkoutConfig.bankTransferDiscountPercent}% off.
        </p>
        <p className="mt-1.5 text-[#2d5a34]">
          Card payments are not available. The discount is already taken off
          the total.
        </p>
      </div>
      <form
        onSubmit={onSubmit}
        className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(380px,440px)]"
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
            <div className="mb-4 overflow-hidden rounded-lg border-2 border-[#0570de] bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#e6e6e6] bg-[#f6f9fc] px-4 py-3.5">
                <span
                  className="size-[18px] shrink-0 rounded-full border-[5px] border-[#0570de] bg-white"
                  aria-hidden
                />
                <span className="text-sm font-medium">Bank transfer</span>
                <span className="rounded-full bg-[#0570de] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {checkoutConfig.bankTransferDiscountPercent}% off
                </span>
              </div>
              <div className="px-4 py-4 text-sm text-[#30313d]">
                <p className="mb-3">
                  Pay <strong>{payee.name}</strong> (Citibank). After you place
                  the order, use your <strong>order number</strong> as the
                  payment reference on the confirmation page.
                </p>
                <BankTransferDetails compact />
              </div>
            </div>

            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#697386]">
              Card (unavailable)
            </p>
            <StripePaymentSection
              onCardAttempt={() => setCardNotice(CARD_UNAVAILABLE_MESSAGE)}
              cardNotice={cardNotice}
            />

            {submitError && (
              <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
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
            <div className="flex justify-between text-lane-green">
              <span>
                Bank transfer discount (
                {checkoutConfig.bankTransferDiscountPercent}%)
              </span>
              <span className="tabular-nums">−{formatPrice(discountAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-foreground/10 pt-3 text-base font-semibold">
              <span>Total to pay</span>
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
            className="mt-4 w-full rounded-md bg-pine py-3.5 text-sm font-semibold text-bone hover:brightness-95 disabled:opacity-60"
          >
            {submitting ? "Processing…" : "Place order — pay by bank transfer"}
          </button>
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
