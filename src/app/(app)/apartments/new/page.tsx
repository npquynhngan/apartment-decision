import type { Metadata } from "next";
import Link from "next/link";
import { ApartmentForm } from "../_form";

export const metadata: Metadata = {
  title: "Add apartment — Apartment Decision",
};

export default function NewApartmentPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/apartments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← All apartments
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">
          Add apartment
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Name is the only required field. You can fill in the rest later.
        </p>
      </div>
      <ApartmentForm mode="create" />
    </div>
  );
}
