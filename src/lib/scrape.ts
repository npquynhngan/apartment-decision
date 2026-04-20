// Parses apartment listing pages for structured metadata.
// Uses OpenGraph/meta tags, JSON-LD, and regex fallbacks over the rendered
// description. All parsing is pure and covered by unit tests; the network
// wrapper `fetchAndParseListing` is the only impure surface.

export type ListingMeta = {
  name?: string;
  address?: string;
  rent?: number;
  sqft?: number;
  image?: string;
};

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function metaTag(html: string, attr: string, name: string): string | null {
  // Match either order: attr="name" ... content="…" OR content="…" ... attr="name"
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const a = new RegExp(
    `<meta[^>]+${attr}=["']${esc}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const b = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*${attr}=["']${esc}["']`,
    "i"
  );
  const m = html.match(a) ?? html.match(b);
  return m ? decodeEntities(m[1]) : null;
}

export function parseRent(s: string): number | null {
  const m =
    s.match(/(?:SGD|S\$|\$)\s*([\d,]+(?:\.\d+)?)/i) ??
    s.match(/([\d,]+(?:\.\d+)?)\s*(?:SGD|\/mo|\/month|per\s*month)/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseSqft(s: string): number | null {
  const m = s.match(
    /([\d,]+(?:\.\d+)?)\s*(?:sqft|sq\.?\s*ft|square\s*feet|square\s*foot)/i
  );
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function extractJsonLd(html: string): unknown[] {
  const results: unknown[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1].trim());
      if (Array.isArray(data)) results.push(...data);
      else results.push(data);
    } catch {
      // Skip malformed JSON-LD; pages ship broken blobs surprisingly often.
    }
  }
  return results;
}

const LISTING_TYPES = new Set([
  "Apartment",
  "Residence",
  "Product",
  "RealEstateListing",
  "House",
  "SingleFamilyResidence",
]);

function pickListingNode(nodes: unknown[]): Record<string, unknown> | null {
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const obj = node as Record<string, unknown>;
    const t = obj["@type"];
    if (typeof t === "string" && LISTING_TYPES.has(t)) return obj;
    if (Array.isArray(t) && t.some((x) => typeof x === "string" && LISTING_TYPES.has(x as string)))
      return obj;
  }
  return null;
}

function readAddress(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const addr = value as Record<string, unknown>;
    const parts = [
      addr.streetAddress,
      addr.addressLocality,
      addr.addressRegion,
      addr.postalCode,
    ].filter((p): p is string => typeof p === "string" && p.length > 0);
    if (parts.length) return parts.join(", ");
  }
  return undefined;
}

function readNumeric(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function readOfferPrice(value: unknown): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const offer = value as Record<string, unknown>;
  return (
    readNumeric(offer.price) ??
    readNumeric(offer.lowPrice) ??
    readNumeric(offer.highPrice)
  );
}

function readFloorSize(value: unknown): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const fs = value as Record<string, unknown>;
  const n = readNumeric(fs.value);
  if (n == null) return undefined;
  const unit = typeof fs.unitCode === "string" ? fs.unitCode : undefined;
  // FTK = square feet in UN/CEFACT; MTK = square meters → convert.
  if (unit === "MTK") return Math.round(n * 10.7639);
  return n;
}

export function parseListing(html: string): ListingMeta {
  const meta: ListingMeta = {};

  const ogTitle =
    metaTag(html, "property", "og:title") ?? metaTag(html, "name", "twitter:title");
  const description =
    metaTag(html, "property", "og:description") ??
    metaTag(html, "name", "description") ??
    metaTag(html, "name", "twitter:description") ??
    "";
  const ogImage =
    metaTag(html, "property", "og:image") ??
    metaTag(html, "name", "twitter:image");
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title =
    ogTitle ?? (titleMatch ? decodeEntities(titleMatch[1].trim()) : null);

  if (title) meta.name = title.trim().slice(0, 120);
  if (ogImage) meta.image = ogImage;

  const listing = pickListingNode(extractJsonLd(html));
  if (listing) {
    if (typeof listing.name === "string") meta.name = listing.name.trim().slice(0, 120);
    const addr = readAddress(listing.address);
    if (addr) meta.address = addr;
    const price = readOfferPrice(listing.offers);
    if (price != null) meta.rent = price;
    const fs = readFloorSize(listing.floorSize);
    if (fs != null) meta.sqft = Math.round(fs);
  }

  const haystack = [title ?? "", description].join(" \n ");
  if (meta.rent == null) {
    const rent = parseRent(haystack);
    if (rent != null) meta.rent = rent;
  }
  if (meta.sqft == null) {
    const sqft = parseSqft(haystack);
    if (sqft != null) meta.sqft = Math.round(sqft);
  }

  return meta;
}

export async function fetchAndParseListing(
  url: string
): Promise<ListingMeta | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; apartment-decision/1.0; +https://github.com/npquynhngan/apartment-decision)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return parseListing(html);
  } catch {
    return null;
  }
}
