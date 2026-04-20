"use server";

import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recomputeHouseholdCommuteScores } from "../apartments/_recompute";

export type ProfileState = {
  error?: string;
  message?: string;
};

const optionalString = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined) return null;
    const t = v.trim();
    return t.length === 0 ? null : t;
  });

const profileSchema = z.object({
  display_name: optionalString,
  home_address: optionalString,
  work_address: optionalString,
});

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    display_name: formData.get("display_name") ?? undefined,
    home_address: formData.get("home_address") ?? undefined,
    work_address: formData.get("work_address") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: currentData } = await supabase
    .from("users")
    .select("home_address, work_address, household_id")
    .eq("id", user.id)
    .single();
  const current = currentData as
    | {
        home_address: string | null;
        work_address: string | null;
        household_id: string | null;
      }
    | null;

  const homeChanged = (current?.home_address ?? null) !== parsed.data.home_address;
  const workChanged = (current?.work_address ?? null) !== parsed.data.work_address;

  const homeCoords =
    homeChanged && parsed.data.home_address
      ? await geocodeAddress(parsed.data.home_address)
      : undefined;
  const workCoords =
    workChanged && parsed.data.work_address
      ? await geocodeAddress(parsed.data.work_address)
      : undefined;

  const payload: Record<string, unknown> = { ...parsed.data };
  if (homeChanged) {
    payload.home_coords = parsed.data.home_address ? homeCoords ?? null : null;
  }
  if (workChanged) {
    payload.work_coords = parsed.data.work_address ? workCoords ?? null : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("users")
    .update(payload)
    .eq("id", user.id);
  if (error) return { error: (error as { message: string }).message };

  if ((homeChanged || workChanged) && current?.household_id) {
    await recomputeHouseholdCommuteScores(current.household_id);
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/apartments");

  const warnings: string[] = [];
  if (homeChanged && parsed.data.home_address && !homeCoords) {
    warnings.push("home address could not be geocoded");
  }
  if (workChanged && parsed.data.work_address && !workCoords) {
    warnings.push("work address could not be geocoded");
  }
  if (warnings.length > 0) {
    return { message: `Saved. Note: ${warnings.join(" and ")}.` };
  }
  return { message: "Saved." };
}
