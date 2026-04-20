import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/database";
import { ProfileForm } from "./_profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profileData } = await supabase
    .from("users")
    .select(
      "display_name, home_address, work_address, home_coords, work_coords, user_slot"
    )
    .eq("id", user.id)
    .single();
  const profile = profileData as Pick<
    UserProfile,
    | "display_name"
    | "home_address"
    | "work_address"
    | "home_coords"
    | "work_coords"
    | "user_slot"
  > | null;

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your address inputs power commute auto-scoring. You are Partner{" "}
          <span className="font-medium uppercase">
            {profile?.user_slot ?? "?"}
          </span>
          .
        </p>
      </div>

      <ProfileForm
        profile={{
          display_name: profile?.display_name ?? null,
          home_address: profile?.home_address ?? null,
          work_address: profile?.work_address ?? null,
          home_coords: profile?.home_coords ?? null,
          work_coords: profile?.work_coords ?? null,
        }}
      />
    </div>
  );
}
