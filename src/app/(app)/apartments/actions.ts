"use server";

import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import { fetchAndParseListing, type ListingMeta } from "@/lib/scrape";
import { recomputeApartmentCommuteScores } from "./_recompute";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export type ApartmentState = {
  error?: string;
  fields?: Record<string, string>;
};

const optionalString = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined) return null;
    const t = v.trim();
    return t.length === 0 ? null : t;
  });

const optionalNumber = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined || v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  });

const optionalDateTime = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined || v.trim() === "") return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  });

const apartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Name is too long"),
  address: optionalString,
  rent: optionalNumber,
  sqft: optionalNumber,
  url: optionalString,
  notes: optionalString,
  viewing_at: optionalDateTime,
});

async function getHouseholdId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();
  return (data as { household_id: string | null } | null)?.household_id ?? null;
}

export async function addApartment(
  _prev: ApartmentState,
  formData: FormData
): Promise<ApartmentState> {
  const parsed = apartmentSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") ?? undefined,
    rent: formData.get("rent") ?? undefined,
    sqft: formData.get("sqft") ?? undefined,
    url: formData.get("url") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    viewing_at: formData.get("viewing_at") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const household_id = await getHouseholdId();
  if (!household_id) return { error: "Not in a household" };

  const coords = parsed.data.address
    ? await geocodeAddress(parsed.data.address)
    : null;

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("apartments")
    .insert({
      household_id,
      ...parsed.data,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: (error as { message: string }).message };

  const newId = (data as { id: string }).id;
  if (coords) {
    await recomputeApartmentCommuteScores(newId, household_id);
  }

  revalidatePath("/apartments");
  revalidatePath("/map");
  redirect(`/apartments/${newId}`);
}

export async function updateApartment(
  _prev: ApartmentState,
  formData: FormData
): Promise<ApartmentState> {
  const id = formData.get("id") as string | null;
  if (!id) return { error: "Missing apartment id" };

  const parsed = apartmentSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") ?? undefined,
    rent: formData.get("rent") ?? undefined,
    sqft: formData.get("sqft") ?? undefined,
    url: formData.get("url") ?? undefined,
    notes: formData.get("notes") ?? undefined,
    viewing_at: formData.get("viewing_at") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("apartments")
    .select("address, household_id")
    .eq("id", id)
    .single();
  const prev = existing as
    | { address: string | null; household_id: string }
    | null;
  const prevAddress = prev?.address ?? null;

  const addressChanged = parsed.data.address !== prevAddress;
  const coords =
    addressChanged && parsed.data.address
      ? await geocodeAddress(parsed.data.address)
      : null;

  const updatePayload: Record<string, unknown> = { ...parsed.data };
  if (addressChanged) {
    updatePayload.lat = coords?.lat ?? null;
    updatePayload.lng = coords?.lng ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("apartments")
    .update(updatePayload)
    .eq("id", id);
  if (error) return { error: (error as { message: string }).message };

  if (addressChanged && coords && prev?.household_id) {
    await recomputeApartmentCommuteScores(id, prev.household_id);
  }

  revalidatePath("/apartments");
  revalidatePath(`/apartments/${id}`);
  revalidatePath("/map");
  return {};
}

export async function deleteApartment(formData: FormData): Promise<void> {
  const id = formData.get("id") as string | null;
  if (!id) return;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("apartments").delete().eq("id", id);
  revalidatePath("/apartments");
  revalidatePath("/map");
  redirect("/apartments");
}

const scoreSchema = z.object({
  apartment_id: z.string().uuid(),
  criterion_id: z.string().uuid(),
  user_slot: z.enum(["a", "b"] as const),
  value: z.coerce.number().int().min(1).max(5),
});

export async function upsertScore(
  input: z.input<typeof scoreSchema>
): Promise<{ error?: string }> {
  const parsed = scoreSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("scores").upsert(
    { ...parsed.data, auto: false, needs_review: false },
    { onConflict: "apartment_id,criterion_id,user_slot" }
  );
  if (error) return { error: (error as { message: string }).message };

  revalidatePath(`/apartments/${parsed.data.apartment_id}`);
  revalidatePath("/apartments");
  return {};
}

const urlSchema = z
  .string()
  .min(1, "URL is required")
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http(s) URL");

export async function scrapeListing(
  url: string
): Promise<{ data?: ListingMeta; error?: string }> {
  const parsed = urlSchema.safeParse(url);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const meta = await fetchAndParseListing(parsed.data);
  if (!meta) return { error: "Could not fetch that listing" };
  return { data: meta };
}
