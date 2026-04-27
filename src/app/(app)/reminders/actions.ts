"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type ReminderState = {
  error?: string;
};

const addSchema = z.object({
  text: z
    .string()
    .min(1, "Reminder text is required")
    .max(200, "Reminder is too long"),
  due_at: z
    .string()
    .min(1, "Due date is required")
    .transform((v, ctx) => {
      // datetime-local input is naive; interpret as SGT (UTC+8)
      const hasSeconds = /T\d{2}:\d{2}:\d{2}$/.test(v.trim());
      const withTz = hasSeconds ? `${v.trim()}+08:00` : `${v.trim()}:00+08:00`;
      const d = new Date(withTz);
      if (Number.isNaN(d.getTime())) {
        ctx.addIssue({ code: "custom", message: "Invalid due date" });
        return z.NEVER;
      }
      return d.toISOString();
    }),
  apartment_id: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v === "none") return null;
      return v;
    }),
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

export async function addReminder(
  _prev: ReminderState,
  formData: FormData
): Promise<ReminderState> {
  const parsed = addSchema.safeParse({
    text: formData.get("text"),
    due_at: formData.get("due_at"),
    apartment_id: formData.get("apartment_id") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const household_id = await getHouseholdId();
  if (!household_id) return { error: "Not in a household" };

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("reminders").insert({
    household_id,
    text: parsed.data.text,
    due_at: parsed.data.due_at,
    apartment_id: parsed.data.apartment_id,
  });
  if (error) return { error: (error as { message: string }).message };

  revalidatePath("/reminders");
  if (parsed.data.apartment_id) {
    revalidatePath(`/apartments/${parsed.data.apartment_id}`);
  }
  return {};
}

export async function toggleReminder(
  id: string,
  done: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("reminders")
    .update({ done })
    .eq("id", id);
  if (error) return { error: (error as { message: string }).message };
  revalidatePath("/reminders");
  return {};
}

export async function deleteReminder(formData: FormData): Promise<void> {
  const id = formData.get("id") as string | null;
  if (!id) return;
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("reminders").delete().eq("id", id);
  const apartment_id = formData.get("apartment_id") as string | null;
  revalidatePath("/reminders");
  if (apartment_id) revalidatePath(`/apartments/${apartment_id}`);
}
