import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Apartment,
  Criterion,
  Score,
  UserProfile,
} from "@/types/database";
import { InfoPanel } from "./_info-panel";
import { ScoreGrid } from "./_score-grid";

export const metadata: Metadata = {
  title: "Apartment — Apartment Decision",
};

export default async function ApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: apartmentData } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", id)
    .single();
  const apartment = apartmentData as Apartment | null;
  if (!apartment) notFound();

  const [{ data: criteriaData }, { data: scoresData }] = await Promise.all([
    supabase
      .from("criteria")
      .select("*")
      .eq("household_id", profile.household_id)
      .order("category")
      .order("position")
      .order("created_at"),
    supabase.from("scores").select("*").eq("apartment_id", id),
  ]);
  const criteria = (criteriaData ?? []) as Criterion[];
  const scores = (scoresData ?? []) as Score[];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/apartments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All apartments
        </Link>
      </div>

      <InfoPanel apartment={apartment} />

      <ScoreGrid
        apartmentId={apartment.id}
        criteria={criteria}
        initialScores={scores}
        userSlot={profile.user_slot}
      />
    </div>
  );
}
