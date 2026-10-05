"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FaqList({
  items,
}: {
  items: readonly { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y rounded-lg border bg-white">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            {item.q}
            <ChevronDown
              className={`size-5 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <p className="px-5 pb-4 text-sm leading-relaxed text-foreground/75">
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
