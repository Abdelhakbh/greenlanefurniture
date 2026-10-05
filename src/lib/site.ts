export const site = {
  name: "Green Lane Furniture",
  tagline: "Sofas • Beds • A Brighter Home",
  headline: "Furniture for every home",
  subhead:
    "Quality sofas, beds and home furniture from our Birmingham showroom on Green Lane.",
  domain: "greenlanefurniture.co.uk",
  shopifyStore: "greenlanefurniture.co.uk",
  currency: "GBP",
  locale: "en-GB",
  email: "contact@greenlanefurniture.co.uk",
  phone: "+44 7414 892530",
  legalName: "GREEN LANE FURNITURE LTD",
  companyNumber: "15612430",
  address: {
    line: "510-512 Green Lane",
    city: "Birmingham",
    postcode: "B9 5QH",
    country: "United Kingdom",
  },
  hours: "Monday–Saturday, 9:00am–6:00pm (UK time)",
  deliveryBanner:
    "Free delivery across mainland UK · tracked furniture carriers · typical 3–10 working days",
  googleMapsQuery: "Green+Lane+Furniture+Birmingham+B9+5QH",
} as const;

export const faqs = [
  {
    q: "Where is Green Lane Furniture?",
    a: `Our showroom is at ${site.address.line}, ${site.address.city} ${site.address.postcode}. ${site.legalName} (company number ${site.companyNumber}). Hours: ${site.hours}.`,
  },
  {
    q: "What furniture do you sell?",
    a: "Sofas, beds, dining furniture and home furnishings for UK homes. Visit the showroom or browse the shop online. Call us if you need help with sizes or fabrics.",
  },
  {
    q: "Do you deliver across the UK?",
    a: "Yes. We deliver across mainland Great Britain. Large sofas and beds usually go with a furniture carrier. Remote postcodes may need extra time.",
  },
  {
    q: "How long does delivery take?",
    a: "In-stock orders are typically processed in 1–2 working days. UK delivery is often 3–10 working days depending on the item and your address.",
  },
  {
    q: "What is your return policy?",
    a: "Unused stock furniture can usually be returned within 14 days of delivery. Custom items may be excluded. Faulty goods are covered by the Consumer Rights Act 2015. Email us before returning large items.",
  },
  {
    q: "How can I contact you?",
    a: `Email ${site.email} or call ${site.phone}. We aim to reply within one working day.`,
  },
] as const;
