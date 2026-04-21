import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { PaperBackground } from "@/components/paper-background";
import { DriftingClouds } from "@/components/drifting-clouds";
import type { UserProfile, Household } from "@/types/database";
import { AppNav } from "./_nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const profileResult = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileResult.data as UserProfile | null;

  if (!profile?.household_id) redirect("/household");

  const householdResult = await supabase
    .from("households")
    .select("*")
    .eq("id", profile.household_id!)
    .single();

  const household = householdResult.data as Household | null;

  const displayName = profile.display_name ?? profile.email ?? user.email;
  const slotLabel = profile.user_slot
    ? `Partner ${profile.user_slot.toUpperCase()}`
    : "";

  return (
    <div className="flex min-h-screen flex-col">
      <PaperBackground />

      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "rgba(232, 220, 184, 0.92)",
          backdropFilter: "blur(10px)",
          borderColor: "rgba(139, 115, 85, 0.22)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <DriftingClouds />
        <div
          className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="flex items-center gap-3">
            <span className="font-heading font-bold text-ink-plum tracking-tight">
              Apartment Decision
            </span>
            {household && (
              <>
                <span className="text-dusk-indigo/50 text-sm">/</span>
                <span className="text-sm text-dusk-indigo/75">
                  {household.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dusk-indigo/65">
              {displayName} · {slotLabel}
            </span>
            {household && (
              <span
                className="font-mono text-xs text-dusk-indigo/50"
                title="Invite code — share with your partner"
              >
                {household.invite_code}
              </span>
            )}
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <AppNav />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8 z-10">
        {children}
      </main>
    </div>
  );
}
