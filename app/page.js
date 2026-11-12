import HomeClient from "./HomeClient";
import JsonLd from "../components/JsonLd";
import { FAQS } from "../components/landing/faqData";
import { productJsonLd, faqJsonLd } from "../lib/structuredData";

// Title, description and social cards come from the root layout; this adds the
// homepage's own canonical (the layout can't, or every page would inherit it).
export const metadata = {
  alternates: { canonical: "https://www.ecareerdesign.net/" },
};

export default function Page() {
  return (
    <>
      <JsonLd data={[productJsonLd, faqJsonLd(FAQS)]} />
      <HomeClient />
    </>
  );
}
