"use server";

import { createClient } from "@/lib/supabase/server";
import {
  AUTO_SOURCES,
  distanceToScore,
  haversineKm,
  type AutoSource,
  type LatLng,
} from "@/lib/commute";
import { rentToScore } from "@/lib/cost";

type UserWithCoords = {
  user_slot: "a" | "b" | null;
  home_coords: LatLng | null;
  work_coords: LatLng | null;
};

type CriterionRow = { id: string; auto_source: string | null };

type ApartmentRow = {
  id: string;
  lat: number | null;
  lng: number | null;
  rent: number | null;
};

function resolveSlotCoords(
  user: UserWithCoords,
  source: AutoSource
): LatLng | null {
  return source === "commute_home" ? user.home_coords : user.work_coords;
}

async function upsertAutoScore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  args: {
    apartment_id: string;
    criterion_id: string;
    user_slot: "a" | "b";
    value: number;
  }
) {
  await supabase.from("scores").upsert(
    {
      apartment_id: args.apartment_id,
      criterion_id: args.criterion_id,
      user_slot: args.user_slot,
      value: args.value,
      auto: true,
      needs_review: false,
    },
    { onConflict: "apartment_id,criterion_id,user_slot" }
  );
}

async function computeForApartment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  apartment: ApartmentRow,
  users: UserWithCoords[],
  criteria: CriterionRow[]
) {
  const aptCoords: LatLng | null =
    apartment.lat != null && apartment.lng != null
      ? { lat: apartment.lat, lng: apartment.lng }
      : null;

  for (const c of criteria) {
    if (!c.auto_source || !AUTO_SOURCES.includes(c.auto_source as AutoSource)) {
      continue;
    }

    if (c.auto_source === "cost") {
      if (apartment.rent == null) continue;
      const value = rentToScore(apartment.rent);
      for (const user of users) {
        if (!user.user_slot) continue;
        await upsertAutoScore(supabase, {
          apartment_id: apartment.id,
          criterion_id: c.id,
          user_slot: user.user_slot,
          value,
        });
      }
      continue;
    }

    // Commute-based sources
    if (!aptCoords) continue;
    const source = c.auto_source as AutoSource;
    for (const user of users) {
      if (!user.user_slot) continue;
      const slotCoords = resolveSlotCoords(user, source);
      if (!slotCoords) continue;
      const km = haversineKm(aptCoords, slotCoords);
      const value = distanceToScore(km);
      await upsertAutoScore(supabase, {
        apartment_id: apartment.id,
        criterion_id: c.id,
        user_slot: user.user_slot,
        value,
      });
    }
  }
}

export async function recomputeApartmentCommuteScores(
  apartment_id: string,
  household_id: string
) {
  const supabase = await createClient();
  const [apartmentRes, usersRes, criteriaRes] = await Promise.all([
    supabase
      .from("apartments")
      .select("id, lat, lng, rent")
      .eq("id", apartment_id)
      .single(),
    supabase
      .from("users")
      .select("user_slot, home_coords, work_coords")
      .eq("household_id", household_id),
    supabase
      .from("criteria")
      .select("id, auto_source")
      .eq("household_id", household_id)
      .not("auto_source", "is", null),
  ]);

  const apartment = apartmentRes.data as ApartmentRow | null;
  if (!apartment) return;
  const users = (usersRes.data ?? []) as UserWithCoords[];
  const criteria = (criteriaRes.data ?? []) as CriterionRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await computeForApartment(supabase as any, apartment, users, criteria);
}

export async function recomputeHouseholdCommuteScores(household_id: string) {
  const supabase = await createClient();
  const [apartmentsRes, usersRes, criteriaRes] = await Promise.all([
    supabase
      .from("apartments")
      .select("id, lat, lng, rent")
      .eq("household_id", household_id),
    supabase
      .from("users")
      .select("user_slot, home_coords, work_coords")
      .eq("household_id", household_id),
    supabase
      .from("criteria")
      .select("id, auto_source")
      .eq("household_id", household_id)
      .not("auto_source", "is", null),
  ]);

  const apartments = (apartmentsRes.data ?? []) as ApartmentRow[];
  const users = (usersRes.data ?? []) as UserWithCoords[];
  const criteria = (criteriaRes.data ?? []) as CriterionRow[];

  for (const apartment of apartments) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await computeForApartment(supabase as any, apartment, users, criteria);
  }
}
