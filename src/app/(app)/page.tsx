import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CastleSilhouette } from "@/components/castle-silhouette";
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

function formatNextViewing(iso: string) {
  const d = new Date(iso);
  const diffMin = Math.round((d.getTime() - Date.now()) / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  let relative: string;
  if (Math.abs(diffMin) < 60) relative = rtf.format(diffMin, "minute");
  else if (Math.abs(diffMin) < 60 * 24)
    relative = rtf.format(Math.round(diffMin / 60), "hour");
  else relative = rtf.format(Math.round(diffMin / (60 * 24)), "day");
  const when = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${relative} (${when})`;
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
        ctaLabel="Set up criteria"
      />
    );
  }

  if (apartments.length === 0) {
    return (
      <EmptyState
        title="The search begins..."
        body="Criteria are ready. Add apartments to start scoring and ranking them."
        ctaHref="/apartments/new"
        ctaLabel="Add an apartment"
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

  const now = Date.now();
  const nextViewing = apartments
    .filter((a) => a.viewing_at && new Date(a.viewing_at).getTime() >= now)
    .sort(
      (x, y) =>
        new Date(x.viewing_at as string).getTime() -
        new Date(y.viewing_at as string).getTime()
    )[0];

  return (
    <div className="space-y-6 animate-fade-up relative">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-ink-plum tracking-tight">
            Ranking
          </h1>
          <p className="text-sm text-dusk-indigo/75 mt-1">
            Apartments ranked by combined weighted score. Dealbreakers drop to
            zero.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/apartments/new">+ Add apartment</Link>
        </Button>
      </div>

      {nextViewing && (
        <Link
          href={`/apartments/${nextViewing.id}`}
          className="block rounded-2xl px-4 py-3 text-sm shadow-warm transition-all duration-200 hover:shadow-warm-md"
          style={{ background: "rgba(82,196,176,0.12)", border: "1px solid rgba(82,196,176,0.25)" }}
        >
          <span className="text-dusk-indigo/70">Next viewing: </span>
          <span className="font-medium text-ink-plum">{nextViewing.name}</span>
          <span className="text-dusk-indigo/70">
            {" "}
            · {formatNextViewing(nextViewing.viewing_at as string)}
          </span>
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Apartments" value={ranked.length.toString()} />
        <Stat label="Top score"  value={formatPct(topScore)} tone="gold" />
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
            isTop={i === 0 && a.effective_score != null && !a.dealbreaker_failed}
            style={{ "--i": i } as React.CSSProperties}
            className="stagger-item"
          />
        ))}
      </div>

      {/* Atmospheric castle silhouette */}
      <div className="relative h-0">
        <div className="absolute bottom-0 right-0 translate-y-8">
          <CastleSilhouette />
        </div>
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
    <div className="space-y-5 max-w-md animate-fade-up pt-8">
      <h1 className="text-3xl font-heading font-bold text-ink-plum tracking-tight">
        {title}
      </h1>
      <p className="font-accent italic text-dusk-indigo text-lg leading-relaxed">
        {body}
      </p>
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
  tone?: "default" | "warning" | "muted" | "gold";
}) {
  return (
    <div className="rounded-2xl bg-oatmeal shadow-warm p-4">
      <div className="text-xs text-dusk-indigo/65 font-medium uppercase tracking-wider">
        {label}
      </div>
      <div
        className={cn(
          "text-2xl font-heading font-bold tabular-nums mt-1",
          tone === "warning" && "text-destructive",
          tone === "muted"   && "text-dusk-indigo/50",
          tone === "gold"    && "text-ink-plum",
          tone === "default" && "text-ink-plum"
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
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(155,143,181,0.18)" }}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          dimmed
            ? "bg-dusk-indigo/30"
            : "bg-sophie-rose"
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
        <span className={cn(highlight ? "font-medium text-ink-plum" : "text-dusk-indigo/65")}>
          Partner {label}
          {highlight && " (you)"}
        </span>
        <span className="tabular-nums text-dusk-indigo/55">
          {formatPct(value)} · {coverage}/{totalCriteria}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(155,143,181,0.18)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: value != null ? `${pct}%` : "0%",
            background: "rgba(82,196,176,0.55)",
          }}
        />
      </div>
    </div>
  );
}

function CalciferFlame() {
  return (
    <svg
      className="animate-calcifer inline-block"
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 1C8 1 5 5 5 8C5 8 3 7 4 5C2 7 2 10 4 12C4 12 3 13 2 13C2 15.5 5 17 8 17C11 17 14 15.5 14 13C13 13 12 12 12 12C14 10 14 7 12 5C13 7 11 8 11 8C11 5 8 1 8 1Z"
        fill="var(--calcifer-gold)"
        stroke="var(--sophie-rose)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function RankedRow({
  rank,
  apartment: a,
  totalCriteria,
  userSlot,
  isTop,
  style,
  className,
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
  isTop: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const isUnscored = a.effective_score == null;

  return (
    <Link
      href={`/apartments/${a.id}`}
      style={style}
      className={cn(
        "block rounded-2xl p-4 transition-all duration-200",
        isTop
          ? "shadow-warm-md hover:shadow-warm-lg"
          : "shadow-warm hover:shadow-warm-md",
        a.dealbreaker_failed
          ? "dealbreaker-dimmed bg-oatmeal/80"
          : "bg-oatmeal hover:bg-oatmeal-deep/60",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "text-2xl font-heading font-bold tabular-nums w-8 shrink-0 text-center pt-0.5",
            isTop ? "text-sophie-rose" : "text-dusk-indigo/45"
          )}
        >
          {rank}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-medium text-ink-plum truncate">{a.name}</span>
              {isTop && <CalciferFlame />}
              {isTop && (
                <span className="text-xs font-heading italic text-sophie-rose">
                  A contender
                </span>
              )}
              {a.dealbreaker_failed && (
                <span className="text-xs font-medium text-destructive bg-destructive/10 rounded-lg px-2 py-0.5">
                  Dealbreaker
                </span>
              )}
              {isUnscored && !a.dealbreaker_failed && (
                <span className="text-xs font-medium text-dusk-indigo/60 bg-oatmeal-deep/70 rounded-lg px-2 py-0.5">
                  Unscored
                </span>
              )}
            </div>
            <div
              className={cn(
                "text-2xl font-heading font-bold tabular-nums",
                a.dealbreaker_failed && "text-dusk-indigo/40 line-through",
                isUnscored && !a.dealbreaker_failed && "text-dusk-indigo/40",
                !isUnscored && !a.dealbreaker_failed && "text-ink-plum"
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

          <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-dusk-indigo/60">
            {a.address && <span className="truncate">{a.address}</span>}
            {a.rent != null && <span>{formatRent(a.rent)}/mo</span>}
            {a.sqft != null && <span>{a.sqft} sqft</span>}
            {a.disagreements > 0 && (
              <span className="ml-auto" style={{ color: "var(--sophie-rose)" }}>
                {a.disagreements}{" "}
                {a.disagreements === 1 ? "disagreement" : "disagreements"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
