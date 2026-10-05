import { PolicyLayout } from "@/components/policy-layout";
import { policies } from "@/lib/policies";

export const metadata = { title: "Terms of sale" };

export default function TermsPage() {
  return <PolicyLayout doc={policies.terms} currentHref="/terms" />;
}
