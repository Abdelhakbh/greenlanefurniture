import { getAllProducts } from "./catalog";
import { parseMoney, stripHtml } from "./format";
import { absoluteUrl } from "./metadata";
import { site } from "./site";
import type { StoreProduct, StoreVariant } from "./types";

const MAX_TITLE = 150;
const MAX_DESCRIPTION = 5000;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatGmcPrice(amount: number) {
  return `${amount.toFixed(2)} ${site.currency}`;
}

function productLink(handle: string) {
  return absoluteUrl(`/product/${handle}`);
}

function itemTitle(product: StoreProduct, variant: StoreVariant) {
  const base = product.title.trim();
  if (variant.title && variant.title !== "Default Title") {
    return `${base} — ${variant.title}`.slice(0, MAX_TITLE);
  }
  return base.slice(0, MAX_TITLE);
}

function itemDescription(product: StoreProduct) {
  const raw = stripHtml(product.body_html || product.title);
  const text = raw || product.title;
  return text.slice(0, MAX_DESCRIPTION);
}

function buildItemXml(product: StoreProduct, variant: StoreVariant) {
  const image = product.images[0]?.src;
  if (!image) return "";

  const price = parseMoney(variant.price);
  if (!Number.isFinite(price) || price <= 0) return "";

  const id = String(variant.id);
  const title = escapeXml(itemTitle(product, variant));
  const description = escapeXml(itemDescription(product));
  const link = escapeXml(productLink(product.handle));
  const imageLink = escapeXml(image);
  const availability = variant.available ? "in_stock" : "out_of_stock";
  const hasVariantGroup =
    product.variants.length > 1 || product.options.length > 0;

  const lines = [
    "    <item>",
    `      <g:id>${escapeXml(id)}</g:id>`,
    `      <g:title>${title}</g:title>`,
    `      <g:description>${description}</g:description>`,
    `      <g:link>${link}</g:link>`,
    `      <g:image_link>${imageLink}</g:image_link>`,
    `      <g:availability>${availability}</g:availability>`,
    `      <g:price>${formatGmcPrice(price)}</g:price>`,
    "      <g:condition>new</g:condition>",
    `      <g:brand>${escapeXml(site.name)}</g:brand>`,
    "      <g:google_product_category>6367</g:google_product_category>",
  ];

  if (product.product_type) {
    lines.push(
      `      <g:product_type>${escapeXml(product.product_type)}</g:product_type>`,
    );
  }

  if (hasVariantGroup) {
    lines.push(`      <g:item_group_id>${product.id}</g:item_group_id>`);
  }

  lines.push("    </item>");
  return lines.join("\n");
}

export async function buildGoogleShoppingFeedXml() {
  const products = await getAllProducts();
  const items = products
    .flatMap((product) =>
      product.variants.map((variant) => buildItemXml(product, variant)),
    )
    .filter(Boolean);

  const channelTitle = escapeXml(site.name);
  const channelLink = escapeXml(absoluteUrl("/"));
  const channelDescription = escapeXml(
    `${site.name} — ${site.subhead}`.slice(0, MAX_DESCRIPTION),
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${channelTitle}</title>
    <link>${channelLink}</link>
    <description>${channelDescription}</description>
${items.join("\n")}
  </channel>
</rss>
`;
}
