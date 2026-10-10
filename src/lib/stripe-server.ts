import Stripe from "stripe";

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

export function getStripeClient() {
  const key = getStripeSecretKey();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured on the server.");
  }
  return new Stripe(key);
}

export async function assertPaymentIntentSucceeded(
  paymentIntentId: string,
  expectedAmountPence: number,
  expectedRef: string,
) {
  const stripe = getStripeClient();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== "succeeded") {
    throw new Error(`Payment not completed (status: ${pi.status}).`);
  }

  if (pi.amount !== expectedAmountPence) {
    throw new Error("Payment amount does not match the order total.");
  }

  const ref = pi.metadata?.order_ref;
  if (ref && ref !== expectedRef) {
    throw new Error("Payment reference mismatch.");
  }

  return pi;
}
