import { PolicyLayout } from "@/components/policy-layout";
import { site } from "@/lib/site";

export const metadata = { title: "Delivery" };

const doc = {
  title: "Delivery information",
  description: "UK delivery for sofas, beds and furniture from Green Lane.",
  updated: "5 October 2026",
  sections: [
    {
      heading: "Where we deliver",
      paragraphs: [
        "We deliver across mainland Great Britain (England, Scotland and Wales). Northern Ireland, Scottish Highlands, islands and remote postcodes may incur extra time or cost — we will confirm before dispatch.",
      ],
    },
    {
      heading: "Carriers & lead times",
      paragraphs: [
        "In-stock orders are usually processed within 1–2 working days. Delivery typically takes 3–10 working days depending on item size and your postcode. Sofas, corner groups and beds often ship on a two-person furniture service with a pre-arranged date.",
        site.deliveryBanner,
      ],
    },
    {
      heading: "On the day",
      paragraphs: [
        "Please ensure access is clear (stairs, doorways, lifts). Our carriers may deliver to the room of choice where agreed. You must inspect items on delivery and note any visible damage on the carrier’s paperwork and contact us within 48 hours.",
      ],
    },
    {
      heading: "Questions",
      paragraphs: [
        `Contact ${site.email} or ${site.phone} before ordering if you have tight access or need a specific delivery window.`,
      ],
    },
  ],
};

export default function ShippingPage() {
  return <PolicyLayout doc={doc} currentHref="/shipping" />;
}
