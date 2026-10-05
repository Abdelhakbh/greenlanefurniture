import { PolicyLayout } from "@/components/policy-layout";
import { buildPageMetadata } from "@/lib/metadata";
import { policies } from "@/lib/policies";

export const metadata = buildPageMetadata({
  title: policies.accessibility.title,
  description: policies.accessibility.description,
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <PolicyLayout doc={policies.accessibility} currentHref="/accessibility" />
  );
}
