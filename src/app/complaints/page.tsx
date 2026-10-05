import { PolicyLayout } from "@/components/policy-layout";
import { policies } from "@/lib/policies";

export const metadata = { title: "Complaints" };

export default function ComplaintsPage() {
  return (
    <PolicyLayout doc={policies.complaints} currentHref="/complaints" />
  );
}
