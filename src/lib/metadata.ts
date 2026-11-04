import type { Metadata } from "next";
import { site } from "./site";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  `https://${site.domain}`;

/** Brand share image (1200×630) at /share-image. */
export const defaultOgImage =
  process.env.NEXT_PUBLIC_OG_IMAGE_URL ?? "/share-image";

export function absoluteUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${p}`;
}

function ogTitle(pageTitle: string) {
  if (pageTitle === site.name) return site.name;
  return `${pageTitle} · ${site.name}`;
}

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path = "",
  image,
  imageAlt,
  noIndex = false,
}: PageMetaInput): Metadata {
  const desc = description ?? site.subhead;
  const url = absoluteUrl(path || "/");
  const shareImage = image || defaultOgImage;
  const alt = imageAlt ?? title;
  const imagePath = shareImage.split("?")[0].toLowerCase();
  const imageType = imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")
    ? "image/jpeg"
    : imagePath.endsWith(".webp")
      ? "image/webp"
      : imagePath.endsWith(".gif")
        ? "image/gif"
        : imagePath.endsWith(".svg")
          ? "image/svg+xml"
          : "image/png";

  return {
    title,
    description: desc,
    alternates: { canonical: url },
    keywords: [
      "furniture",
      "sofas",
      "beds",
      "Birmingham",
      "Green Lane Furniture",
      "UK delivery",
    ],
    authors: [{ name: site.legalName }],
    creator: site.name,
    publisher: site.name,
    formatDetection: { email: false, telephone: false },
    openGraph: {
      type: "website",
      locale: "en_GB",
      url,
      siteName: site.name,
      title: ogTitle(title),
      description: desc,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt,
          type: imageType,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle(title),
      description: desc,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt,
        },
      ],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

const homeMeta = buildPageMetadata({
  title: site.name,
  description: `${site.subhead} ${site.tagline}. Showroom: ${site.address.line}, ${site.address.city}.`,
  path: "/",
});

export const rootSiteMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.name,
    template: `%s · ${site.name}`,
  },
  description: homeMeta.description,
  keywords: homeMeta.keywords,
  authors: homeMeta.authors,
  creator: homeMeta.creator,
  publisher: homeMeta.publisher,
  alternates: homeMeta.alternates,
  openGraph: homeMeta.openGraph,
  twitter: homeMeta.twitter,
  robots: homeMeta.robots,
  applicationName: site.name,
  category: "shopping",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
};
