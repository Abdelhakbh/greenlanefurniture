import { site } from "@/lib/site";

export const metadata = { title: "Delivery" };

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-[680px] px-6 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-medium">Delivery information</h1>
      <p className="mt-4 text-foreground/75">
        We deliver across mainland Great Britain. Large sofas and beds usually
        go with a furniture carrier. Remote postcodes may need extra time.
      </p>
      <p className="mt-4 text-foreground/75">
        In-stock orders are typically processed in 1–2 working days. UK delivery
        is often 3–10 working days depending on the item and your address.
      </p>
      <p className="mt-4 text-foreground/75">
        Questions? Email{" "}
        <a href={`mailto:${site.email}`} className="underline">
          {site.email}
        </a>{" "}
        or call {site.phone}.
      </p>
    </div>
  );
}
