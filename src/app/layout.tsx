import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, rootSiteMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = rootSiteMetadata;

export const viewport: Viewport = {
  themeColor: "#1a2e1a",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "FurnitureStore",
  name: site.name,
  legalName: site.legalName,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/apple-icon"),
  image: absoluteUrl("/share-image"),
  email: site.email,
  telephone: site.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.line,
    addressLocality: site.address.city,
    postalCode: site.address.postcode,
    addressCountry: "GB",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    opens: "09:00",
    closes: "18:00",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="min-h-full antialiased">
        <JsonLd data={organizationJsonLd} />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
