import HomeClient from "./HomeClient";

// Title, description and social cards come from the root layout; this adds the
// homepage's own canonical (the layout can't, or every page would inherit it).
export const metadata = {
  alternates: { canonical: "https://www.ecareerdesign.net/" },
};

export default function Page() {
  return <HomeClient />;
}
