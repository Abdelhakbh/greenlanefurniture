"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductReviews } from "@/components/product-reviews";
import { WillItFitPanel } from "@/components/will-it-fit-panel";
import { site } from "@/lib/site";
import type { ProductReview } from "@/lib/woocommerce";

const baseTabs = ["Description", "Details", "Shipping & returns"] as const;
type TabName = (typeof baseTabs)[number] | "Reviews" | "Will it fit?";

export function ProductTabs({
  descriptionHtml,
  productType,
  tags,
  reviews,
  showWillItFit,
}: {
  descriptionHtml: string;
  productType: string;
  tags: string[];
  reviews: ProductReview[];
  showWillItFit?: boolean;
}) {
  const tabs: TabName[] = [
    ...baseTabs,
    ...(showWillItFit ? (["Will it fit?"] as const) : []),
    ...(reviews.length ? (["Reviews"] as const) : []),
  ];
  const [active, setActive] = useState<TabName>("Description");

  useEffect(() => {
    function openFromHash() {
      if (window.location.hash !== "#reviews" || !reviews.length) return;
      setActive("Reviews");
      requestAnimationFrame(() => {
        document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
      });
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [reviews.length]);

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
            className="max-w-[72ch] text-[1.05rem] leading-relaxed text-foreground/80 [&_p]:mb-4 [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-[1.45rem] [&_h3]:font-medium [&_h3]:text-pine-deep [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-foreground/15 [&_th]:bg-bone-dim [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_td]:border [&_td]:border-foreground/15 [&_td]:px-3 [&_td]:py-2 [&_details]:my-2 [&_details]:overflow-hidden [&_details]:rounded-md [&_details]:border [&_details]:border-foreground/15 [&_summary]:cursor-pointer [&_summary]:px-4 [&_summary]:py-3 [&_summary]:font-medium [&_summary]:text-foreground [&_details_p]:mb-0 [&_details_p]:px-4 [&_details_p]:pb-3"
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
        {active === "Will it fit?" && showWillItFit && <WillItFitPanel />}
        {active === "Reviews" && <ProductReviews reviews={reviews} />}
      </div>
    </div>
  );
}
