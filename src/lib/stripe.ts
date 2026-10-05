/** Stripe publishable key (pk_test_… or pk_live_…). Required for real Stripe card iframes. */
export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

/** Hosted Payment Link — used after order is saved in Woo (Leeds-style). */
export function getStripePaymentLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim() ?? "";
}

/** When true, card UI works but checkout skips Stripe redirect and shows bank transfer fallback. */
export function isStripeCardPaused() {
  return process.env.NEXT_PUBLIC_STRIPE_CARD_PAUSED === "true";
}

export function isStripePaymentLinkConfigured(link = getStripePaymentLink()) {
  if (!link) return false;
  return (
    link.includes("buy.stripe.com") ||
    link.includes("checkout.stripe.com") ||
    link.startsWith("https://")
  );
}

export function buildStripePaymentUrl(
  baseLink: string,
  opts: { ref: string; email?: string },
) {
  const url = new URL(baseLink);
  url.searchParams.set("client_reference_id", opts.ref);
  if (opts.email) url.searchParams.set("prefilled_email", opts.email);
  return url.toString();
}
