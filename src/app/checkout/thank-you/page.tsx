import { Suspense } from "react";
import { ThankYouView } from "@/components/thank-you-view";
import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Thank you",
  description: "Order confirmation and payment instructions.",
  path: "/checkout/thank-you",
  noIndex: true,
});

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading…</div>}>
      <ThankYouView />
    </Suspense>
  );
}
