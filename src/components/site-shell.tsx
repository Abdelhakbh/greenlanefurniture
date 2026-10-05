import { site } from "@/lib/site";
import { getCollections } from "@/lib/catalog";
import { CartProvider } from "./cart-context";
import { CartSheet } from "./cart-sheet";
import { Footer } from "./footer";
import { Navbar } from "./navbar";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const categories = await getCollections();

  return (
    <CartProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <div className="bg-amber px-4 py-1.5 text-center text-sm font-medium text-amber-ink">
        {site.deliveryBanner}
      </div>
      <Navbar categories={categories} />
      <main id="main">{children}</main>
      <Footer />
      <CartSheet />
    </CartProvider>
  );
}
