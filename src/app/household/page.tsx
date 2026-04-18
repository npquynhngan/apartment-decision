import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HouseholdSetup } from "./_household-form";

export const metadata: Metadata = {
  title: "Set up household — Apartment Decision",
};

export default async function HouseholdPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  // If the user already has a household, send them to the app
  const result = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();
  const profile = result.data as { household_id: string | null } | null;

  if (profile?.household_id) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <HouseholdSetup />
    </main>
  );
}
