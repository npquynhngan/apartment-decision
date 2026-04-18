import { createClient } from "@/lib/supabase/server";

export default async function DashboardPlaceholder() {
  const supabase = await createClient();

  const { data: apartments } = await supabase
    .from("apartments")
    .select("id")
    .limit(1);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        {apartments?.length
          ? "Ranking dashboard coming in step 6."
          : "No apartments yet — add one to get started. Apartment management lands in step 5."}
      </p>
      <p className="text-xs text-muted-foreground">
        Steps remaining: Criteria CRUD (4) · Apartments + scoring (5) ·
        Ranking dashboard (6) · Map (7) · Viewings (8) · Reminders (9) ·
        Scraper (10) · Commute auto-score (11) · LLM analysis (12).
      </p>
    </div>
  );
}
