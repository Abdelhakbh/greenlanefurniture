"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import type { ProductReview } from "@/lib/woocommerce";

const PAGE_SIZE = 10;

function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-4 ${
            star <= filled ? "fill-amber text-amber" : "text-foreground/20"
          }`}
        />
      ))}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReviewStars({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  if (!count) return null;
  return (
    <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm">
      <Stars value={rating} />
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-foreground/55">{`${count} review${count === 1 ? "" : "s"}`}</span>
    </a>
  );
}

export function ProductReviews({
  reviews,
}: {
  reviews: ProductReview[];
}) {
  const [page, setPage] = useState(0);
  if (!reviews.length) return null;
  const pages = Math.ceil(reviews.length / PAGE_SIZE);
  const current = Math.min(page, pages - 1);
  const visible = reviews.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  function goTo(next: number) {
    setPage(next);
    document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="reviews">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-medium">
          Reviews
        </h2>
        <p className="flex items-center gap-2 text-sm">
          <Stars value={average} />
          <span className="font-semibold">{average.toFixed(1)}</span>
          <span className="text-foreground/55">from {reviews.length}</span>
        </p>
      </div>
      <ul className="mt-6 divide-y divide-foreground/10">
        {visible.map((review) => (
          <li key={review.id} className="py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={review.rating} />
              <span className="sr-only">{review.rating} out of 5</span>
              <span className="font-medium">{review.author}</span>
              {formatDate(review.date) && (
                <time className="text-sm text-foreground/45" dateTime={review.date}>
                  {formatDate(review.date)}
                </time>
              )}
            </div>
            {review.title && (
              <h3 className="mt-2 font-medium text-foreground">{review.title}</h3>
            )}
            {review.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={review.image}
                alt=""
                className="mt-3 max-h-40 rounded-md border border-foreground/10 object-cover"
                loading="lazy"
              />
            )}
            {review.body && review.body !== review.title && (
              <p className="mt-1 max-w-[68ch] leading-relaxed text-foreground/75">
                {review.body}
              </p>
            )}
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav aria-label="Review pages" className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            className="rounded-md border border-foreground/15 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: pages }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-current={index === current ? "page" : undefined}
              onClick={() => goTo(index)}
              className={`min-w-9 rounded-md border px-3 py-2 text-sm font-medium ${
                index === current
                  ? "border-pine-deep bg-pine-deep text-white"
                  : "border-foreground/15 text-foreground"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === pages - 1}
            className="rounded-md border border-foreground/15 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
