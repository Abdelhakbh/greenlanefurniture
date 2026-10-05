import Link from "next/link";
import type { PolicyDoc } from "@/lib/policies";
import { policyLinks } from "@/lib/policies";

export function PolicyLayout({
  doc,
  currentHref,
}: {
  doc: PolicyDoc;
  currentHref: string;
}) {
  return (
    <div className="mx-auto max-w-[1240px] px-[clamp(1rem,4vw,3rem)] py-12">
      <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Policies" className="text-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Legal & policies
          </p>
          <ul className="space-y-1">
            {policyLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={
                    l.href === currentHref
                      ? "font-medium text-pine"
                      : "text-foreground/70 hover:text-foreground"
                  }
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <article className="max-w-[68ch]">
          <h1 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-medium">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-foreground/55">
            Last updated {doc.updated}
          </p>
          <div className="mt-8 space-y-8 text-[1.05rem] leading-relaxed text-foreground/80">
            {doc.sections.map((s, i) => (
              <section key={i}>
                {s.heading && (
                  <h2 className="mb-3 font-display text-xl font-medium text-foreground">
                    {s.heading}
                  </h2>
                )}
                {s.paragraphs.map((p, j) => (
                  <p key={j} className={j > 0 ? "mt-3" : ""}>
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
