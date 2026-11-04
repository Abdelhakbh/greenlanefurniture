import { NextResponse } from "next/server";

/** Legacy Woo checkout orders — storefront uses Shopify checkout only. */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Please pay from your bag using secure online checkout.",
    },
    { status: 410 },
  );
}
