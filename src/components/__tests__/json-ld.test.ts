import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { JsonLd } from "../json-ld";

describe("JsonLd", () => {
  it("renders a script tag with application/ld+json type", () => {
    const html = renderToStaticMarkup(
      createElement(JsonLd, {
        name: "PDF Merger",
        description: "Merge PDFs",
        locale: "en",
      })
    );
    expect(html).toContain('type="application/ld+json"');
  });

  it("includes WebApplication schema", () => {
    const html = renderToStaticMarkup(
      createElement(JsonLd, {
        name: "PDF Merger",
        description: "Merge PDFs",
        locale: "en",
      })
    );
    const jsonMatch = html.match(
      /<script[^>]*>([\s\S]*?)<\/script[^>]*>/i
    );
    expect(jsonMatch).not.toBeNull();
    const data = JSON.parse(jsonMatch![1]);
    expect(data["@type"]).toBe("WebApplication");
    expect(data.name).toBe("PDF Merger");
    expect(data.description).toBe("Merge PDFs");
    expect(data.url).toBe("https://merge-pdf-tau.vercel.app/en");
  });

  it("includes path in URL when provided", () => {
    const html = renderToStaticMarkup(
      createElement(JsonLd, {
        name: "PDF to Image",
        description: "Convert PDF",
        locale: "ja",
        path: "pdf-to-image",
      })
    );
    const jsonMatch = html.match(
      /<script[^>]*>([\s\S]*?)<\/script[^>]*>/i
    );
    const data = JSON.parse(jsonMatch![1]);
    expect(data.url).toBe(
      "https://merge-pdf-tau.vercel.app/ja/pdf-to-image"
    );
  });

  it("includes free offer", () => {
    const html = renderToStaticMarkup(
      createElement(JsonLd, {
        name: "Test",
        description: "Test",
        locale: "en",
      })
    );
    const jsonMatch = html.match(
      /<script[^>]*>([\s\S]*?)<\/script[^>]*>/i
    );
    const data = JSON.parse(jsonMatch![1]);
    expect(data.offers.price).toBe("0");
  });
});
