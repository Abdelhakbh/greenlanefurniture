import { getAllProductsWithVariants } from "./catalog";
import { cleanProductHtml } from "./clean-html";
import { parseMoney, stripHtml, variantSlug } from "./format";
import { absoluteUrl } from "./metadata";
import { site } from "./site";
import type { StoreProduct, StoreVariant } from "./types";

const MAX_TITLE = 150;
const MAX_DESCRIPTION = 5000;
const MAX_ADDITIONAL_IMAGES = 10;

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

function variantColour(variant: StoreVariant) {
  return [variant.option1, variant.option2, variant.option3]
    .filter(Boolean)
    .join(" / ");
}

function isGrouped(product: StoreProduct) {
  return product.variants.length > 1 && product.variants.some((v) => v.option1);
}

/** Google taxonomy paths; https://www.google.com/basepages/producttype/taxonomy.en-GB.txt */
function googleCategory(product: StoreProduct) {
  const name = product.title.toLowerCase();
  if (/pouffe|footstool|ottoman/.test(name)) return "Furniture > Ottomans";
  if (/chair|armchair/.test(name)) {
    return "Furniture > Chairs > Arm Chairs, Recliners & Sleeper Chairs";
  }
  return "Furniture > Sofas";
}

function itemXml(product: StoreProduct, variant: StoreVariant) {
  const price = parseMoney(variant.price);
  if (!Number.isFinite(price) || price <= 0) return "";

  const grouped = isGrouped(product);
  const colour = grouped ? variantColour(variant) : "";
  const image = variant.image ?? product.images[0]?.src;
  if (!image) return "";

  const title = (colour ? `${product.title} - ${colour}` : product.title).slice(0, MAX_TITLE);
  const description =
    stripHtml(cleanProductHtml(product.body_html)).slice(0, MAX_DESCRIPTION) || product.title;
  const link = absoluteUrl(
    grouped
      ? `/product/${product.handle}?colour=${variantSlug(variant)}`
      : `/product/${product.handle}`,
  );
  // Google expects additional images to show the same colour; file names carry the colour slug.
  const colourInName = `-${variantSlug(variant)}-`;
  const additional = product.images
    .map((i) => i.src)
    .filter((src) => src && src !== image)
    .filter((src) => !grouped || (src.split("/").pop() ?? "").includes(colourInName))
    .slice(0, MAX_ADDITIONAL_IMAGES);

  const lines = [
    "    <item>",
    `      <g:id>${variant.id}</g:id>`,
    `      <g:title>${escapeXml(title)}</g:title>`,
    `      <g:description>${escapeXml(description)}</g:description>`,
    `      <g:link>${escapeXml(link)}</g:link>`,
    `      <g:image_link>${escapeXml(image)}</g:image_link>`,
    ...additional.map(
      (src) => `      <g:additional_image_link>${escapeXml(src)}</g:additional_image_link>`,
    ),
    `      <g:availability>${variant.available ? "in_stock" : "out_of_stock"}</g:availability>`,
    `      <g:price>${formatGmcPrice(price)}</g:price>`,
    "      <g:condition>new</g:condition>",
    `      <g:brand>${escapeXml(site.name)}</g:brand>`,
    "      <g:identifier_exists>no</g:identifier_exists>",
    `      <g:google_product_category>${escapeXml(googleCategory(product))}</g:google_product_category>`,
  ];
  if (product.product_type) {
    lines.push(`      <g:product_type>${escapeXml(product.product_type)}</g:product_type>`);
  }
  if (grouped) {
    lines.push(`      <g:item_group_id>${product.id}</g:item_group_id>`);
    lines.push(`      <g:color>${escapeXml(colour)}</g:color>`);
  }
  lines.push("    </item>");
  return lines.join("\n");
}

export async function buildGoogleShoppingFeedXml() {
  const products = await getAllProductsWithVariants();
  const items = products
    .flatMap((product) => product.variants.map((variant) => itemXml(product, variant)))
    .filter(Boolean);

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${escapeXml(absoluteUrl("/"))}</link>
    <description>${escapeXml(`${site.name} - ${site.subhead}`.slice(0, MAX_DESCRIPTION))}</description>
${items.join("\n")}
  </channel>
</rss>
`;
}
