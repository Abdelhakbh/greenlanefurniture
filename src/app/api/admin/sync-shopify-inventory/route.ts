import { NextResponse } from "next/server";
import { syncAllShopifyInventory } from "@/lib/shopify-admin";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cron = process.env.CRON_SECRET?.trim();
  if (cron && bearer === cron) return true;
  const manual = process.env.SYNC_SHOPIFY_INVENTORY_SECRET?.trim();
  if (manual && bearer === manual) return true;
  return false;
}

/** POST — set all Shopify variants to continue selling with stock 999. */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllShopifyInventory();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed";
    console.error("[sync-shopify-inventory]", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
