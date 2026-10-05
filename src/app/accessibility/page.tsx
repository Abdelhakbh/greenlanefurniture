import { PolicyLayout } from "@/components/policy-layout";
import { policies } from "@/lib/policies";

export const metadata = { title: "Accessibility" };

export default function AccessibilityPage() {
  return (
    <PolicyLayout doc={policies.accessibility} currentHref="/accessibility" />
  );
}
