import { describe, it, expect } from "vitest";
import {
  SITE_URL,
  LOCALES,
  ROUTES,
  PAGES,
  resolveSiteUrl,
} from "../constants";

describe("constants", () => {
  it("SITE_URL is a valid HTTPS URL", () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
  });

  it("prefers an explicit site URL from env", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://example.com/app",
        VERCEL_URL: "preview.example.vercel.app",
      })
    ).toBe("https://example.com");
  });

  it("uses the current Vercel preview URL when not on production", () => {
    expect(
      resolveSiteUrl({
        VERCEL_ENV: "preview",
        VERCEL_URL: "merge-pdf-git-fix-user.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "mergepdf.example.com",
      })
    ).toBe("https://merge-pdf-git-fix-user.vercel.app");
  });

  it("uses the production deployment URL on Vercel production", () => {
    expect(
      resolveSiteUrl({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "mergepdf.example.com",
        VERCEL_URL: "merge-pdf-tau.vercel.app",
      })
    ).toBe("https://mergepdf.example.com");
  });

  it("LOCALES contains ja and en", () => {
    expect(LOCALES).toContain("ja");
    expect(LOCALES).toContain("en");
  });

  it("ROUTES has merge and pdfToImage", () => {
    expect(ROUTES.merge).toBe("");
    expect(ROUTES.pdfToImage).toBe("pdf-to-image");
  });

  it("PAGES contains all route values", () => {
    expect(PAGES).toContain("");
    expect(PAGES).toContain("pdf-to-image");
  });
});
