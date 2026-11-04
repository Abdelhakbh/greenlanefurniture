/**
 * Untrack all Shopify variants (continue selling, no SOLD OUT at checkout).
 * Env: SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET
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

const shopRaw = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE || "uwmdi7-eh.myshopify.com";
const shopHost = shopRaw.replace(/^https?:\/\//, "").includes(".")
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
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).access_token;
}

async function api(method, apiPath, body) {
  const res = await fetch(`https://${shopHost}/admin/api/2025-01${apiPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": await getToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${apiPath} ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

let sinceId = 0;
let untracked = 0;

for (;;) {
  const path = `/products.json?limit=250&fields=id,variants${sinceId ? `&since_id=${sinceId}` : ""}`;
  const { products } = await api("GET", path);
  if (!products?.length) break;
  for (const p of products) {
    sinceId = p.id;
    for (const v of p.variants ?? []) {
      await api("PUT", `/variants/${v.id}.json`, {
        variant: {
          id: v.id,
          inventory_management: null,
          inventory_policy: "continue",
        },
      });
      untracked++;
    }
  }
  if (products.length < 250) break;
}

console.log(`Untracked ${untracked} variants on ${shopHost}`);
