import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: apartments } = await supabase
    .from("apartments")
    .select("id")
    .limit(1);

  const { data: criteria } = await supabase
    .from("criteria")
    .select("id")
    .limit(1);

  if (!criteria?.length) {
    return (
      <div className="space-y-4 max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Apartment Decision
        </h1>
        <p className="text-muted-foreground">
          Start by defining what matters to you — set up your scoring criteria
          and both partners will weight each one independently.
        </p>
        <Button asChild>
          <Link href="/criteria">Set up criteria →</Link>
        </Button>
      </div>
    );
  }

  if (!apartments?.length) {
    return (
      <div className="space-y-4 max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Criteria are ready. Add your first apartment to start scoring.
          Apartment management lands in step 5.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Ranking dashboard coming in step 6.
      </p>
    </div>
  );
}
