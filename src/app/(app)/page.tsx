import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  Apartment,
  ApartmentScore,
  Criterion,
  Score,
  UserProfile,
} from "@/types/database";

function formatPct(v: number | null | undefined) {
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

export default async function DashboardPage() {
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

  const [criteriaRes, apartmentsRes, scoresRes, viewRes] = await Promise.all([
    supabase
      .from("criteria")
      .select("*")
      .eq("household_id", profile.household_id),
    supabase
      .from("apartments")
      .select("*")
      .eq("household_id", profile.household_id),
    supabase.from("scores").select("*"),
    supabase
      .from("apartment_scores")
      .select("*")
      .eq("household_id", profile.household_id),
  ]);

  const criteria = (criteriaRes.data ?? []) as Criterion[];
  const apartments = (apartmentsRes.data ?? []) as Apartment[];
  const scores = (scoresRes.data ?? []) as Score[];
  const viewRows = (viewRes.data ?? []) as ApartmentScore[];

  if (criteria.length === 0) {
    return (
      <EmptyState
        title="Welcome to Apartment Decision"
        body="Start by defining what matters to you — set up your scoring criteria and both partners will weight each one independently."
        ctaHref="/criteria"
        ctaLabel="Set up criteria →"
      />
    );
  }

  if (apartments.length === 0) {
    return (
      <EmptyState
        title="Add your first apartment"
        body="Criteria are ready. Add apartments to start scoring and ranking them."
        ctaHref="/apartments/new"
        ctaLabel="Add apartment →"
      />
    );
  }

  const viewByApt = new Map(viewRows.map((v) => [v.apartment_id, v]));
  const scoresByApt = new Map<string, Score[]>();
  for (const s of scores) {
    const arr = scoresByApt.get(s.apartment_id) ?? [];
    arr.push(s);
    scoresByApt.set(s.apartment_id, arr);
  }

  type Ranked = Apartment &
    Partial<ApartmentScore> & {
      coverage_a: number;
      coverage_b: number;
      disagreements: number;
    };

  const enriched: Ranked[] = apartments.map((a) => {
    const v = viewByApt.get(a.id);
    const apScores = scoresByApt.get(a.id) ?? [];

    const byCriterion = new Map<string, { a?: number; b?: number }>();
    for (const s of apScores) {
      const entry = byCriterion.get(s.criterion_id) ?? {};
      if (s.user_slot === "a") entry.a = s.value;
      else entry.b = s.value;
      byCriterion.set(s.criterion_id, entry);
    }
    const disagreements = Array.from(byCriterion.values()).filter(
      (e) => e.a != null && e.b != null && Math.abs(e.a - e.b) >= 2
    ).length;

    return {
      ...a,
      score_a: v?.score_a ?? null,
      score_b: v?.score_b ?? null,
      combined_score: v?.combined_score ?? null,
      dealbreaker_failed: v?.dealbreaker_failed ?? false,
      effective_score: v?.effective_score ?? null,
      coverage_a: Array.from(byCriterion.values()).filter((e) => e.a != null)
        .length,
      coverage_b: Array.from(byCriterion.values()).filter((e) => e.b != null)
        .length,
      disagreements,
    };
  });

  const ranked = [...enriched].sort((x, y) => {
    const ax = x.effective_score ?? -Infinity;
    const bx = y.effective_score ?? -Infinity;
    return bx - ax;
  });

  const scoredApts = ranked.filter((a) => a.effective_score != null);
  const topScore = scoredApts.length > 0 ? scoredApts[0].effective_score : null;
  const dealbreakerCount = ranked.filter((a) => a.dealbreaker_failed).length;
  const unscoredCount = ranked.filter((a) => a.effective_score == null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ranking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Apartments ranked by combined weighted score. Dealbreakers drop
            to 0.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/apartments/new">+ Add apartment</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Apartments" value={ranked.length.toString()} />
        <Stat label="Top score" value={formatPct(topScore)} />
        <Stat
          label="Dealbreakers"
          value={dealbreakerCount.toString()}
          tone={dealbreakerCount > 0 ? "warning" : "default"}
        />
        <Stat
          label="Unscored"
          value={unscoredCount.toString()}
          tone={unscoredCount > 0 ? "muted" : "default"}
        />
      </div>

      <div className="space-y-2">
        {ranked.map((a, i) => (
          <RankedRow
            key={a.id}
            rank={i + 1}
            apartment={a}
            totalCriteria={criteria.length}
            userSlot={profile.user_slot}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">{body}</p>
      <Button asChild>
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "muted";
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "text-xl font-semibold tabular-nums mt-0.5",
          tone === "warning" && "text-destructive",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  dimmed,
}: {
  value: number | null | undefined;
  dimmed?: boolean;
}) {
  const pct = value != null ? Math.max(0, Math.min(1, value)) * 100 : 0;
  return (
    <div className="h-2 rounded bg-muted overflow-hidden">
      <div
        className={cn(
          "h-full transition-all",
          dimmed ? "bg-muted-foreground/40" : "bg-foreground"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SubBar({
  label,
  value,
  coverage,
  totalCriteria,
  highlight,
}: {
  label: string;
  value: number | null | undefined;
  coverage: number;
  totalCriteria: number;
  highlight: boolean;
}) {
  const pct = value != null ? Math.max(0, Math.min(1, value)) * 100 : 0;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            highlight ? "font-medium" : "text-muted-foreground"
          )}
        >
          Partner {label}
          {highlight && " (you)"}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {formatPct(value)} · {coverage}/{totalCriteria}
        </span>
      </div>
      <div className="h-1.5 rounded bg-muted overflow-hidden">
        <div
          className="h-full bg-muted-foreground/60"
          style={{ width: value != null ? `${pct}%` : "0%" }}
        />
      </div>
    </div>
  );
}

function RankedRow({
  rank,
  apartment: a,
  totalCriteria,
  userSlot,
}: {
  rank: number;
  apartment: Apartment &
    Partial<ApartmentScore> & {
      coverage_a: number;
      coverage_b: number;
      disagreements: number;
    };
  totalCriteria: number;
  userSlot: "a" | "b" | null;
}) {
  const isUnscored = a.effective_score == null;

  return (
    <Link
      href={`/apartments/${a.id}`}
      className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start gap-4">
        <div className="text-2xl font-bold tabular-nums text-muted-foreground w-8 shrink-0 text-center pt-0.5">
          {rank}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-medium truncate">{a.name}</span>
              {a.dealbreaker_failed && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                  Dealbreaker
                </span>
              )}
              {isUnscored && !a.dealbreaker_failed && (
                <span className="text-xs font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  Unscored
                </span>
              )}
            </div>
            <div
              className={cn(
                "text-2xl font-semibold tabular-nums",
                a.dealbreaker_failed && "text-muted-foreground line-through",
                isUnscored && "text-muted-foreground"
              )}
            >
              {formatPct(a.effective_score)}
            </div>
          </div>

          <ProgressBar
            value={a.effective_score}
            dimmed={a.dealbreaker_failed || isUnscored}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SubBar
              label="A"
              value={a.score_a}
              coverage={a.coverage_a}
              totalCriteria={totalCriteria}
              highlight={userSlot === "a"}
            />
            <SubBar
              label="B"
              value={a.score_b}
              coverage={a.coverage_b}
              totalCriteria={totalCriteria}
              highlight={userSlot === "b"}
            />
          </div>

          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
            {a.address && <span className="truncate">{a.address}</span>}
            {a.rent != null && <span>{formatRent(a.rent)}/mo</span>}
            {a.sqft != null && <span>{a.sqft} sqft</span>}
            {a.disagreements > 0 && (
              <span className="ml-auto text-amber-600 dark:text-amber-500">
                ⚠ {a.disagreements}{" "}
                {a.disagreements === 1 ? "disagreement" : "disagreements"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
