import type { MetadataRoute } from "next";
import { SITE_URL, LOCALES, ROUTES } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of Object.values(ROUTES)) {
    for (const locale of LOCALES) {
      const path = route ? `/${locale}/${route}` : `/${locale}`;
      const url = `${SITE_URL}${path}`;

      const languages: Record<string, string> = {};
      for (const altLocale of LOCALES) {
        const altPath = route
          ? `/${altLocale}/${route}`
          : `/${altLocale}`;
        languages[altLocale] = `${SITE_URL}${altPath}`;
      }

      entries.push({
        url,
        lastModified: new Date(),
        alternates: { languages },
      });
    }
  }

  return entries;
}
