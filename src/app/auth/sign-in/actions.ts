"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export type SignInState = { error?: string; success?: boolean };

export async function signInWithMagicLink(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const result = schema.safeParse({ email: formData.get("email") });
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
