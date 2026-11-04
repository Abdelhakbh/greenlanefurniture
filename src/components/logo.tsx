import { site } from "@/lib/site";

type LogoProps = {
  variant?: "header" | "footer";
  className?: string;
};

export function Logo({ variant = "header", className = "" }: LogoProps) {
  const titleClass =
    variant === "footer"
      ? "font-display text-xl font-medium text-bone"
      : "font-display text-[0.95rem] font-semibold tracking-[-0.02em] text-pine-deep sm:text-[1.15rem]";

  return (
    <span className={`leading-tight ${className}`.trim()}>
      <span className={titleClass}>{site.name}</span>
    </span>
  );
}
