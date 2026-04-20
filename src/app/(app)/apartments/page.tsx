import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type {
  Apartment,
  ApartmentScore,
  UserProfile,
} from "@/types/database";

export const metadata: Metadata = {
  title: "Apartments — Apartment Decision",
};

type Row = Apartment & Partial<ApartmentScore>;

function formatScore(v: number | null | undefined) {
  if (v == null) return "—";
  return `${Math.round(v * 100)}%`;
}

function formatRent(v: number | null | undefined) {
  if (v == null) return null;
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(v);
}

export default async function ApartmentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in");

  const { data: profileData } = await supabase
    .from("users")
    .select("household_id")
    .eq("id", user.id)
    .single();
  const profile = profileData as Pick<UserProfile, "household_id"> | null;
  if (!profile?.household_id) redirect("/household");

  const { data: apartmentsData } = await supabase
    .from("apartments")
    .select("*")
    .eq("household_id", profile.household_id)
    .order("created_at", { ascending: false });
  const apartments = (apartmentsData ?? []) as Apartment[];

  const { data: scoresData } = await supabase
    .from("apartment_scores")
    .select("*")
    .eq("household_id", profile.household_id);
  const scores = (scoresData ?? []) as ApartmentScore[];
  const scoreByApt = new Map(scores.map((s) => [s.apartment_id, s]));

  const rows: Row[] = apartments
    .map((a) => ({ ...a, ...scoreByApt.get(a.id) }))
    .sort((x, y) => {
      // Nulls last; higher effective_score first
      const ax = x.effective_score ?? -Infinity;
      const bx = y.effective_score ?? -Infinity;
      return bx - ax;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Apartments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ranked by combined score. Dealbreakers drop to the bottom.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/apartments/new">+ Add apartment</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No apartments yet. Add your first one to start scoring.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((a) => (
            <li key={a.id}>
              <Link
                href={`/apartments/${a.id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{a.name}</span>
                      {a.dealbreaker_failed && (
                        <span className="text-xs font-medium text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                          Dealbreaker
                        </span>
                      )}
                    </div>
                    {a.address && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {a.address}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {a.rent != null && <span>{formatRent(a.rent)}/mo</span>}
                      {a.sqm != null && <span>{a.sqm} m²</span>}
                      {a.viewing_at && (
                        <span>
                          Viewing{" "}
                          {new Date(a.viewing_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-semibold tabular-nums">
                      {formatScore(a.effective_score)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      A {formatScore(a.score_a)} · B {formatScore(a.score_b)}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
