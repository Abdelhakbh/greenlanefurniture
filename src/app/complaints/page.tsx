import { PolicyLayout } from "@/components/policy-layout";
import { buildPageMetadata } from "@/lib/metadata";
import { policies } from "@/lib/policies";

export const metadata = buildPageMetadata({
  title: policies.complaints.title,
  description: policies.complaints.description,
  path: "/complaints",
});

export default function ComplaintsPage() {
  return (
    <PolicyLayout doc={policies.complaints} currentHref="/complaints" />
  );
}
