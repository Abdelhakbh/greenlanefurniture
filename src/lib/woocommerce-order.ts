import {
  amountToPence,
  checkoutConfig,
  computeOrderTotals,
  type PaymentMethod,
} from "./checkout-config";

type WooOrderResponse = {
  id: number;
  number: string;
  order_key: string;
};

export type WooOrderDetail = {
  id: number;
  number: string;
  status: string;
  total: string;
  payment_method_title: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company: string;
    address_1: string;
    city: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: { name: string; quantity: number; total: string }[];
};

type WooPriceRow = { price: string; regular_price: string };

function getConfig() {
  const base = process.env.WORDPRESS_URL?.replace(/\/$/, "");
  const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;
  if (!base || !key || !secret) {
    throw new Error("WooCommerce is not configured on the server.");
  }
  return { base, key, secret };
}

async function wooFetch<T>(path: string, attempt = 0): Promise<T> {
  const { base, key, secret } = getConfig();
  const url = new URL(`${base}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      return wooFetch<T>(path, attempt + 1);
    }
    const detail = await res.text();
    throw new Error(
      `WooCommerce fetch failed (${res.status}): ${detail.slice(0, 200)}`,
    );
  }
  return res.json() as Promise<T>;
}

async function wooMutate<T>(
  method: "POST" | "PUT",
  path: string,
  body: unknown,
  attempt = 0,
): Promise<T> {
  const { base, key, secret } = getConfig();
  const url = new URL(`${base}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", key);
  url.searchParams.set("consumer_secret", secret);
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    if (attempt < 3 && (res.status === 429 || res.status >= 500)) {
      await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      return wooMutate<T>(method, path, body, attempt + 1);
    }
    const detail = await res.text();
    throw new Error(
      `WooCommerce order failed (${res.status}): ${detail.slice(0, 400)}`,
    );
  }
  return res.json() as Promise<T>;
}

function parseWooPrice(row: WooPriceRow) {
  const raw = row.price || row.regular_price || "0";
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Invalid product price from WooCommerce.");
  }
  return n;
}

async function lineUnitPrice(line: CreateWooOrderLine) {
  if (line.variantId && line.variantId !== line.productId) {
    const v = await wooFetch<WooPriceRow>(
      `/products/${line.productId}/variations/${line.variantId}`,
    );
    return parseWooPrice(v);
  }
  const p = await wooFetch<WooPriceRow>(`/products/${line.productId}`);
  return parseWooPrice(p);
}

/** Current unit price, or null if the product/variation no longer exists. */
export async function currentLineUnitPrice(line: CreateWooOrderLine) {
  try {
    return await lineUnitPrice(line);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/\((400|404)\)/.test(msg)) return null;
    throw e;
  }
}

export type CreateWooOrderLine = {
  productId: number;
  variantId: number;
  qty: number;
};

export async function computeExpectedOrderTotalPence(
  lines: CreateWooOrderLine[],
  shippingTotal: number,
) {
  const prices = await Promise.all(
    lines.map(async (line) => {
      const unit = await lineUnitPrice(line);
      return unit * line.qty;
    }),
  );
  const subtotal = prices.reduce((s, n) => s + n, 0);
  const total = Math.round((subtotal + shippingTotal) * 100) / 100;
  return amountToPence(total);
}

export type CreateWooOrderInput = {
  ref: string;
  method: PaymentMethod;
  shippingTotal: number;
  lines: CreateWooOrderLine[];
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    company?: string;
    address1: string;
    city: string;
    postcode: string;
    country: string;
  };
  shipping?: {
    address1: string;
    city: string;
    postcode: string;
    country: string;
  };
  customerNote?: string;
};

function paymentForMethod(_method: PaymentMethod) {
  return {
    payment_method: "other",
    payment_method_title: "Online checkout",
    set_paid: false,
    status: "pending" as const,
  };
}

export async function createWooCommerceOrder(input: CreateWooOrderInput) {
  const pay = paymentForMethod(input.method);

  const billing = {
    first_name: input.billing.first_name,
    last_name: input.billing.last_name,
    email: input.billing.email,
    phone: input.billing.phone ?? "",
    company: input.billing.company ?? "",
    address_1: input.billing.address1,
    city: input.billing.city,
    postcode: input.billing.postcode,
    country: input.billing.country || "GB",
  };

  const shipTo = input.shipping?.address1?.trim()
    ? {
        first_name: billing.first_name,
        last_name: billing.last_name,
        address_1: input.shipping.address1,
        city: input.shipping.city,
        postcode: input.shipping.postcode,
        country: input.shipping.country || billing.country,
      }
    : {
        first_name: billing.first_name,
        last_name: billing.last_name,
        address_1: billing.address_1,
        city: billing.city,
        postcode: billing.postcode,
        country: billing.country,
      };

  const line_items = input.lines.map((line) => {
    const item: {
      product_id: number;
      quantity: number;
      variation_id?: number;
    } = {
      product_id: line.productId,
      quantity: line.qty,
    };
    if (line.variantId && line.variantId !== line.productId) {
      item.variation_id = line.variantId;
    }
    return item;
  });

  const shipping_lines =
    input.shippingTotal > 0
      ? [
          {
            method_id: "flat_rate",
            method_title: "Delivery",
            total: input.shippingTotal.toFixed(2),
          },
        ]
      : [];

  const catalogTotal =
    (await computeExpectedOrderTotalPence(input.lines, input.shippingTotal)) /
    100;
  const { total } = computeOrderTotals(catalogTotal, 0);

  const noteParts = [
    input.customerNote?.trim(),
    `Payment: online checkout. Amount due: £${total.toFixed(2)}.`,
  ].filter(Boolean);

  const payload = {
    payment_method: pay.payment_method,
    payment_method_title: pay.payment_method_title,
    set_paid: pay.set_paid,
    status: pay.status,
    customer_note: noteParts.join("\n\n"),
    billing,
    shipping: shipTo,
    line_items,
    ...(shipping_lines.length ? { shipping_lines } : {}),
    meta_data: [
      { key: "_glf_order_ref", value: input.ref },
      { key: "_glf_payment_method", value: input.method },
      { key: "_created_via", value: "greenlanefurniture-headless" },
      { key: "_glf_amount_due", value: total.toFixed(2) },
    ],
  };

  const order = await wooMutate<WooOrderResponse>("POST", "/orders", payload);
  return {
    wooOrderId: order.id,
    wooOrderNumber: order.number,
    wooOrderKey: order.order_key,
    amountDue: total,
  };
}

export async function getWooCommerceOrder(orderId: number) {
  return wooFetch<WooOrderDetail>(`/orders/${orderId}`);
}
