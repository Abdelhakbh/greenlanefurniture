/** Stripe publishable key (pk_test_… or pk_live_…). */
export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? "";
}

export function isStripeConfigured() {
  return Boolean(getStripePublishableKey());
}
