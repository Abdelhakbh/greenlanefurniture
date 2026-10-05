import { CheckoutView } from "@/components/checkout-view";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Checkout",
  description: "Secure checkout for Green Lane Furniture.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutView />;
}
