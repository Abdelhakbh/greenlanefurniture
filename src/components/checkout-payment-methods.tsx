import { CreditCard } from "lucide-react";

type Variant = "compact" | "default";

const methods = [
  {
    id: "cards",
    label: "Cards",
    icon: (
      <CreditCard className="size-4" strokeWidth={1.75} aria-hidden />
    ),
  },
  {
    id: "apple",
    label: "Apple Pay",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="currentColor"
          d="M16.365 1.43c0 1.14-.413 2.219-1.233 3.135-.908 1.033-2.387 1.832-3.832 1.724-.143-1.09.402-2.267 1.177-3.193.908-1.06 2.494-1.856 3.888-1.666zm1.12 4.456c-2.145-.125-3.977 1.215-4.997 1.215-1.02 0-2.598-1.17-4.275-1.138-2.2.033-4.23 1.28-5.365 3.255-2.288 3.967-.585 9.845 1.642 13.07 1.09 1.577 2.387 3.345 4.09 3.28 1.642-.066 2.26-1.06 4.242-1.06 1.983 0 2.535 1.06 4.275 1.027 1.77-.033 2.892-1.608 3.98-3.19 1.255-1.838 1.773-3.623 1.805-3.722-.04-.02-3.47-1.332-3.507-5.287-.033-3.31 2.7-4.89 2.825-4.99-1.54-2.25-3.93-2.55-4.785-2.592z"
        />
      </svg>
    ),
  },
  {
    id: "google",
    label: "Google Pay",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="#4285F4"
          d="M12 10.2v3.9h5.4c-.2 1.2-1.6 3.5-5.4 3.5-3.3 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 2.8 14.6 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.9 0-.7-.1-1.2-.2-1.9H12z"
        />
      </svg>
    ),
  },
  {
    id: "paypal",
    label: "PayPal",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="currentColor"
          d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72A.772.772 0 0 1 5.7 3h6.5c2.15 0 3.805.58 4.918 1.724 1.002 1.03 1.384 2.46 1.137 4.252-.302 2.14-1.32 3.827-2.936 5.015-1.433 1.06-3.28 1.594-5.49 1.594h-1.3l-.53 3.35a.641.641 0 0 1-.633.54l.23-.438zm.875-3.35h1.05c1.55 0 2.78-.42 3.65-1.25.78-.74 1.28-1.78 1.48-3.09.17-1.15.05-2.05-.35-2.68-.45-.7-1.22-1.05-2.3-1.05H9.05l-1.1 7.07z"
        />
      </svg>
    ),
  },
  {
    id: "klarna",
    label: "Klarna",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="currentColor"
          d="M4.5 4h2.8v16H4.5V4zm5.2 0h2.6c3.4 0 5.5 1.9 5.5 5.1 0 2.5-1.2 4.2-3.2 4.9l3.5 6H15l-3.1-5.5h-1v5.5H9.7V4zm2.6 2.2v4.6h.8c1.6 0 2.5-.9 2.5-2.4 0-1.4-.9-2.2-2.5-2.2h-.8z"
        />
      </svg>
    ),
  },
] as const;

export function CheckoutPaymentMethods({
  variant = "default",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const compact = variant === "compact";

  return (
    <div className={className}>
      <p
        className={
          compact
            ? "text-center text-xs text-foreground/60"
            : "text-sm text-foreground/70"
        }
      >
        {compact
          ? "Secure card checkout — pay with:"
          : "Pay by card and digital wallets on our secure checkout:"}
      </p>
      <ul
        className={`mt-2 flex flex-wrap items-center justify-center gap-1.5 ${compact ? "" : "gap-2"}`}
        aria-label="Accepted payment methods"
      >
        {methods.map(({ id, label, icon }) => (
          <li key={id}>
            <span
              className={`inline-flex items-center gap-1 rounded-md border border-foreground/12 bg-white/80 text-foreground/85 ${
                compact ? "px-2 py-1 text-[10px] font-medium" : "px-2.5 py-1.5 text-xs font-medium"
              }`}
              title={label}
            >
              {icon}
              <span>{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
