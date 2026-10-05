import { PolicyLayout } from "@/components/policy-layout";
import { buildPageMetadata } from "@/lib/metadata";
import { policies } from "@/lib/policies";

export const metadata = buildPageMetadata({
  title: policies.warranty.title,
  description: policies.warranty.description,
  path: "/warranty",
});

export default function WarrantyPage() {
  return <PolicyLayout doc={policies.warranty} currentHref="/warranty" />;
}
