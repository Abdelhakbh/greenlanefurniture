import { PolicyLayout } from "@/components/policy-layout";
import { buildPageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Returns & refunds",
  description: "How to return furniture bought from Green Lane Furniture.",
  path: "/returns",
});

const doc = {
  title: "Returns & refunds",
  description: "How to return furniture bought from Green Lane Furniture.",
  updated: "5 October 2026",
  sections: [
    {
      heading: "Cooling-off period (online orders)",
      paragraphs: [
        "If you bought online without visiting our showroom, you usually have 14 days from delivery to change your mind under the Consumer Contracts Regulations 2013. The item must be unused and in resalable condition with original packaging where reasonable.",
        "Custom-made, cut-to-size or clearly personalised items may be excluded. Mattresses and hygiene-sensitive goods cannot be returned once opened unless faulty.",
      ],
    },
    {
      heading: "How to start a return",
      paragraphs: [
        `Email ${site.email} or call ${site.phone} with your order number, reason for return, and photos if relevant. Do not return large furniture without our confirmation — we will arrange collection or provide return instructions.`,
        "You are responsible for return carriage unless the goods are faulty or we delivered the wrong item.",
      ],
    },
    {
      heading: "Faulty or damaged goods",
      paragraphs: [
        "Under the Consumer Rights Act 2015, goods must be as described, fit for purpose and of satisfactory quality. Report transit damage within 48 hours of delivery with photos. We will repair, replace or refund where you are entitled to a remedy.",
      ],
    },
    {
      heading: "Refunds",
      paragraphs: [
        "Approved refunds are processed to the original payment method within 14 days of receiving the returned goods or proof of return. Delivery charges may be non-refundable except where goods are faulty or we cancelled the order.",
      ],
    },
    {
      heading: "Showroom purchases",
      paragraphs: [
        "Items bought in person at our Birmingham showroom are subject to the same statutory rights. Ask our team for a receipt and keep delivery documentation for warranty claims.",
      ],
    },
  ],
};

export default function ReturnsPage() {
  return <PolicyLayout doc={doc} currentHref="/returns" />;
}
