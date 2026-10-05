"use client";

import Image from "next/image";
type StripePaymentSectionProps = {
  onCardAttempt: () => void;
  cardNotice?: string;
};

function CardBrandDots() {
  return (
    <>
      <span className="h-[14px] w-[22px] rounded-[2px] bg-[#1a1f71]" title="Visa" />
      <span className="h-[14px] w-[22px] rounded-[2px] bg-[#eb001b]" title="Mastercard" />
      <span className="h-[14px] w-[22px] rounded-[2px] bg-[#006fcf]" title="Amex" />
    </>
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

export function PoweredByStripe() {
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

function StripeFooter() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#697386]">
        <LockIcon />
        Secure payment
      </span>
      <PoweredByStripe />
    </div>
  );
}

/** Stripe-style card UI (display only — cards not accepted). */
export function StripePaymentSection({
  onCardAttempt,
  cardNotice,
}: StripePaymentSectionProps) {
  const blockAttempt = () => onCardAttempt();

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#e6e6e6] bg-white text-[#30313d] opacity-[0.92] shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between border-b border-[#e6e6e6] bg-[#fafafa] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className="size-[18px] shrink-0 rounded-full border-2 border-[#c7ccd1] bg-white"
            aria-hidden
          />
          <span className="text-sm font-medium text-[#697386]">Card</span>
          <span className="rounded bg-[#f0f0f0] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#697386]">
            Unavailable
          </span>
        </div>
        <div className="flex items-center gap-1.5 opacity-50">
          <CardBrandDots />
        </div>
      </div>

      <div className="pointer-events-auto bg-white p-4">
        <div
          className="overflow-hidden rounded-[5px] border border-[#e6e6e6] bg-[#fafbfc]"
          onFocusCapture={blockAttempt}
          onClick={blockAttempt}
          role="group"
          aria-label="Card payment unavailable"
        >
          <div className="relative border-b border-[#e6e6e6] px-3 py-3">
            <input
              type="text"
              readOnly
              tabIndex={0}
              placeholder="1234 1234 1234 1234"
              className="w-full cursor-not-allowed border-0 bg-transparent text-base text-[#697386] outline-none placeholder:text-[#aab7c4]"
              aria-label="Card number"
              onFocus={blockAttempt}
            />
            <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 gap-1 opacity-40">
              <CardBrandDots />
            </div>
          </div>
          <div className="grid grid-cols-2">
            <div className="border-r border-[#e6e6e6] px-3 py-3">
              <input
                type="text"
                readOnly
                tabIndex={0}
                placeholder="MM / YY"
                className="w-full cursor-not-allowed border-0 bg-transparent text-base text-[#697386] outline-none placeholder:text-[#aab7c4]"
                aria-label="Expiry"
                onFocus={blockAttempt}
              />
            </div>
            <div className="px-3 py-3">
              <input
                type="text"
                readOnly
                tabIndex={0}
                placeholder="CVC"
                className="w-full cursor-not-allowed border-0 bg-transparent text-base text-[#697386] outline-none placeholder:text-[#aab7c4]"
                aria-label="CVC"
                onFocus={blockAttempt}
              />
            </div>
          </div>
        </div>

        {cardNotice && (
          <p
            className="mt-3 rounded-md border border-[#df1b41]/25 bg-[#fef2f4] px-3 py-2 text-sm text-[#df1b41]"
            role="alert"
          >
            {cardNotice}
          </p>
        )}

        <StripeFooter />
      </div>
    </div>
  );
}
