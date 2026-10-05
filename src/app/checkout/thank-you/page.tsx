import { Suspense } from "react";
import { ThankYouView } from "@/components/thank-you-view";

export const metadata = { title: "Thank you" };

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading…</div>}>
      <ThankYouView />
    </Suspense>
  );
}
