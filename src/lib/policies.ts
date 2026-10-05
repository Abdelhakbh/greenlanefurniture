import { site } from "./site";

export type PolicySection = { heading?: string; paragraphs: string[] };

export type PolicyDoc = {
  title: string;
  description: string;
  updated: string;
  sections: PolicySection[];
};

const updated = "5 October 2026";

export const policies: Record<string, PolicyDoc> = {
  privacy: {
    title: "Privacy policy",
    description: `How ${site.name} collects and uses personal data.`,
    updated,
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          `${site.legalName} (company number ${site.companyNumber}) operates ${site.domain} and our showroom at ${site.address.line}, ${site.address.city} ${site.address.postcode}. We are the data controller for personal data you provide when you shop with us or contact us.`,
          `Questions: ${site.email} or ${site.phone}.`,
        ],
      },
      {
        heading: "What we collect",
        paragraphs: [
          "Contact details (name, email, phone, delivery address), order and payment references, communications you send us, and technical data such as IP address and cookies when you use our website.",
          "We do not sell your personal data to third parties.",
        ],
      },
      {
        heading: "Why we use your data",
        paragraphs: [
          "To process orders and deliveries, provide customer support, prevent fraud, improve our website, and comply with legal obligations (for example tax and accounting records).",
          "Marketing emails are only sent where you have opted in. You can unsubscribe at any time.",
        ],
      },
      {
        heading: "Legal bases (UK GDPR)",
        paragraphs: [
          "Contract (fulfilling your order), legitimate interests (running our business and improving service), consent (where required for marketing cookies or newsletters), and legal obligation.",
        ],
      },
      {
        heading: "Retention & your rights",
        paragraphs: [
          "We keep order records for up to seven years where required for tax and warranty purposes. You may request access, correction, erasure, restriction, or portability of your data, and object to certain processing. Contact us at the details above. You may also complain to the ICO (ico.org.uk).",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of sale",
    description: "Terms that apply when you buy from Green Lane Furniture.",
    updated,
    sections: [
      {
        heading: "Contract",
        paragraphs: [
          `When you place an order through our website, you are making an offer to buy. A contract is formed when we confirm acceptance (usually by email). We sell to consumers in the United Kingdom unless agreed otherwise.`,
        ],
      },
      {
        heading: "Prices & payment",
        paragraphs: [
          "Prices shown include VAT unless stated otherwise. We reserve the right to correct pricing errors before dispatch. Payment is taken securely via our checkout provider. Title to goods passes to you on delivery once payment has been received in full.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "Delivery times are estimates. Large furniture may be delivered by a specialist carrier who will contact you to arrange a suitable date. You must inspect goods on delivery and report visible damage within 48 hours.",
        ],
      },
      {
        heading: "Your statutory rights",
        paragraphs: [
          "Nothing in these terms affects your statutory rights under the Consumer Rights Act 2015, including the right to reject faulty goods within 30 days and the right to repair or replacement within the first six months where applicable.",
        ],
      },
      {
        heading: "Company details",
        paragraphs: [
          `${site.legalName}, registered in England and Wales (${site.companyNumber}). Registered address: ${site.address.line}, ${site.address.city} ${site.address.postcode}.`,
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie policy",
    description: "How we use cookies on greenlanefurniture.co.uk.",
    updated,
    sections: [
      {
        paragraphs: [
          "Cookies are small files stored on your device. We use essential cookies to run the site (for example remembering items in your bag on this device). Analytics or marketing cookies, if used, will only be set with your consent where required.",
          "You can control cookies through your browser settings. Blocking essential cookies may affect checkout or the shopping bag.",
        ],
      },
    ],
  },
  warranty: {
    title: "Product warranty",
    description: "Manufacturer and statutory warranty information.",
    updated,
    sections: [
      {
        paragraphs: [
          "Furniture is covered by your statutory rights under the Consumer Rights Act 2015. Many items also include a manufacturer warranty against defects in materials and workmanship under normal domestic use.",
          "Warranty periods vary by product (typically 12 months unless stated on the product page). Normal wear, misuse, or unauthorised modification is not covered. Contact us with your order number and photos if you believe an item is faulty.",
        ],
      },
    ],
  },
  complaints: {
    title: "Complaints procedure",
    description: "How to raise a concern with us.",
    updated,
    sections: [
      {
        paragraphs: [
          `We aim to resolve issues fairly and quickly. Email ${site.email} or call ${site.phone} with your order reference and a clear description of the problem. We will acknowledge within one working day and aim to respond with a proposed resolution within five working days.`,
          "If you remain dissatisfied after our final response, consumers may use alternative dispute resolution or seek advice from Citizens Advice.",
        ],
      },
    ],
  },
  accessibility: {
    title: "Accessibility statement",
    description: "Our commitment to an accessible website.",
    updated,
    sections: [
      {
        paragraphs: [
          "We want our website to be usable by as many people as possible. We follow WCAG 2.1 guidance where practical, including keyboard navigation, readable contrast, and descriptive link text.",
          `If you have difficulty using any part of the site, contact ${site.email} and we will help you place an order or provide information in an alternative format.`,
        ],
      },
    ],
  },
};

export const policyLinks = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of sale" },
  { href: "/cookies", label: "Cookie policy" },
  { href: "/returns", label: "Returns & refunds" },
  { href: "/shipping", label: "Delivery" },
  { href: "/warranty", label: "Warranty" },
  { href: "/complaints", label: "Complaints" },
  { href: "/accessibility", label: "Accessibility" },
] as const;
