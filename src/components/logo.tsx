import Image from "next/image";
import { site } from "@/lib/site";

type LogoProps = {
  variant?: "header" | "footer" | "cart";
  className?: string;
};

export function Logo({ variant = "header", className = "" }: LogoProps) {
  const heightClass =
    variant === "footer"
      ? "h-11 sm:h-12"
      : variant === "cart"
        ? "h-7 sm:h-8"
        : "h-8 w-auto sm:h-9";

  return (
    <Image
      src={site.logoUrl}
      alt={site.name}
      width={site.logoWidth}
      height={site.logoHeight}
      className={`${heightClass} w-auto max-w-[min(280px,70vw)] object-contain object-left ${className}`.trim()}
      priority={variant === "header"}
    />
  );
}
