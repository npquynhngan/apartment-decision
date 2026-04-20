"use client";

import dynamic from "next/dynamic";
import type { MapApartment } from "./_map-view";

const MapView = dynamic(
  () => import("./_map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] flex items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

export function MapLoader({ apartments }: { apartments: MapApartment[] }) {
  return <MapView apartments={apartments} />;
}
