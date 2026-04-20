// Commute distance helpers. Uses great-circle distance (Haversine) as a
// zero-dependency proxy — real travel time would need a routing API, and the
// free-tier surface for Singapore transit is thin. Buckets produce a 1–5
// score that lines up with the same scale users grade other criteria on.

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Tunable for dense urban areas. Singapore-sized spreads map roughly to:
//   ≤3 km  → short, nearly walkable
//   ≤7 km  → 1–2 MRT stops
//   ≤15 km → cross-town
//   ≤25 km → far side of the island
//   > 25   → practically as far as you can get here
export function distanceToScore(km: number): 1 | 2 | 3 | 4 | 5 {
  if (km <= 3) return 5;
  if (km <= 7) return 4;
  if (km <= 15) return 3;
  if (km <= 25) return 2;
  return 1;
}

export const AUTO_SOURCES = ["commute_home", "commute_work"] as const;
export type AutoSource = (typeof AUTO_SOURCES)[number];

export function autoSourceLabel(source: AutoSource): string {
  return source === "commute_home" ? "Distance to home" : "Distance to work";
}
