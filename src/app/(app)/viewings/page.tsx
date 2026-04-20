import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Apartment, UserProfile } from "@/types/database";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function relativeTime(iso: string, now: Date) {
  const target = new Date(iso).getTime();
  const diffMs = target - now.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diffMin);
  if (abs < 60) return rtf.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, "day");
  const diffMonth = Math.round(diffDay / 30);
  return rtf.format(diffMonth, "month");
}

export default async function ViewingsPage() {
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
    .not("viewing_at", "is", null);

  const apartments = (apartmentsData ?? []) as Apartment[];
  const now = new Date();

  const upcoming = apartments
    .filter((a) => a.viewing_at && new Date(a.viewing_at) >= now)
    .sort(
      (x, y) =>
        new Date(x.viewing_at as string).getTime() -
        new Date(y.viewing_at as string).getTime()
    );

  const past = apartments
    .filter((a) => a.viewing_at && new Date(a.viewing_at) < now)
    .sort(
      (x, y) =>
        new Date(y.viewing_at as string).getTime() -
        new Date(x.viewing_at as string).getTime()
    );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Viewings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Scheduled apartment tours. Edit the date on each apartment to
            reschedule.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/apartments/new">+ Add apartment</Link>
        </Button>
      </div>

      {apartments.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No viewings scheduled yet. Add a viewing date to any apartment to
          see it here.
        </div>
      ) : (
        <>
          <Section
            title="Upcoming"
            count={upcoming.length}
            emptyHint="Nothing scheduled ahead."
          >
            {upcoming.map((a) => (
              <ViewingRow
                key={a.id}
                apartment={a}
                relative={relativeTime(a.viewing_at as string, now)}
                when={formatDateTime(a.viewing_at as string)}
              />
            ))}
          </Section>
          <Section
            title="Past"
            count={past.length}
            emptyHint="No past viewings."
            muted
          >
            {past.map((a) => (
              <ViewingRow
                key={a.id}
                apartment={a}
                relative={relativeTime(a.viewing_at as string, now)}
                when={formatDateTime(a.viewing_at as string)}
                muted
              />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  emptyHint,
  muted,
  children,
}: {
  title: string;
  count: number;
  emptyHint: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2
        className={cn(
          "text-sm font-medium",
          muted ? "text-muted-foreground" : ""
        )}
      >
        {title} {count > 0 && <span className="tabular-nums">({count})</span>}
      </h2>
      {count === 0 ? (
        <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
          {emptyHint}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

function ViewingRow({
  apartment: a,
  relative,
  when,
  muted,
}: {
  apartment: Apartment;
  relative: string;
  when: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={`/apartments/${a.id}`}
      className={cn(
        "block rounded-lg border p-3 transition-colors hover:bg-muted/40",
        muted && "opacity-70"
      )}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-medium truncate">{a.name}</div>
          {a.address && (
            <div className="text-xs text-muted-foreground truncate">
              {a.address}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm tabular-nums">{when}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {relative}
          </div>
        </div>
      </div>
    </Link>
  );
}
