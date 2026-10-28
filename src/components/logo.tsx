import { site } from "@/lib/site";

export function Logo() {
  return (
    <span className="flex flex-col leading-tight">
      <span className="font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-pine-deep sm:text-[1.15rem]">
        Green Lane Furniture
      </span>
      <span className="mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-lane-green sm:text-xs">
        by {site.logoByline}
      </span>
    </span>
  );
}
