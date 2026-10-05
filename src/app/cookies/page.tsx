import { PolicyLayout } from "@/components/policy-layout";
import { policies } from "@/lib/policies";

export const metadata = { title: "Cookie policy" };

export default function CookiesPage() {
  return <PolicyLayout doc={policies.cookies} currentHref="/cookies" />;
}
