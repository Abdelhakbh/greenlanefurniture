import { NextResponse } from "next/server";
import {
  resolveShopifyCheckoutLines,
  shopifyCartCheckoutUrl,
  shopifyCheckoutEnabled,
} from "@/lib/shopify-admin";

export const runtime = "nodejs";

type Body = {
  lines?: {
    handle: string;
    qty: number;
    attributes?: Record<string, string>;
    title?: string;
  }[];
};

export async function POST(req: Request) {
  if (!shopifyCheckoutEnabled()) {
    return NextResponse.json(
      { error: "Shopify checkout is not configured." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const lines = body.lines?.filter((l) => l.handle && l.qty > 0) ?? [];
  if (!lines.length) {
    return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });
  }

  try {
    const shopifyLines = await resolveShopifyCheckoutLines(lines);
    const url = shopifyCartCheckoutUrl(shopifyLines);
    return NextResponse.json({ url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout unavailable.";
    console.error("[api/checkout/shopify]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
