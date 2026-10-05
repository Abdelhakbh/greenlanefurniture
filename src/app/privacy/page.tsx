import { PolicyLayout } from "@/components/policy-layout";
import { buildPageMetadata } from "@/lib/metadata";
import { policies } from "@/lib/policies";

export const metadata = buildPageMetadata({
  title: policies.privacy.title,
  description: policies.privacy.description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return <PolicyLayout doc={policies.privacy} currentHref="/privacy" />;
}
