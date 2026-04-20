"use server";

import { createClient } from "@/lib/supabase/server";
import { AUTO_SOURCES } from "@/lib/commute";
import { recomputeHouseholdCommuteScores } from "../apartments/_recompute";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CriterionState = { error?: string };

const autoSourceSchema = z
  .string()
  .optional()
  .transform((v) => {
    if (!v || v === "manual") return null;
    return v;
  })
  .pipe(
    z
      .string()
      .nullable()
      .refine(
        (v) => v === null || AUTO_SOURCES.includes(v as (typeof AUTO_SOURCES)[number]),
        "Invalid auto source"
      )
  );

const baseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  category: z.string().min(1, "Category is required").max(50, "Category is too long"),
  weight_a: z.coerce.number().int().min(0).max(10),
  weight_b: z.coerce.number().int().min(0).max(10),
  is_dealbreaker: z.boolean().default(false),
  auto_source: autoSourceSchema,
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

export async function addCriterion(
  _prev: CriterionState,
  formData: FormData
): Promise<CriterionState> {
  const result = baseSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    weight_a: formData.get("weight_a") ?? "5",
    weight_b: formData.get("weight_b") ?? "5",
    is_dealbreaker: formData.get("is_dealbreaker") === "on",
    auto_source: formData.get("auto_source") ?? undefined,
  });
  if (!result.success) return { error: result.error.issues[0].message };

  const household_id = await getHouseholdId();
  if (!household_id) return { error: "Not in a household" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("criteria").insert({
    household_id,
    ...result.data,
  });
  if (error) return { error: (error as { message: string }).message };

  if (result.data.auto_source) {
    await recomputeHouseholdCommuteScores(household_id);
  }

  revalidatePath("/criteria");
  revalidatePath("/");
  revalidatePath("/apartments");
  return {};
}

export async function updateCriterion(
  formData: FormData
): Promise<CriterionState> {
  const id = formData.get("id") as string;
  if (!id) return { error: "Missing id" };

  const result = baseSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    weight_a: formData.get("weight_a"),
    weight_b: formData.get("weight_b"),
    is_dealbreaker: formData.get("is_dealbreaker") === "on",
    auto_source: formData.get("auto_source") ?? undefined,
  });
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("criteria")
    .select("auto_source, household_id")
    .eq("id", id)
    .single();
  const prev = existing as
    | { auto_source: string | null; household_id: string }
    | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("criteria")
    .update(result.data)
    .eq("id", id);
  if (error) return { error: (error as { message: string }).message };

  if (
    prev &&
    prev.auto_source !== result.data.auto_source &&
    result.data.auto_source
  ) {
    await recomputeHouseholdCommuteScores(prev.household_id);
  }

  revalidatePath("/criteria");
  revalidatePath("/");
  revalidatePath("/apartments");
  return {};
}

export async function deleteCriterion(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  if (!id) return;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("criteria").delete().eq("id", id);
  revalidatePath("/criteria");
}
