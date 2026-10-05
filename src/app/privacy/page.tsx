import { PolicyLayout } from "@/components/policy-layout";
import { policies } from "@/lib/policies";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return <PolicyLayout doc={policies.privacy} currentHref="/privacy" />;
}
