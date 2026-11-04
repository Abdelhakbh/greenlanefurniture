/**
 * Mark every Woo product/variation in stock and Shopify variants as continue-selling.
 * Loads .env.local from project root when present.
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

const wp = process.env.WORDPRESS_URL?.replace(/\/$/, "");
const wooKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
const wooSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

async function woo(method, apiPath, body) {
  const url = new URL(`/wp-json/wc/v3${apiPath}`, wp);
  url.username = wooKey;
  url.password = wooSecret;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${apiPath} ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function setWooInStock() {
  if (!wp || !wooKey || !wooSecret) {
    console.log("Skip Woo: missing WORDPRESS_URL or Woo keys");
    return;
  }
  let page = 1;
  let updated = 0;
  while (page < 100) {
    const products = await woo(
      "GET",
      `/products?status=publish&per_page=100&page=${page}&_fields=id,type,variations`,
    );
    if (!products.length) break;
    for (const p of products) {
      await woo("PUT", `/products/${p.id}`, {
        stock_status: "instock",
        manage_stock: false,
      });
      updated++;
      if (p.type === "variable" && p.variations?.length) {
        for (const vid of p.variations) {
          await woo("PUT", `/products/${p.id}/variations/${vid}`, {
            stock_status: "instock",
            manage_stock: false,
          });
        }
      }
    }
    if (products.length < 100) break;
    page++;
  }
  console.log(`Woo: updated ${updated} products`);
}

async function shopifyRest(method, apiPath, body) {
  const shopRaw = process.env.SHOPIFY_STORE?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const shopHost = shopRaw?.includes(".") ? shopRaw : `${shopRaw}.myshopify.com`;
  let token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (token?.startsWith("shpss_")) token = null;
  if (!token && process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET) {
    const res = await fetch(`https://${shopHost}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      }),
    });
    const data = await res.json();
    token = data.access_token;
  }
  if (!shopHost || !token) throw new Error("Shopify credentials missing");
  const res = await fetch(`https://${shopHost}/admin/api/2025-01${apiPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${apiPath} ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function setShopifyInStock() {
  if (!process.env.SHOPIFY_STORE && !process.env.SHOPIFY_ADMIN_TOKEN) {
    console.log("Skip Shopify: no store credentials");
    return;
  }
  let sinceId = 0;
  let variants = 0;
  for (;;) {
    const data = await shopifyRest(
      "GET",
      `/products.json?limit=250&fields=id,variants${sinceId ? `&since_id=${sinceId}` : ""}`,
    );
    const products = data.products ?? [];
    if (!products.length) break;
    for (const p of products) {
      sinceId = p.id;
      for (const v of p.variants ?? []) {
        await shopifyRest("PUT", `/variants/${v.id}.json`, {
          variant: {
            id: v.id,
            inventory_policy: "continue",
            inventory_management: null,
          },
        });
        variants++;
      }
    }
    if (products.length < 250) break;
  }
  console.log(`Shopify: updated ${variants} variants`);
}

await setWooInStock();
await setShopifyInStock();
