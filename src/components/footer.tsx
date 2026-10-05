import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-10 bg-pine-deep text-bone">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-[clamp(1rem,4vw,3rem)] py-[clamp(2.5rem,5vw,3.75rem)] sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-medium">Green Lane Furniture</p>
          <p className="mt-4 max-w-[36ch] text-sm opacity-80">
            {site.subhead}
          </p>
          <address className="not-italic mt-5 text-sm leading-relaxed opacity-80">
            <strong className="font-medium opacity-100">{site.legalName}</strong>
            <br />
            Company no. {site.companyNumber}
            <br />
            {site.address.line}
            <br />
            {site.address.city} {site.address.postcode}
          </address>
          <p className="mt-5 text-sm opacity-80">
            <a
              href={`mailto:${site.email}`}
              className="underline underline-offset-2 hover:text-amber"
            >
              {site.email}
            </a>
            <br />
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              className="underline underline-offset-2 hover:text-amber"
            >
              {site.phone}
            </a>
            <br />
            {site.hours}
          </p>
        </div>
        <nav aria-label="Shop">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
            Shop
          </h4>
          <Link href="/shop" className="block py-1 opacity-85 hover:text-amber">
            All products
          </Link>
          <Link href="/sale" className="block py-1 opacity-85 hover:text-amber">
            Sale
          </Link>
        </nav>
        <nav aria-label="Customer service">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
            Customer service
          </h4>
          <Link href="/shipping" className="block py-1 opacity-85 hover:text-amber">
            Delivery
          </Link>
          <Link href="/returns" className="block py-1 opacity-85 hover:text-amber">
            Returns
          </Link>
          <Link href="/faq" className="block py-1 opacity-85 hover:text-amber">
            FAQ
          </Link>
          <Link href="/contact" className="block py-1 opacity-85 hover:text-amber">
            Contact
          </Link>
        </nav>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] opacity-60">
            Visit us
          </h4>
          <p className="text-sm opacity-80">
            Birmingham showroom — walk in Monday–Saturday.
          </p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${site.googleMapsQuery}`}
            className="mt-3 inline-block text-sm underline underline-offset-2 hover:text-amber"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Google Maps
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-[clamp(1rem,4vw,3rem)] py-5 text-xs opacity-70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name} · All prices incl. VAT
          </p>
        </div>
      </div>
    </footer>
  );
}
