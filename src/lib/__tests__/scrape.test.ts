import { describe, it, expect } from "vitest";
import { parseListing, parseRent, parseSqft } from "../scrape";

describe("parseRent", () => {
  it("parses S$ prefix with commas", () => {
    expect(parseRent("Rent: S$4,200/month")).toBe(4200);
  });
  it("parses plain $ prefix", () => {
    expect(parseRent("For $3500/mo")).toBe(3500);
  });
  it("parses SGD suffix", () => {
    expect(parseRent("4,500 SGD per month")).toBe(4500);
  });
  it("returns null when no price matches", () => {
    expect(parseRent("a cosy flat")).toBeNull();
  });
  it("rejects zero and negatives", () => {
    expect(parseRent("S$0")).toBeNull();
  });
});

describe("parseSqft", () => {
  it("parses 'sqft'", () => {
    expect(parseSqft("A 1,200 sqft apartment")).toBe(1200);
  });
  it("parses 'sq ft'", () => {
    expect(parseSqft("850 sq ft")).toBe(850);
  });
  it("parses 'square feet'", () => {
    expect(parseSqft("Approx 950 square feet of space")).toBe(950);
  });
  it("returns null without a unit", () => {
    expect(parseSqft("1200")).toBeNull();
  });
});

describe("parseListing", () => {
  it("picks up OpenGraph title and image", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Cosy 2BR in Tiong Bahru">
        <meta property="og:image" content="https://img.example/1.jpg">
      </head></html>
    `;
    const meta = parseListing(html);
    expect(meta.name).toBe("Cosy 2BR in Tiong Bahru");
    expect(meta.image).toBe("https://img.example/1.jpg");
  });

  it("falls back to <title> when og:title is missing", () => {
    const html = `<html><head><title>Loft in Bugis</title></head></html>`;
    expect(parseListing(html).name).toBe("Loft in Bugis");
  });

  it("extracts rent and sqft from the description regex", () => {
    const html = `
      <meta property="og:title" content="Spacious condo">
      <meta property="og:description" content="S$5,800/month · 1,150 sqft, move-in ready">
    `;
    const meta = parseListing(html);
    expect(meta.rent).toBe(5800);
    expect(meta.sqft).toBe(1150);
  });

  it("prefers JSON-LD Apartment data over regex", () => {
    const html = `
      <meta property="og:title" content="Bad title">
      <meta property="og:description" content="S$1/month 1 sqft">
      <script type="application/ld+json">
        ${JSON.stringify({
          "@type": "Apartment",
          name: "The Canopy 3BR",
          address: {
            streetAddress: "12 Holland Road",
            addressLocality: "Singapore",
            postalCode: "278601",
          },
          offers: { "@type": "Offer", price: 6200, priceCurrency: "SGD" },
          floorSize: { "@type": "QuantitativeValue", value: 1400, unitCode: "FTK" },
        })}
      </script>
    `;
    const meta = parseListing(html);
    expect(meta.name).toBe("The Canopy 3BR");
    expect(meta.address).toBe("12 Holland Road, Singapore, 278601");
    expect(meta.rent).toBe(6200);
    expect(meta.sqft).toBe(1400);
  });

  it("converts square-meter floor size to sqft", () => {
    const html = `
      <script type="application/ld+json">
        ${JSON.stringify({
          "@type": "RealEstateListing",
          name: "Metric Listing",
          floorSize: { value: 100, unitCode: "MTK" },
        })}
      </script>
    `;
    // 100 m² * 10.7639 ≈ 1076
    expect(parseListing(html).sqft).toBe(1076);
  });

  it("handles string prices in JSON-LD offers", () => {
    const html = `
      <script type="application/ld+json">
        ${JSON.stringify({
          "@type": "Product",
          name: "String Price",
          offers: { price: "3,800", priceCurrency: "SGD" },
        })}
      </script>
    `;
    expect(parseListing(html).rent).toBe(3800);
  });

  it("ignores malformed JSON-LD without throwing", () => {
    const html = `
      <meta property="og:title" content="Fallback title">
      <script type="application/ld+json">{ not: valid json }</script>
    `;
    const meta = parseListing(html);
    expect(meta.name).toBe("Fallback title");
  });

  it("decodes HTML entities in titles", () => {
    const html = `<title>Luxe &amp; Airy 2BR</title>`;
    expect(parseListing(html).name).toBe("Luxe & Airy 2BR");
  });

  it("returns empty object for a page without any signals", () => {
    expect(parseListing("<html></html>")).toEqual({});
  });

  it("reads string address from JSON-LD", () => {
    const html = `
      <script type="application/ld+json">
        ${JSON.stringify({
          "@type": "Apartment",
          name: "Plain Address",
          address: "5 Orchard Boulevard, Singapore",
        })}
      </script>
    `;
    expect(parseListing(html).address).toBe("5 Orchard Boulevard, Singapore");
  });
});
