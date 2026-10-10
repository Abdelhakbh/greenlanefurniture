import { buildGoogleShoppingFeedXml } from "@/lib/google-shopping-feed";

export const revalidate = 3600;

export async function GET() {
  try {
    const xml = await buildGoogleShoppingFeedXml();
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Product feed unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
