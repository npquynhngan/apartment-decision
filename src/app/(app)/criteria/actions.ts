"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CriterionState = { error?: string };

const baseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  category: z.string().min(1, "Category is required").max(50, "Category is too long"),
  weight_a: z.coerce.number().int().min(0).max(10),
  weight_b: z.coerce.number().int().min(0).max(10),
  is_dealbreaker: z.boolean().default(false),
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

  revalidatePath("/criteria");
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
  });
  if (!result.success) return { error: result.error.issues[0].message };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("criteria")
    .update(result.data)
    .eq("id", id);
  if (error) return { error: (error as { message: string }).message };

  revalidatePath("/criteria");
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
