import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe-server";
import {
  computeExpectedOrderTotalPence,
  type CreateWooOrderLine,
} from "@/lib/woocommerce-order";

type Body = {
  ref: string;
  lines: CreateWooOrderLine[];
  shipping?: number;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("Invalid JSON body.");
  }

  if (!body.ref?.trim()) return bad("Missing order reference.");
  if (!Array.isArray(body.lines) || !body.lines.length) {
    return bad("Your bag is empty.");
  }

  for (const line of body.lines) {
    if (
      !Number.isFinite(line.productId) ||
      !Number.isFinite(line.variantId) ||
      !Number.isFinite(line.qty) ||
      line.qty < 1
    ) {
      return bad("Invalid line item in cart.");
    }
  }

  try {
    const shippingTotal = Number(body.shipping) || 0;
    const amountPence = await computeExpectedOrderTotalPence(
      body.lines,
      shippingTotal,
    );
    if (amountPence < 50) {
      return bad("Order total is too low for card payment.");
    }

    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.create({
      amount: amountPence,
      currency: "gbp",
      automatic_payment_methods: { enabled: true },
      metadata: { order_ref: body.ref.trim() },
    });

    if (!intent.client_secret) {
      return bad("Could not start payment.", 502);
    }

    return NextResponse.json({
      clientSecret: intent.client_secret,
      amountPence,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Stripe error";
    console.error("[api/stripe/create-payment-intent]", message);
    return NextResponse.json(
      {
        error: "Could not start card payment. Please try again shortly.",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 502 },
    );
  }
}
