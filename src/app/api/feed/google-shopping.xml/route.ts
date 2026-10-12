import { connection } from "next/server";
import { buildGoogleShoppingFeedXml } from "@/lib/google-shopping-feed";

export const maxDuration = 60;

export async function GET() {
  // Building the feed takes ~170 store requests; do it per request (CDN-cached below), not at build time.
  await connection();
  try {
    const xml = await buildGoogleShoppingFeedXml();
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error("Google feed failed", e);
    return new Response("Product feed unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
