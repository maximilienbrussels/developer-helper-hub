import { describe, expect, it, beforeEach } from "vitest";
import { normalizePublicImageUrl } from "@/lib/s3.server";

describe("normalizePublicImageUrl", () => {
  beforeEach(() => {
    delete process.env.S3_ACCESS_KEY;
    delete process.env.S3_SECRET_KEY;
  });

  it("works without upload keys so public photos still show", () => {
    const url = "https://maximilien-media.s3.fr-par.scw.cloud/products/a.jpg";
    expect(normalizePublicImageUrl(url)).toBe(url);
  });

  it("keeps media-library app paths unchanged", () => {
    expect(normalizePublicImageUrl("/api/public/media/abc")).toBe("/api/public/media/abc");
  });

  it("turns a bare storage key into a bucket URL", () => {
    expect(normalizePublicImageUrl("products/a.jpg")).toBe(
      "https://maximilien-media.s3.fr-par.scw.cloud/products/a.jpg",
    );
  });
});
