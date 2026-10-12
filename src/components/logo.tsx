export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <rect width="64" height="64" rx="14" fill="#2d5a27" />
      <path
        d="M7 56c9-5 17-4 26-7s15-5 24-5"
        fill="none"
        stroke="#e8c547"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <g fill="#f7f5f0">
        <rect x="17" y="14" width="30" height="13" rx="4" />
        <rect x="11" y="21" width="9" height="16" rx="3.5" />
        <rect x="44" y="21" width="9" height="16" rx="3.5" />
        <rect x="18" y="26" width="28" height="9" rx="2.5" />
        <rect x="14.5" y="37" width="3" height="4" rx="1" />
        <rect x="46.5" y="37" width="3" height="4" rx="1" />
      </g>
      <path
        d="M20 26.5h24M32 27v7"
        stroke="#2d5a27"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.45rem] font-semibold tracking-[-0.02em] text-pine-deep">
          Green Lane
        </span>
        <span className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-lane-green">
          Furniture
        </span>
      </span>
    </span>
  );
}
