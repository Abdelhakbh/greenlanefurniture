import { FaqList } from "@/components/faq-list";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata } from "@/lib/metadata";
import { faqs, site } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "FAQ",
  description: `Delivery, returns and showroom FAQs for ${site.name}, Birmingham.`,
  path: "/faq",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-[680px] px-6 py-12">
      <JsonLd data={faqJsonLd} />
      <h1 className="font-display text-3xl font-medium">FAQ</h1>
      <div className="mt-8">
        <FaqList items={faqs} />
      </div>
    </div>
  );
}
