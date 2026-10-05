import { PolicyLayout } from "@/components/policy-layout";
import { buildPageMetadata } from "@/lib/metadata";
import { policies } from "@/lib/policies";

export const metadata = buildPageMetadata({
  title: policies.terms.title,
  description: policies.terms.description,
  path: "/terms",
});

export default function TermsPage() {
  return <PolicyLayout doc={policies.terms} currentHref="/terms" />;
}
