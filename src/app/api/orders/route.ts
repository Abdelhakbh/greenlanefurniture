import { NextResponse } from "next/server";
import type { PaymentMethod } from "@/lib/checkout-config";
import { assertPaymentIntentSucceeded } from "@/lib/stripe-server";
import {
  computeExpectedOrderTotalPence,
  createWooCommerceOrder,
  type CreateWooOrderLine,
} from "@/lib/woocommerce-order";

type OrderBody = {
  ref: string;
  method: PaymentMethod;
  shipping: number;
  lines: CreateWooOrderLine[];
  billing: Record<string, string>;
  paymentIntentId?: string;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  let body: OrderBody;
  try {
    body = (await req.json()) as OrderBody;
  } catch {
    return bad("Invalid JSON body.");
  }

  if (!body.ref?.trim()) return bad("Missing order reference.");
  if (body.method !== "card") {
    return bad("Invalid payment method.");
  }
  if (!body.paymentIntentId?.trim()) {
    return bad("Missing payment confirmation.");
  }
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

  const b = body.billing ?? {};
  const first_name = b.first_name?.trim();
  const last_name = b.last_name?.trim();
  const email = b.email?.trim();
  const address1 = b.address1?.trim();
  const city = b.city?.trim();
  const postcode = b.postcode?.trim();
  const country = b.country?.trim() || "GB";

  if (!first_name || !last_name || !email || !address1 || !city || !postcode) {
    return bad("Please complete all required billing fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return bad("Please enter a valid email address.");
  }

  const ship_address1 = b.ship_address1?.trim();
  const shipping =
    ship_address1 && b.ship_city?.trim() && b.ship_postcode?.trim()
      ? {
          address1: ship_address1,
          city: b.ship_city.trim(),
          postcode: b.ship_postcode.trim(),
          country,
        }
      : undefined;

  const shippingTotal = Number(body.shipping) || 0;

  try {
    const expectedPence = await computeExpectedOrderTotalPence(
      body.lines,
      shippingTotal,
    );
    await assertPaymentIntentSucceeded(
      body.paymentIntentId.trim(),
      expectedPence,
      body.ref.trim(),
    );

    const result = await createWooCommerceOrder({
      ref: body.ref.trim(),
      method: body.method,
      shippingTotal,
      lines: body.lines,
      billing: {
        first_name,
        last_name,
        email,
        phone: b.phone?.trim(),
        address1,
        city,
        postcode,
        country,
      },
      shipping,
      customerNote: b.notes?.trim(),
      stripePaymentIntentId: body.paymentIntentId.trim(),
    });

    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Could not create order in WooCommerce.";
    console.error("[api/orders]", message);
    return NextResponse.json(
      {
        error:
          "We could not complete your order. If you were charged, contact us with your payment reference.",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 502 },
    );
  }
}
