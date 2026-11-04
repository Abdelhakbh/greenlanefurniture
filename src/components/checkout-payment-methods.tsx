import Image from "next/image";
import { site } from "@/lib/site";

type Variant = "compact" | "default" | "product";

export function CheckoutPaymentMethods({
  variant = "default",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const alignLeft = variant === "product";
  const centered = variant === "compact";

  return (
    <div className={className}>
      {variant === "default" && (
        <p className="text-sm text-foreground/70">
          Pay by card and digital wallets on our secure checkout:
        </p>
      )}
      <div
        className={`${variant === "default" ? "mt-2" : ""} ${
          centered ? "flex justify-center" : alignLeft ? "" : "flex justify-center"
        }`}
      >
        <Image
          src={site.paymentMethodsImageUrl}
          alt="Cards, Apple Pay, Google Pay, PayPal, and Klarna"
          width={site.paymentMethodsImageWidth}
          height={site.paymentMethodsImageHeight}
          className={`h-auto w-auto max-w-full object-contain object-left ${
            centered ? "max-h-9 object-center" : "max-h-10"
          }`}
        />
      </div>
    </div>
  );
}
