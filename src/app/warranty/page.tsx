import { PolicyLayout } from "@/components/policy-layout";
import { policies } from "@/lib/policies";

export const metadata = { title: "Warranty" };

export default function WarrantyPage() {
  return <PolicyLayout doc={policies.warranty} currentHref="/warranty" />;
}
