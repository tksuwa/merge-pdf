import { describe, expect, it } from "vitest";
import enMetadata from "@/i18n/metadata/en.json";
import { generateMetadata } from "./page";

describe("generateMetadata", () => {
  it("returns an absolute title for the locale landing page", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: "en" }),
    });

    expect(metadata.title).toEqual({
      absolute: enMetadata.title,
    });
  });
});
