"use client";

import { useImperativeHandle, useMemo, useState } from "react";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type StripeCardNumberElement } from "@stripe/stripe-js";
import { getStripePublishableKey } from "@/lib/stripe";

export type StripeCardPanelHandle = {
  validate: () => Promise<{ ok: boolean; error?: string }>;
};

const stripeElementStyle = {
  base: {
    color: "#30313d",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSmoothing: "antialiased" as const,
    fontSize: "16px",
    lineHeight: "24px",
    "::placeholder": { color: "#697386" },
  },
  invalid: {
    color: "#df1b41",
    iconColor: "#df1b41",
  },
};

const elementOptions = {
  style: stripeElementStyle,
  showIcon: true,
};

function StripeCardFields({
  panelRef,
}: {
  panelRef: React.Ref<StripeCardPanelHandle>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [focused, setFocused] = useState<string | null>(null);

  useImperativeHandle(panelRef, () => ({
    async validate() {
      if (!stripe || !elements) {
        return { ok: false, error: "Card form is still loading. Please wait." };
      }
      const card = elements.getElement(
        CardNumberElement,
      ) as StripeCardNumberElement | null;
      if (!card) {
        return { ok: false, error: "Card form is not ready." };
      }
      const { error } = await stripe.createPaymentMethod({
        type: "card",
        card,
      });
      if (error) {
        return {
          ok: false,
          error: error.message ?? "Please check your card details.",
        };
      }
      return { ok: true };
    },
  }));

  const ring = (field: string) =>
    focused === field ? "ring-2 ring-[#0570de]/30 border-[#0570de]" : "border-[#e6e6e6]";

  return (
    <div className="stripe-card-shell text-[#30313d]">
      <div
        className={`overflow-hidden rounded-[5px] border bg-white ${ring("number")}`}
      >
        <div className="border-b border-[#e6e6e6] px-3 py-3.5">
          <CardNumberElement
            options={{
              ...elementOptions,
              placeholder: "1234 1234 1234 1234",
            }}
            onFocus={() => setFocused("number")}
            onBlur={() => setFocused(null)}
          />
        </div>
        <div className="grid grid-cols-2">
          <div
            className={`border-r border-[#e6e6e6] px-3 py-3.5 ${ring("exp")}`}
          >
            <CardExpiryElement
              options={{
                ...elementOptions,
                placeholder: "MM / YY",
              }}
              onFocus={() => setFocused("exp")}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div className={`px-3 py-3.5 ${ring("cvc")}`}>
            <CardCvcElement
              options={{
                ...elementOptions,
                placeholder: "CVC",
              }}
              onFocus={() => setFocused("cvc")}
              onBlur={() => setFocused(null)}
            />
          </div>
        </div>
      </div>
      <StripeFooter />
    </div>
  );
}

function StripeCardMock({
  panelRef,
}: {
  panelRef: React.Ref<StripeCardPanelHandle>;
}) {
  useImperativeHandle(panelRef, () => ({
    async validate() {
      return {
        ok: false,
        error:
          "Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Vercel to enable the secure Stripe card form.",
      };
    },
  }));

  return (
    <div className="stripe-card-shell text-[#30313d]">
      <div className="overflow-hidden rounded-[5px] border border-[#e6e6e6] bg-white">
        <div className="relative border-b border-[#e6e6e6] px-3 py-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 1234 1234 1234"
            className="w-full border-0 bg-transparent text-base outline-none placeholder:text-[#697386]"
            aria-label="Card number"
          />
          <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 gap-1 opacity-80">
            <CardBrandDots />
          </div>
        </div>
        <div className="grid grid-cols-2">
          <div className="border-r border-[#e6e6e6] px-3 py-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM / YY"
              className="w-full border-0 bg-transparent text-base outline-none placeholder:text-[#697386]"
              aria-label="Expiry"
            />
          </div>
          <div className="px-3 py-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="CVC"
              className="w-full border-0 bg-transparent text-base outline-none placeholder:text-[#697386]"
              aria-label="CVC"
            />
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-[#697386]">
        Add <code className="text-[11px]">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>{" "}
        in Vercel for live Stripe secure fields (recommended).
      </p>
      <StripeFooter />
    </div>
  );
}

function StripeFooter() {
  return (
    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#697386]">
      <span className="inline-flex items-center gap-1.5">
        <LockIcon />
        Secure payment
      </span>
      <span className="inline-flex items-center gap-1 font-medium text-[#635bff]">
        Powered by <StripeWordmark />
      </span>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6 1a2 2 0 00-2 2v1H3a1 1 0 00-1 1v5a1 1 0 001 1h6a1 1 0 001-1V5a1 1 0 00-1-1H8V3a2 2 0 00-2-2zm1 3V3a1 1 0 10-2 0v1h2z"
      />
    </svg>
  );
}

function StripeWordmark() {
  return (
    <svg width="38" height="16" viewBox="0 0 60 25" aria-label="Stripe" role="img">
      <path
        fill="#635bff"
        d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.8-2.9-1.61l-.02 7.08H33.6V7.53h4.26v1.64h.03c.67-.93 1.87-1.95 3.84-1.95 3.2 0 5.62 2.96 5.62 7.4 0 4.02-2.28 7.68-5.4 7.68zM40 10.42c-1.72 0-2.54 1.54-2.54 3.06v3.08c.68 1.14 1.52 1.85 2.54 1.85 1.97 0 3.28-2.15 3.28-4.98 0-2.84-1.3-4.01-3.28-4.01zM28.05 7.53h4.41v12.77h-4.41V7.53zm0-4.7L32.46 0v3.83h-4.41V2.83zm-6.37 9.05v.07c.83 1.18 2.07 2.08 3.75 2.08 2.83 0 4.58-2.14 4.58-5.43 0-3.07-1.6-5.37-4.44-5.37-1.75 0-3.05.96-3.89 2.1v-.06H14.1v12.77h4.18V11.88zm-4.18-4.35h4.18V0h-4.18v7.53zM0 8.54h4.41v11.76H0V8.54z"
      />
    </svg>
  );
}

function CardBrandDots() {
  return (
    <>
      <span className="h-[14px] w-[22px] rounded-[2px] bg-[#1a1f71]" title="Visa" />
      <span className="h-[14px] w-[22px] rounded-[2px] bg-[#eb001b]" title="Mastercard" />
      <span className="h-[14px] w-[22px] rounded-[2px] bg-[#006fcf]" title="Amex" />
    </>
  );
}

function StripeCardPanelInner({
  panelRef,
}: {
  panelRef: React.Ref<StripeCardPanelHandle>;
}) {
  const publishableKey = getStripePublishableKey();
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  if (!stripePromise) {
    return <StripeCardMock panelRef={panelRef} />;
  }

  return (
    <Elements stripe={stripePromise} options={{ locale: "en-GB" }}>
      <StripeCardFields panelRef={panelRef} />
    </Elements>
  );
}

/** Stripe Payment Element–style block: selected “Card” row + secure fields. */
export function StripePaymentSection({
  panelRef,
}: {
  panelRef: React.Ref<StripeCardPanelHandle>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e6e6e6] bg-white text-[#30313d] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.04)]">
      <div className="flex items-center justify-between border-b border-[#e6e6e6] bg-[#f6f9fc] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className="size-[18px] shrink-0 rounded-full border-[5px] border-[#0570de] bg-white"
            aria-hidden
          />
          <span className="text-sm font-medium tracking-[-0.01em]">Card</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CardBrandDots />
        </div>
      </div>
      <div className="bg-white p-4">
        <StripeCardPanelInner panelRef={panelRef} />
      </div>
    </div>
  );
}

/** @deprecated Use StripePaymentSection at checkout. */
export function StripeCardPanel({
  panelRef,
}: {
  panelRef: React.Ref<StripeCardPanelHandle>;
}) {
  return <StripePaymentSection panelRef={panelRef} />;
}
