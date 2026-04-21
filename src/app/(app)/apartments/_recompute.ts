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
import { computeSizeScore } from "@/lib/scoring";

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

    // 'size' is handled separately by recomputeSizeScore — skip here
    if (c.auto_source === "size") continue;

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

/**
 * Upsert an auto-score for all 'size' criteria in the household, for each
 * user slot that exists.  Skips any slot that already has a manual override
 * (auto = false) so user edits are never clobbered.
 */
export async function recomputeSizeScore(
  apartment_id: string,
  household_id: string,
  bedrooms: number | null,
  bathrooms: number | null
) {
  const value = computeSizeScore(bedrooms, bathrooms);
  if (value === null) return;

  const supabase = await createClient();
  const [criteriaRes, usersRes] = await Promise.all([
    supabase
      .from("criteria")
      .select("id")
      .eq("household_id", household_id)
      .eq("auto_source", "size"),
    supabase
      .from("users")
      .select("user_slot")
      .eq("household_id", household_id),
  ]);

  const criteria = (criteriaRes.data ?? []) as { id: string }[];
  if (criteria.length === 0) return;

  const slots = ((usersRes.data ?? []) as { user_slot: string | null }[])
    .map((u) => u.user_slot)
    .filter((s): s is "a" | "b" => s === "a" || s === "b");

  for (const c of criteria) {
    for (const slot of slots) {
      // Don't overwrite a manual score
      const { data: existing } = await supabase
        .from("scores")
        .select("auto")
        .eq("apartment_id", apartment_id)
        .eq("criterion_id", c.id)
        .eq("user_slot", slot)
        .maybeSingle();

      if (existing && (existing as { auto: boolean }).auto === false) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("scores").upsert(
        {
          apartment_id,
          criterion_id: c.id,
          user_slot: slot,
          value,
          auto: true,
          needs_review: true,
        },
        { onConflict: "apartment_id,criterion_id,user_slot" }
      );
    }
  }
}
