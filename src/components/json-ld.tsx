import { SITE_URL } from "@/lib/constants";

interface JsonLdProps {
  name: string;
  description: string;
  locale: string;
  path?: string;
}

export function JsonLd({ name, description, locale, path = "" }: JsonLdProps) {
  const url = path
    ? `${SITE_URL}/${locale}/${path}`
    : `${SITE_URL}/${locale}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    inLanguage: locale,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
