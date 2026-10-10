"use client";

import {
  PaymentElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getStripePublishableKey } from "@/lib/stripe";

export type StripeBillingDetails = {
  name: string;
  email: string;
  phone?: string;
  address: {
    line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
};

type StripeCheckoutProps = {
  orderRef: string;
  lines: { productId: number; variantId: number; qty: number }[];
  shipping: number;
  getBilling: () => StripeBillingDetails | null;
  onPayStart?: () => void;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  submitLabel?: string;
};

const stripePromise = (() => {
  const pk = getStripePublishableKey();
  return pk ? loadStripe(pk) : null;
})();

function PoweredByStripe() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[#697386]">
      <span>Powered by</span>
      <Image
        src="/stripe-logo.png"
        alt="Stripe"
        width={48}
        height={20}
        className="h-[14px] w-auto object-contain object-left"
      />
    </span>
  );
}

function PaymentForm({
  getBilling,
  onPayStart,
  onSuccess,
  onError,
  disabled,
  submitLabel,
}: {
  getBilling: () => StripeBillingDetails | null;
  onPayStart?: () => void;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  submitLabel?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) {
      onError("Payment is still loading. Please wait a moment.");
      return;
    }

    const billing = getBilling();
    if (!billing) {
      onError(
        "Please complete all required fields and accept the terms before paying.",
      );
      return;
    }

    onPayStart?.();

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        receipt_email: billing.email,
        payment_method_data: {
          billing_details: {
            name: billing.name,
            email: billing.email,
            phone: billing.phone,
            address: billing.address,
          },
        },
        return_url: `${window.location.origin}/checkout/thank-you`,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Your card could not be processed.");
      return;
    }

    if (paymentIntent?.status === "succeeded" && paymentIntent.id) {
      onSuccess(paymentIntent.id);
      return;
    }

    onError("Payment was not completed. Please try again.");
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#697386]">
          Secure payment
        </span>
        <PoweredByStripe />
      </div>
      <button
        type="submit"
        disabled={disabled || !stripe || !elements}
        className="w-full rounded-md bg-pine py-3.5 text-sm font-semibold text-bone hover:brightness-95 disabled:opacity-60"
      >
        {disabled ? "Processing…" : (submitLabel ?? "Pay securely")}
      </button>
    </form>
  );
}

function StripeElementsCheckout({
  clientSecret,
  getBilling,
  onPayStart,
  onSuccess,
  onError,
  disabled,
  submitLabel,
}: {
  clientSecret: string;
  getBilling: () => StripeBillingDetails | null;
  onPayStart?: () => void;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  submitLabel?: string;
}) {
  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#2d5a47",
          borderRadius: "4px",
        },
      },
    }),
    [clientSecret],
  );

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm
        getBilling={getBilling}
        onPayStart={onPayStart}
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
        submitLabel={submitLabel}
      />
    </Elements>
  );
}

export function StripePaymentSection({
  orderRef,
  lines,
  shipping,
  getBilling,
  onPayStart,
  onSuccess,
  onError,
  disabled,
  submitLabel,
}: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [intentError, setIntentError] = useState("");

  const linesKey = lines.map((l) => `${l.variantId}:${l.qty}`).join("|");

  useEffect(() => {
    let cancelled = false;
    setLoadingIntent(true);
    setIntentError("");
    setClientSecret(null);

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ref: orderRef, lines, shipping }),
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          clientSecret?: string;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "Could not start payment.");
        }
        if (!data.clientSecret) {
          throw new Error("Could not start payment.");
        }
        if (!cancelled) setClientSecret(data.clientSecret);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setIntentError(err.message ?? "Could not start payment.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingIntent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderRef, linesKey, shipping]);

  if (!stripePromise) {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Card payments are not configured yet. Add{" "}
        <code className="text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> and{" "}
        <code className="text-xs">STRIPE_SECRET_KEY</code> on the server.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[#e6e6e6] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-b border-[#e6e6e6] bg-[#fafafa] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className="size-[18px] shrink-0 rounded-full border-[5px] border-[#0570de] bg-white"
            aria-hidden
          />
          <span className="text-sm font-medium">Card</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/card-brands.svg"
          alt="American Express, Discover, Visa, Mastercard"
          width={168}
          height={26}
          className="h-[26px] max-w-[168px] w-auto shrink-0 object-contain object-right"
          decoding="async"
        />
      </div>
      <div className="p-4">
        {loadingIntent && (
          <p className="text-sm text-foreground/60">Loading secure payment…</p>
        )}
        {intentError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {intentError}
          </p>
        )}
        {clientSecret && !intentError && (
          <StripeElementsCheckout
            clientSecret={clientSecret}
            getBilling={getBilling}
            onPayStart={onPayStart}
            onSuccess={onSuccess}
            onError={onError}
            disabled={disabled}
            submitLabel={submitLabel}
          />
        )}
      </div>
    </div>
  );
}
