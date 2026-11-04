import { site } from "@/lib/site";

type LogoProps = {
  variant?: "header" | "footer" | "cart";
  className?: string;
};

export function Logo({ variant = "header", className = "" }: LogoProps) {
  const isFooter = variant === "footer";
  const isCart = variant === "cart";

  const titleClass = isFooter
    ? "font-display text-xl font-medium text-bone"
    : isCart
      ? "font-display text-base font-semibold tracking-[-0.02em] text-pine-deep"
      : "font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-pine-deep sm:text-[1.15rem]";

  const taglineClass = isFooter
    ? "mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-bone/80"
    : isCart
      ? "mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-lane-green sm:text-[0.7rem]"
      : "mt-0.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-lane-green sm:text-xs";

  return (
    <span className={`flex flex-col leading-tight ${className}`.trim()}>
      <span className={titleClass}>{site.name}</span>
      <span className={taglineClass}>{site.tagline}</span>
    </span>
  );
}
