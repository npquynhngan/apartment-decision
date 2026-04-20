import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Apartment, ApartmentScore, UserProfile } from "@/types/database";
import { MapLoader } from "./_map-loader";

export default async function MapPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profileData } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();
  const profile = profileData as Pick<UserProfile, "household_id"> | null;
  if (!profile?.household_id) redirect("/household");

  const [apartmentsRes, viewRes] = await Promise.all([
    supabase
      .from("apartments")
      .select("*")
      .eq("household_id", profile.household_id),
    supabase
      .from("apartment_scores")
      .select("*")
      .eq("household_id", profile.household_id),
  ]);

  const apartments = (apartmentsRes.data ?? []) as Apartment[];
  const viewRows = (viewRes.data ?? []) as ApartmentScore[];
  const scoreByApt = new Map(viewRows.map((v) => [v.apartment_id, v]));

  const mappable = apartments
    .filter((a) => a.lat != null && a.lng != null)
    .map((a) => ({
      id: a.id,
      name: a.name,
      address: a.address,
      rent: a.rent,
      lat: a.lat as number,
      lng: a.lng as number,
      effective_score: scoreByApt.get(a.id)?.effective_score ?? null,
      dealbreaker_failed:
        scoreByApt.get(a.id)?.dealbreaker_failed ?? false,
    }));

  const missingCoords = apartments.length - mappable.length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Apartments plotted by geocoded address.
            {missingCoords > 0 && (
              <> {missingCoords} without coordinates not shown.</>
            )}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/apartments/new">+ Add apartment</Link>
        </Button>
      </div>

      {mappable.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No apartments with coordinates yet. Add an address when creating
          an apartment to see it here.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <MapLoader apartments={mappable} />
        </div>
      )}
    </div>
  );
}
