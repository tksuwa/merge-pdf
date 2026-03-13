import { describe, it, expect } from "vitest";
import robots from "../robots";

describe("robots", () => {
  it("allows all user agents", () => {
    const result = robots();
    expect(result.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userAgent: "*",
          allow: "/",
        }),
      ])
    );
  });

  it("includes sitemap URL", () => {
    const result = robots();
    expect(result.sitemap).toBe(
      "https://merge-pdf-tau.vercel.app/sitemap.xml"
    );
  });
});
