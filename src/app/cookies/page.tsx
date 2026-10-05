import { PolicyLayout } from "@/components/policy-layout";
import { buildPageMetadata } from "@/lib/metadata";
import { policies } from "@/lib/policies";

export const metadata = buildPageMetadata({
  title: policies.cookies.title,
  description: policies.cookies.description,
  path: "/cookies",
});

export default function CookiesPage() {
  return <PolicyLayout doc={policies.cookies} currentHref="/cookies" />;
}
