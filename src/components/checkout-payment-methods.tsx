import Image from "next/image";

type Variant = "compact" | "default" | "product";

const paymentIcons = [
  {
    id: "cards",
    label: "Cards",
    src: "/card-brands.svg",
    width: 3234,
    height: 469,
    imgClass: "h-[22px] w-auto max-w-[200px]",
  },
  {
    id: "apple",
    label: "Apple Pay",
    src: "/payment/apple-pay.svg",
    width: 48,
    height: 32,
    imgClass: "h-8 w-auto",
  },
  {
    id: "google",
    label: "Google Pay",
    src: "/payment/google-pay.svg",
    width: 48,
    height: 32,
    imgClass: "h-8 w-auto",
  },
  {
    id: "paypal",
    label: "PayPal",
    src: "/payment/paypal.svg",
    width: 48,
    height: 32,
    imgClass: "h-8 w-auto",
  },
  {
    id: "klarna",
    label: "Klarna",
    src: "/payment/klarna.svg",
    width: 48,
    height: 32,
    imgClass: "h-8 w-auto",
  },
] as const;

export function CheckoutPaymentMethods({
  variant = "default",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const iconsOnly = variant === "compact" || variant === "product";
  const alignLeft = variant === "product";

  return (
    <div className={className}>
      {!iconsOnly && (
        <p className="text-sm text-foreground/70">
          Pay by card and digital wallets on our secure checkout:
        </p>
      )}
      <ul
        className={`flex flex-wrap items-center gap-2 ${
          iconsOnly ? (variant === "product" ? "mt-0" : "mt-0 justify-center") : "mt-2 justify-center gap-2"
        } ${alignLeft ? "justify-start" : ""}`}
        aria-label="Accepted payment methods"
      >
        {paymentIcons.map(({ id, label, src, width, height, imgClass }) => (
          <li key={id}>
            <span
              className="inline-flex items-center rounded-md border border-foreground/10 bg-white/90 px-2 py-1.5 shadow-sm"
              title={label}
            >
              <Image
                src={src}
                alt={label}
                width={width}
                height={height}
                className={imgClass}
                unoptimized={src.endsWith(".svg")}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
