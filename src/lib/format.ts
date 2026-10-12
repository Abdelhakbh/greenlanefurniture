export function formatPrice(amount: number, currency = "GBP") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

export function parseMoney(value: string) {
  return Number.parseFloat(value);
}

export function savingPercent(price: number, compareAt: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** URL value for a variant, e.g. "Cream/Black" → "cream-black" (used as ?colour=). */
export function variantSlug(variant: {
  option1: string | null;
  option2: string | null;
  option3: string | null;
}) {
  return [variant.option1, variant.option2, variant.option3]
    .filter((v): v is string => Boolean(v))
    .map(slugify)
    .join("-");
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
