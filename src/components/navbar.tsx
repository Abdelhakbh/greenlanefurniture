"use client";

import Link from "next/link";
import { Menu, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-context";
import { Logo } from "./logo";
import type { StoreCollection } from "@/lib/catalog";
import { isVisibleCollection } from "@/lib/collection-covers";

export function Navbar({ categories }: { categories: StoreCollection[] }) {
  const { count, setOpen } = useCart();
  const navCats = categories.filter(isVisibleCollection).slice(0, 5);

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
      <nav className="mx-auto flex h-[72px] max-w-[1240px] items-center gap-3 px-[clamp(1rem,4vw,3rem)] sm:gap-5">
        <button
          type="button"
          aria-label="Open menu"
          className="-ml-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-foreground/5 lg:hidden"
        >
          <Menu className="size-6" />
        </button>
        <Link href="/" aria-label="Green Lane Furniture home" className="flex shrink-0 items-center">
          <Logo />
        </Link>
        <div className="mx-auto hidden items-center gap-5 lg:flex">
          <Link
            href="/shop"
            className="border-b-2 border-transparent py-1 text-[0.95rem] transition-colors hover:border-amber"
          >
            Shop all
          </Link>
          {navCats.map((c) => (
            <Link
              key={c.handle}
              href={`/category/${c.handle}`}
              className="border-b-2 border-transparent py-1 text-[0.95rem] transition-colors hover:border-amber"
            >
              {c.title}
            </Link>
          ))}
          <Link
            href="/sale"
            className="border-b-2 border-transparent py-1 text-[0.95rem] font-semibold text-lane-green transition-colors hover:border-amber"
          >
            Sale
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 font-medium hover:bg-foreground/5 lg:ml-0"
          aria-label="Open bag"
        >
          <ShoppingBag className="size-5" />
          <span className="hidden sm:inline">Bag</span>
          {count > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-pine text-xs font-bold text-bone">
              {count}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}
