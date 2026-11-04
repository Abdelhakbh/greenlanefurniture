/**
 * Register Shopify order webhooks → Vercel API (email + Telegram on sale).
 *
 * Env: SHOPIFY_STORE / SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET
 *      NEXT_PUBLIC_SITE_URL (e.g. https://www.greenlanefurniture.co.uk)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.greenlanefurniture.co.uk").replace(
  /\/$/,
  "",
);
const callback = `${siteUrl}/api/webhooks/shopify/orders`;
const topics = ["orders/paid", "orders/create"];

const shopRaw = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE;
const shopHost = shopRaw?.includes(".")
  ? shopRaw.replace(/^https?:\/\//, "")
  : `${shopRaw}.myshopify.com`;

let token = process.env.SHOPIFY_ADMIN_TOKEN;
if (token?.startsWith("shpss_")) token = null;

async function getToken() {
  if (token) return token;
  const res = await fetch(`https://${shopHost}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Token failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function rest(method, apiPath, body) {
  const res = await fetch(`https://${shopHost}/admin/api/2025-01${apiPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": await getToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${apiPath} ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const existing = (await rest("GET", "/webhooks.json")).webhooks ?? [];
for (const hook of existing) {
  if (hook.address === callback) {
    console.log("Removing old webhook", hook.id, hook.topic);
    await rest("DELETE", `/webhooks/${hook.id}.json`);
  }
}

for (const topic of topics) {
  const created = await rest("POST", "/webhooks.json", {
    webhook: { topic, address: callback, format: "json" },
  });
  console.log("Registered", topic, "→", callback, "id", created.webhook?.id);
}

console.log("\nDone. Set on Vercel:");
console.log("  SALE_NOTIFY_EMAIL=abdegeeK@gmail.com");
console.log("  RESEND_API_KEY=re_...  (https://resend.com — verify your domain or use onboarding sender for tests)");
console.log("  TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (optional)");
