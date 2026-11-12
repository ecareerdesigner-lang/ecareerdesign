import { SITE_URL } from "./siteProof";

export const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "eCareer Design",
  description:
    "AI resume builder, ATS resume scan, job tailoring, cover letters, interview coach and performance review writer for job seekers, including federal applicants.",
  url: SITE_URL,
  brand: { "@type": "Organization", name: "eCareer Design" },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Premium (monthly)",
      price: "9.99",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "9.99",
        priceCurrency: "USD",
        billingDuration: "P1M",
        unitCode: "MON",
      },
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "30-Day Pass (one time)",
      price: "15.99",
      priceCurrency: "USD",
      url: `${SITE_URL}/pricing`,
      availability: "https://schema.org/InStock",
    },
  ],
};

export function faqJsonLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
