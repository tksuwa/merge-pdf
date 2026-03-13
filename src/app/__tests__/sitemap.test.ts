import { describe, it, expect } from "vitest";
import sitemap from "../sitemap";

describe("sitemap", () => {
  it("generates entries for all locale x route combinations", () => {
    const entries = sitemap();
    // 2 locales x 2 routes = 4 entries
    expect(entries).toHaveLength(4);
  });

  it("includes correct URLs", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain("https://merge-pdf-tau.vercel.app/ja");
    expect(urls).toContain("https://merge-pdf-tau.vercel.app/en");
    expect(urls).toContain(
      "https://merge-pdf-tau.vercel.app/ja/pdf-to-image"
    );
    expect(urls).toContain(
      "https://merge-pdf-tau.vercel.app/en/pdf-to-image"
    );
  });

  it("includes hreflang alternates for each entry", () => {
    const entries = sitemap();
    for (const entry of entries) {
      expect(entry.alternates?.languages).toHaveProperty("ja");
      expect(entry.alternates?.languages).toHaveProperty("en");
    }
  });

  it("alternate URLs point to correct locale variants", () => {
    const entries = sitemap();
    const jaEntry = entries.find(
      (e) => e.url === "https://merge-pdf-tau.vercel.app/ja"
    );
    expect(jaEntry?.alternates?.languages?.ja).toBe(
      "https://merge-pdf-tau.vercel.app/ja"
    );
    expect(jaEntry?.alternates?.languages?.en).toBe(
      "https://merge-pdf-tau.vercel.app/en"
    );
  });
});
