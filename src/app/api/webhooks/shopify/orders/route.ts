import { NextResponse } from "next/server";
import { notifyShopifySale } from "@/lib/sale-notify";
import type { ShopifyWebhookOrder } from "@/lib/shopify-order-notify";
import { verifyShopifyWebhook } from "@/lib/shopify-webhook-verify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const topic = req.headers.get("x-shopify-topic") ?? "";

  if (!verifyShopifyWebhook(rawBody, hmac)) {
    console.warn("[shopify webhook] invalid HMAC", topic);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let order: ShopifyWebhookOrder;
  try {
    order = JSON.parse(rawBody) as ShopifyWebhookOrder;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!order?.id || !order.name) {
    return NextResponse.json({ error: "Not an order payload" }, { status: 400 });
  }

  try {
    const result = await notifyShopifySale(order);
    return NextResponse.json({ ok: true, topic, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Notify failed";
    console.error("[shopify webhook]", topic, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
