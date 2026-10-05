import { FaqList } from "@/components/faq-list";
import { faqs } from "@/lib/site";

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-[680px] px-6 py-12">
      <h1 className="font-display text-3xl font-medium">FAQ</h1>
      <div className="mt-8">
        <FaqList items={faqs} />
      </div>
    </div>
  );
}
