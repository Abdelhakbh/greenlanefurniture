"use client";

import { useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

const tabs = ["Description", "Details", "Shipping & returns"] as const;

export function ProductTabs({
  descriptionHtml,
  productType,
  tags,
}: {
  descriptionHtml: string;
  productType: string;
  tags: string[];
}) {
  const [active, setActive] = useState<(typeof tabs)[number]>("Description");

  return (
    <div className="border-t border-foreground/10 pt-10">
      <div
        role="tablist"
        aria-label="Product information"
        className="flex flex-wrap gap-6 border-b border-foreground/10"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              active === tab
                ? "border-foreground text-foreground"
                : "border-transparent text-foreground/45 hover:text-foreground/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="py-8">
        {active === "Description" && descriptionHtml && (
          <div
            className="prose prose-neutral max-w-[72ch] prose-p:leading-relaxed prose-headings:font-display [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        )}
        {active === "Description" && !descriptionHtml && (
          <p className="text-foreground/60">No description available.</p>
        )}
        {active === "Details" && (
          <dl className="max-w-lg space-y-3 text-sm">
            {productType && (
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="text-foreground/55">Category</dt>
                <dd>{productType}</dd>
              </div>
            )}
            {tags.length > 0 && (
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <dt className="text-foreground/55">Tags</dt>
                <dd>{tags.join(", ")}</dd>
              </div>
            )}
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <dt className="text-foreground/55">VAT</dt>
              <dd>All prices include VAT</dd>
            </div>
          </dl>
        )}
        {active === "Shipping & returns" && (
          <div className="max-w-[68ch] space-y-4 text-[1.05rem] leading-relaxed text-foreground/75">
            <p>{site.deliveryBanner}</p>
            <p>
              Large items are delivered by a two-person furniture service where
              possible. See our{" "}
              <Link href="/shipping" className="underline">
                delivery page
              </Link>{" "}
              for full details.
            </p>
            <p>
              Unused stock items can usually be returned within 14 days. Read{" "}
              <Link href="/returns" className="underline">
                returns & refunds
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
