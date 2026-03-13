const DEFAULT_SITE_URL = "https://merge-pdf-tau.vercel.app";

type SiteUrlEnv = Record<string, string | undefined>;

function normalizeSiteUrl(value?: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function resolveSiteUrl(env: SiteUrlEnv = process.env): string {
  const explicitSiteUrl =
    normalizeSiteUrl(env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(env.SITE_URL);
  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  const deploymentSiteUrl =
    env.VERCEL_ENV === "production"
      ? normalizeSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL) ??
        normalizeSiteUrl(env.VERCEL_URL)
      : normalizeSiteUrl(env.VERCEL_URL) ??
        normalizeSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL);

  return deploymentSiteUrl ?? DEFAULT_SITE_URL;
}

export const SITE_URL = resolveSiteUrl();

export const LOCALES = ["ja", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const ROUTES = {
  merge: "",
  pdfToImage: "pdf-to-image",
} as const;

export const PAGES = Object.values(ROUTES);
