import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`
      );
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/sign-in?error=${encodeURIComponent(error.message)}`
      );
    }
  } else {
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=Invalid+auth+link`
    );
  }

  // After a successful session, check if the user has a household
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const result = await supabase
      .from("users")
      .select("household_id")
      .eq("id", user.id)
      .single();
    const profile = result.data as { household_id: string | null } | null;

    if (!profile?.household_id) {
      return NextResponse.redirect(`${origin}/household`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
