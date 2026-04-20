import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Apartment, Reminder, UserProfile } from "@/types/database";
import { AddReminderForm } from "./_add-form";
import { ReminderList } from "./_reminder-list";

export default async function RemindersPage() {
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

  const [remindersRes, apartmentsRes] = await Promise.all([
    supabase
      .from("reminders")
      .select("*")
      .eq("household_id", profile.household_id),
    supabase
      .from("apartments")
      .select("id, name")
      .eq("household_id", profile.household_id),
  ]);

  const reminders = (remindersRes.data ?? []) as Reminder[];
  const apartments = (apartmentsRes.data ?? []) as Pick<
    Apartment,
    "id" | "name"
  >[];
  const apartmentNameById = new Map(apartments.map((a) => [a.id, a.name]));

  const enriched = reminders.map((r) => ({
    id: r.id,
    text: r.text,
    due_at: r.due_at,
    done: r.done,
    apartment_id: r.apartment_id,
    apartment_name: r.apartment_id
      ? apartmentNameById.get(r.apartment_id) ?? null
      : null,
  }));

  const now = Date.now();
  const overdue = enriched
    .filter((r) => !r.done && new Date(r.due_at).getTime() < now)
    .sort(
      (x, y) => new Date(x.due_at).getTime() - new Date(y.due_at).getTime()
    );
  const upcoming = enriched
    .filter((r) => !r.done && new Date(r.due_at).getTime() >= now)
    .sort(
      (x, y) => new Date(x.due_at).getTime() - new Date(y.due_at).getTime()
    );
  const done = enriched
    .filter((r) => r.done)
    .sort(
      (x, y) => new Date(y.due_at).getTime() - new Date(x.due_at).getTime()
    )
    .slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reminders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Follow-ups and questions to chase down. Link to an apartment to
          keep things tidy.
        </p>
      </div>

      <AddReminderForm apartments={apartments} />

      <Section title="Overdue" count={overdue.length} tone="warning">
        <ReminderList
          reminders={overdue}
          emptyHint="Nothing overdue. Nice."
        />
      </Section>
      <Section title="Upcoming" count={upcoming.length}>
        <ReminderList
          reminders={upcoming}
          emptyHint="No upcoming reminders."
        />
      </Section>
      <Section title="Done" count={done.length} muted>
        <ReminderList reminders={done} emptyHint="No completed reminders." />
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  tone = "default",
  muted,
  children,
}: {
  title: string;
  count: number;
  tone?: "default" | "warning";
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2
        className={`text-sm font-medium ${
          muted ? "text-muted-foreground" : ""
        } ${tone === "warning" && count > 0 ? "text-destructive" : ""}`}
      >
        {title}{" "}
        {count > 0 && <span className="tabular-nums">({count})</span>}
      </h2>
      {children}
    </section>
  );
}
