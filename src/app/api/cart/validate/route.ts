import { NextResponse } from "next/server";
import {
  currentLineUnitPrice,
  type CreateWooOrderLine,
} from "@/lib/woocommerce-order";

export async function POST(req: Request) {
  let lines: CreateWooOrderLine[];
  try {
    lines = ((await req.json()) as { lines: CreateWooOrderLine[] }).lines;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!Array.isArray(lines) || lines.length > 50) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      lines.map(async (l) => ({
        variantId: l.variantId,
        price: Number.isFinite(l.productId) && Number.isFinite(l.variantId)
          ? await currentLineUnitPrice(l)
          : null,
      })),
    );
    return NextResponse.json({ lines: results });
  } catch (e) {
    console.error("[api/cart/validate]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Could not check cart." }, { status: 502 });
  }
}
