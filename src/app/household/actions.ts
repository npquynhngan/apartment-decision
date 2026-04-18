"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const slotEnum = z.enum(["a", "b"] as const, {
  error: "Choose a slot (Partner A or Partner B)",
});

const createSchema = z.object({
  name: z
    .string()
    .min(1, "Household name is required")
    .max(80, "Name is too long"),
  slot: slotEnum,
});

const joinSchema = z.object({
  invite_code: z.string().min(1, "Invite code is required"),
  slot: slotEnum,
});

export type HouseholdState = { error?: string };

export async function createHousehold(
  _prev: HouseholdState,
  formData: FormData
): Promise<HouseholdState> {
  const result = createSchema.safeParse({
    name: formData.get("name"),
    slot: formData.get("slot"),
  });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  // Cast required because supabase-js narrows hand-written Function types
  // incorrectly — generated types (added later) will fix this.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("create_household", {
    p_name: result.data.name,
    p_slot: result.data.slot,
  });

  if (error) return { error: (error as { message: string }).message };
  redirect("/");
}

export async function joinHousehold(
  _prev: HouseholdState,
  formData: FormData
): Promise<HouseholdState> {
  const result = joinSchema.safeParse({
    invite_code: formData.get("invite_code"),
    slot: formData.get("slot"),
  });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("join_household", {
    p_invite_code: result.data.invite_code,
    p_slot: result.data.slot,
  });

  if (error) return { error: (error as { message: string }).message };
  redirect("/");
}
