"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { StoreImage } from "@/lib/types";

export const VARIANT_IMAGE_EVENT = "product-variant-image";

export function ProductGallery({
  images,
  title,
}: {
  images: StoreImage[];
  title: string;
}) {
  const [extra, setExtra] = useState<StoreImage | null>(null);
  const base = images.length ? images : [{ src: "", alt: null }];
  const list = extra ? [extra, ...base] : base;
  const [active, setActive] = useState(0);
  const current = list[active] ?? list[0];

  useEffect(() => {
    function onVariantImage(e: Event) {
      const src = (e as CustomEvent<string | null>).detail;
      if (!src) return;
      const idx = images.findIndex((img) => img.src === src);
      if (idx >= 0) {
        setExtra(null);
        setActive(idx);
      } else {
        setExtra({ src, alt: title });
        setActive(0);
      }
    }
    window.addEventListener(VARIANT_IMAGE_EVENT, onVariantImage);
    return () => window.removeEventListener(VARIANT_IMAGE_EVENT, onVariantImage);
  }, [images, title]);

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
          {list.map((img, i) => (
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
