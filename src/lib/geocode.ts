// Free geocoding via OpenStreetMap's Nominatim.
// Rate-limited to ~1 req/sec; we don't retry. Returns null on failure.
// https://operations.osmfoundation.org/policies/nominatim/

export type GeoPoint = { lat: number; lng: number };

const USER_AGENT =
  "apartment-decision/1.0 (+https://github.com/npquynhngan/apartment-decision)";

export async function geocodeAddress(
  address: string
): Promise<GeoPoint | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    trimmed
  )}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (data.length === 0) return null;
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
