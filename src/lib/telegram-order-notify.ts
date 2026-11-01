import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

type WooAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  city?: string;
  postcode?: string;
  country?: string;
  company?: string;
  email?: string;
  phone?: string;
};

type WooLineItem = {
  name: string;
  quantity: number;
  total: string;
};

export type WooOrderForNotify = {
  id: number;
  number: string;
  status: string;
  total: string;
  payment_method_title: string;
  billing: WooAddress;
  shipping: WooAddress;
  line_items: WooLineItem[];
};

const NO_SALE_STATUSES = new Set([
  "failed",
  "cancelled",
  "draft",
  "trash",
  "checkout-draft",
  "auto-draft",
]);

function telegramConfigured() {
  return Boolean(
    process.env.TELEGRAM_BOT_TOKEN?.trim() &&
      process.env.TELEGRAM_CHAT_ID?.trim(),
  );
}

function countryLabel(code: string | undefined) {
  const c = (code || "GB").toUpperCase();
  if (c === "GB") return "United Kingdom";
  if (c === "IE") return "Ireland";
  return c;
}

function statusLabel(status: string) {
  return status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function fullName(addr: WooAddress) {
  return [addr.first_name, addr.last_name].filter(Boolean).join(" ").trim();
}

function money(value: string) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? formatPrice(n) : value;
}

export function buildTelegramSaleMessage(order: WooOrderForNotify) {
  const store = site.name;
  const lines: string[] = [
    `🎉💰 NEW SALE! 🏪 ${store}`,
    "",
    `Order number: #${order.number}`,
    `Status: ${statusLabel(order.status)}`,
    `Total: ${money(order.total)}`,
    `Payment method: ${order.payment_method_title || "—"}`,
    "",
    "Products:",
  ];

  for (const item of order.line_items) {
    lines.push(
      `• ${item.name} × ${item.quantity} — ${money(item.total)}`,
    );
  }

  const bill = order.billing;
  lines.push(
    "",
    "Customer:",
    `Name: ${fullName(bill) || "—"}`,
    `Email: ${bill.email?.trim() || "—"}`,
    `Phone: ${bill.phone?.trim() || "—"}`,
  );
  if (bill.company?.trim()) {
    lines.push(`Company: ${bill.company.trim()}`);
  }

  const ship = order.shipping;
  lines.push(
    "",
    "Shipping address:",
    fullName(ship) || fullName(bill) || "—",
    ship.address_1?.trim() || bill.address_1?.trim() || "—",
    `${ship.city?.trim() || bill.city?.trim() || "—"}, ${ship.postcode?.trim() || bill.postcode?.trim() || "—"}`,
    countryLabel(ship.country || bill.country),
  );

  return lines.join("\n");
}

export function shouldNotifyTelegramSale(status: string) {
  return !NO_SALE_STATUSES.has(status.toLowerCase());
}

export async function sendTelegramSaleNotification(
  order: WooOrderForNotify,
): Promise<boolean> {
  if (!telegramConfigured()) {
    return false;
  }
  if (!shouldNotifyTelegramSale(order.status)) {
    return false;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID!.trim();
  const text = buildTelegramSaleMessage(order);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Telegram send failed (${res.status}): ${detail.slice(0, 200)}`);
  }
  return true;
}
