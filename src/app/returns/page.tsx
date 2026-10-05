import { site } from "@/lib/site";

export const metadata = { title: "Returns" };

export default function ReturnsPage() {
  return (
    <div className="mx-auto max-w-[680px] px-6 py-12 leading-relaxed">
      <h1 className="font-display text-3xl font-medium">Returns &amp; refunds</h1>
      <p className="mt-4 text-foreground/75">
        Unused stock furniture can usually be returned within 14 days of
        delivery. Custom items may be excluded. Faulty goods are covered by the
        Consumer Rights Act 2015.
      </p>
      <p className="mt-4 text-foreground/75">
        Email{" "}
        <a href={`mailto:${site.email}`} className="underline">
          {site.email}
        </a>{" "}
        before returning large items so we can arrange collection or drop-off
        instructions.
      </p>
    </div>
  );
}
