"use client";

import Image from "next/image";
import { useState } from "react";
import type { StoreImage } from "@/lib/types";

export function ProductGallery({
  images,
  title,
}: {
  images: StoreImage[];
  title: string;
}) {
  const list = images.length ? images : [{ src: "", alt: null }];
  const [active, setActive] = useState(0);
  const current = list[active] ?? list[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-bone-dim sm:aspect-square">
        {current?.src ? (
          <Image
            src={current.src}
            alt={current.alt ?? title}
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-foreground/40">
            No image
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.slice(0, 8).map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={active === i}
              className={`relative size-[72px] shrink-0 overflow-hidden rounded-sm border-2 transition-colors sm:size-20 ${
                active === i
                  ? "border-foreground"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={img.src}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
