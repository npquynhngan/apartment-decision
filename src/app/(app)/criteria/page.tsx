import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Criterion, UserProfile } from "@/types/database";
import { AddCriterionForm } from "./_add-form";
import { CriteriaList } from "./_criteria-list";

export const metadata: Metadata = {
  title: "Criteria — Apartment Decision",
};

export default async function CriteriaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profileData } = await supabase
    .from("users")
    .select("household_id, user_slot")
    .eq("id", user.id)
    .single();
  const profile = profileData as Pick<
    UserProfile,
    "household_id" | "user_slot"
  > | null;
  if (!profile?.household_id) redirect("/household");

  const { data: criteriaData } = await supabase
    .from("criteria")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("category")
    .order("position")
    .order("created_at");
  const criteria = (criteriaData ?? []) as Criterion[];

  return (
    <div className="space-y-8 max-w-2xl animate-fade-up">
      <div>
        <h1 className="text-3xl font-heading font-bold text-ink-plum tracking-tight">
          Criteria
        </h1>
        <p className="text-sm text-dusk-indigo/75 mt-1">
          Define what matters to you. Both partners set their own weight (0 =
          doesn&apos;t matter, 10 = essential).
        </p>
      </div>
      <AddCriterionForm />
      <CriteriaList criteria={criteria} userSlot={profile.user_slot} />
    </div>
  );
}
