"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type MapApartment = {
  id: string;
  name: string;
  address: string | null;
  rent: number | null;
  lat: number;
  lng: number;
  effective_score: number | null;
  dealbreaker_failed: boolean;
};

// Leaflet's default marker images don't resolve under bundlers; point them at
// the CDN copies instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SINGAPORE: [number, number] = [1.3521, 103.8198];

function formatPct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${Math.round(v * 100)}%`;
}

function formatRent(v: number | null | undefined) {
  if (v == null) return null;
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(v);
}

function FitBounds({ apartments }: { apartments: MapApartment[] }) {
  const map = useMap();
  useEffect(() => {
    if (apartments.length === 0) return;
    if (apartments.length === 1) {
      map.setView([apartments[0].lat, apartments[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(
      apartments.map((a) => [a.lat, a.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [apartments, map]);
  return null;
}

export function MapView({ apartments }: { apartments: MapApartment[] }) {
  return (
    <MapContainer
      center={SINGAPORE}
      zoom={12}
      scrollWheelZoom
      style={{ height: "520px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds apartments={apartments} />
      {apartments.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lng]}>
          <Popup>
            <div className="space-y-1 text-sm">
              <div className="font-medium">
                <Link
                  href={`/apartments/${a.id}`}
                  className="underline underline-offset-2"
                >
                  {a.name}
                </Link>
              </div>
              {a.address && (
                <div className="text-xs text-muted-foreground">
                  {a.address}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className="tabular-nums font-medium">
                  {formatPct(a.effective_score)}
                </span>
                {a.dealbreaker_failed && (
                  <span className="text-destructive">Dealbreaker</span>
                )}
                {a.rent != null && <span>· {formatRent(a.rent)}/mo</span>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
