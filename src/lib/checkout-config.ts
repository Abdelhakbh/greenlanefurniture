import { site } from "./site";

/** Public payment details (safe for browser). Set in Vercel env. */
export const checkoutConfig = {
  bankAccountName:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? site.legalName,
  bankSortCode:
    process.env.NEXT_PUBLIC_BANK_SORT_CODE ?? "00-00-00",
  bankAccountNumber:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "00000000",
  shippingAmount: 0,
} as const;

export type PaymentMethod = "card" | "bank";

export const PENDING_ORDER_KEY = "green-lane-order-pending";

export type PendingOrder = {
  ref: string;
  method: PaymentMethod;
  total: number;
  subtotal: number;
  shipping: number;
  wooOrderId?: number;
  wooOrderNumber?: string;
  lines: {
    productId: number;
    variantId: number;
    title: string;
    qty: number;
    price: number;
    image: string;
    optionLabel?: string;
  }[];
  billing: Record<string, string>;
  createdAt: string;
};

export function generateOrderRef() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GLF-${y}${m}${day}-${r}`;
}
