import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export type ShopifyWebhookOrder = {
  id: number;
  name: string;
  order_number?: number;
  email?: string | null;
  phone?: string | null;
  total_price: string;
  currency?: string;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  payment_gateway_names?: string[];
  line_items?: {
    name: string;
    title?: string;
    quantity: number;
    price: string;
  }[];
  shipping_address?: ShopifyAddress | null;
  billing_address?: ShopifyAddress | null;
  customer?: { first_name?: string; last_name?: string; email?: string } | null;
};

type ShopifyAddress = {
  first_name?: string;
  last_name?: string;
  address1?: string;
  city?: string;
  zip?: string;
  country?: string;
  phone?: string;
  company?: string;
};

function money(value: string, currency = "GBP") {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? formatPrice(n) : `${value} ${currency}`;
}

function fullName(addr?: ShopifyAddress | null) {
  if (!addr) return "";
  return [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim();
}

export function shouldNotifyShopifyOrder(order: ShopifyWebhookOrder) {
  const status = (order.financial_status || "").toLowerCase();
  if (status === "paid" || status === "partially_paid") return true;
  if (status === "authorized" || status === "pending") return true;
  return false;
}

export function buildShopifySaleEmail(order: ShopifyWebhookOrder) {
  const lines: string[] = [
    `New Shopify sale — ${site.name}`,
    "",
    `Order: ${order.name}`,
    `Total: ${money(order.total_price, order.currency ?? "GBP")}`,
    `Payment status: ${order.financial_status ?? "—"}`,
    `Payment: ${(order.payment_gateway_names ?? []).join(", ") || "—"}`,
    "",
    "Items:",
  ];

  for (const item of order.line_items ?? []) {
    const label = item.name || item.title || "Item";
    lines.push(
      `• ${label} × ${item.quantity} — ${money(item.price, order.currency ?? "GBP")}`,
    );
  }

  const bill = order.billing_address;
  const ship = order.shipping_address;
  const email =
    order.email?.trim() ||
    order.customer?.email?.trim() ||
    bill?.phone ||
    "—";

  lines.push(
    "",
    "Customer:",
    `Name: ${fullName(bill) || fullName(ship) || "—"}`,
    `Email: ${email}`,
    `Phone: ${order.phone?.trim() || bill?.phone?.trim() || ship?.phone?.trim() || "—"}`,
    "",
    "Shipping:",
    fullName(ship) || fullName(bill) || "—",
    ship?.address1?.trim() || bill?.address1?.trim() || "—",
    `${ship?.city?.trim() || bill?.city?.trim() || "—"}, ${ship?.zip?.trim() || bill?.zip?.trim() || "—"}`,
    ship?.country?.trim() || bill?.country?.trim() || "United Kingdom",
    "",
    `Shopify order ID: ${order.id}`,
  );

  const text = lines.join("\n");
  const subject = `New order ${order.name} — ${money(order.total_price, order.currency ?? "GBP")}`;
  return { subject, text };
}

export function buildShopifySaleTelegram(order: ShopifyWebhookOrder) {
  const { text } = buildShopifySaleEmail(order);
  return `🎉💰 NEW SHOPIFY SALE\n\n${text}`;
}
