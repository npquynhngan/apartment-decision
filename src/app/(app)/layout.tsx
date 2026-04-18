import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import type { UserProfile, Household } from "@/types/database";

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
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Apartment Decision</span>
            {household && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground">
                  {household.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {displayName} · {slotLabel}
            </span>
            {household && (
              <span
                className="font-mono text-xs text-muted-foreground"
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
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
