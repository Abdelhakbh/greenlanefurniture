import { buildPageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata = buildPageMetadata({
  title: "Contact",
  description: `Contact ${site.name} — ${site.phone}, ${site.email}. Visit our Birmingham showroom at ${site.address.line}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[680px] px-6 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-medium">Contact us</h1>
      <p className="mt-4 text-foreground/75">
        Phone:{" "}
        <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="underline">
          {site.phone}
        </a>
      </p>
      <p className="mt-2 text-foreground/75">
        Email:{" "}
        <a href={`mailto:${site.email}`} className="underline">
          {site.email}
        </a>
      </p>
      <p className="mt-4 text-foreground/75">
        {site.address.line}, {site.address.city} {site.address.postcode}
      </p>
      <p className="mt-2 text-foreground/75">{site.hours}</p>
      <p className="mt-6 text-sm text-foreground/55">
        {site.legalName} · Company number {site.companyNumber}
      </p>
    </div>
  );
}
