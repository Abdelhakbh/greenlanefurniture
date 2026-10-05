import { site } from "./site";

export const checkoutConfig = {
  shippingAmount: 0,
  /** Courtesy discount when paying by bank transfer during card processor downtime. */
  bankTransferDiscountPercent: 8,
  bankAccountName:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? site.legalName,
  bankSortCode:
    process.env.NEXT_PUBLIC_BANK_SORT_CODE ?? "00-00-00",
  bankAccountNumber:
    process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "00000000",
} as const;

export type PaymentMethod = "bank";

export const PENDING_ORDER_KEY = "green-lane-order-pending";

export const CARD_UNAVAILABLE_MESSAGE =
  "Card payments aren't available right now. Please complete your order with bank transfer — your 8% discount is applied automatically.";

export type PendingOrder = {
  ref: string;
  method: PaymentMethod;
  total: number;
  subtotal: number;
  shipping: number;
  discountAmount: number;
  discountPercent: number;
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

export function computeBankTransferTotals(subtotal: number, shipping: number) {
  const beforeDiscount = subtotal + shipping;
  const discountAmount =
    Math.round(
      beforeDiscount *
        (checkoutConfig.bankTransferDiscountPercent / 100) *
        100,
    ) / 100;
  const total = Math.round((beforeDiscount - discountAmount) * 100) / 100;
  return { beforeDiscount, discountAmount, total };
}
