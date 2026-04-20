"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignInState = { error?: string; success?: boolean };

export async function signInWithMagicLink(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const result = emailSchema.safeParse({ email: formData.get("email") });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: result.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function signInWithPassword(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const result = passwordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) return { error: error.message };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("household_id")
      .eq("id", user.id)
      .single();
    const profile = data as { household_id: string | null } | null;
    if (!profile?.household_id) redirect("/household");
  }
  redirect("/");
}
