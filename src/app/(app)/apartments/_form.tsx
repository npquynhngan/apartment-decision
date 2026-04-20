"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Apartment } from "@/types/database";
import {
  addApartment,
  updateApartment,
  type ApartmentState,
} from "./actions";

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function ApartmentForm({
  mode,
  apartment,
  onDone,
}: {
  mode: "create" | "edit";
  apartment?: Apartment;
  onDone?: () => void;
}) {
  const action = mode === "create" ? addApartment : updateApartment;
  const [state, formAction, isPending] = useActionState<
    ApartmentState,
    FormData
  >(action, {});

  // In edit mode, successful update returns {} → parent can close the form
  if (mode === "edit" && state && !state.error && isPending === false) {
    // Note: we rely on the parent to re-render with fresh data.
  }

  return (
    <form action={formAction} className="space-y-4">
      {apartment && <input type="hidden" name="id" value={apartment.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="apt-name">Name *</Label>
        <Input
          id="apt-name"
          name="name"
          defaultValue={apartment?.name ?? ""}
          placeholder="e.g. Mitte 3BR"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apt-address">Address</Label>
        <Input
          id="apt-address"
          name="address"
          defaultValue={apartment?.address ?? ""}
          placeholder="Street, city"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="apt-rent">Monthly rent (S$)</Label>
          <Input
            id="apt-rent"
            name="rent"
            type="number"
            min={0}
            step="1"
            defaultValue={apartment?.rent ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apt-sqft">Size (sqft)</Label>
          <Input
            id="apt-sqft"
            name="sqft"
            type="number"
            min={0}
            step="1"
            defaultValue={apartment?.sqft ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apt-url">Listing URL</Label>
        <Input
          id="apt-url"
          name="url"
          type="url"
          defaultValue={apartment?.url ?? ""}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apt-viewing">Viewing date</Label>
        <Input
          id="apt-viewing"
          name="viewing_at"
          type="datetime-local"
          defaultValue={toLocalInput(apartment?.viewing_at)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apt-notes">Notes</Label>
        <textarea
          id="apt-notes"
          name="notes"
          rows={3}
          defaultValue={apartment?.notes ?? ""}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving…"
            : mode === "create"
            ? "Add apartment"
            : "Save changes"}
        </Button>
        {onDone && mode === "edit" && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
