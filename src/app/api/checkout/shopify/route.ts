import { NextResponse } from "next/server";
import {
  resolveShopifyCheckoutLines,
  shopifyCartCheckoutUrl,
  shopifyCheckoutEnabled,
} from "@/lib/shopify-admin";

export const runtime = "nodejs";

const ALLOWED_ORIGINS = new Set([
  "https://www.greenlanefurniture.co.uk",
  "https://greenlanefurniture.co.uk",
  "http://localhost:3000",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

type Body = {
  lines?: {
    handle: string;
    qty: number;
    attributes?: Record<string, string>;
    title?: string;
  }[];
};

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const extraHeaders = corsHeaders(origin);

  if (!shopifyCheckoutEnabled()) {
    return NextResponse.json(
      { error: "Shopify checkout is not configured." },
      { status: 503, headers: extraHeaders },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400, headers: extraHeaders },
    );
  }

  const lines = body.lines?.filter((l) => l.handle && l.qty > 0) ?? [];
  if (!lines.length) {
    return NextResponse.json(
      { error: "Your bag is empty." },
      { status: 400, headers: extraHeaders },
    );
  }

  try {
    const shopifyLines = await resolveShopifyCheckoutLines(lines);
    const url = shopifyCartCheckoutUrl(shopifyLines);
    return NextResponse.json({ url }, { headers: extraHeaders });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout unavailable.";
    console.error("[api/checkout/shopify]", message);
    return NextResponse.json(
      { error: message },
      { status: 502, headers: extraHeaders },
    );
  }
}
