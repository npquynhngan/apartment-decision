"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Apartment } from "@/types/database";
import {
  addApartment,
  scrapeListing,
  updateApartment,
  type ApartmentState,
} from "./actions";

function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Render in Singapore time so the input shows what was saved, regardless of
  // the browser's local timezone.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
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

  const [name, setName] = useState(apartment?.name ?? "");
  const [address, setAddress] = useState(apartment?.address ?? "");
  const [rent, setRent] = useState<string>(
    apartment?.rent != null ? String(apartment.rent) : ""
  );
  const [sqft, setSqft] = useState<string>(
    apartment?.sqft != null ? String(apartment.sqft) : ""
  );
  const [bedrooms, setBedrooms] = useState<string>(
    apartment?.bedrooms != null ? String(apartment.bedrooms) : ""
  );
  const [bathrooms, setBathrooms] = useState<string>(
    apartment?.bathrooms != null ? String(apartment.bathrooms) : ""
  );
  const [url, setUrl] = useState(apartment?.url ?? "");

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchHint, setFetchHint] = useState<string | null>(null);
  const [fetching, startFetch] = useTransition();

  function handleFetch() {
    setFetchError(null);
    setFetchHint(null);
    startFetch(async () => {
      const res = await scrapeListing(url);
      if (res.error || !res.data) {
        setFetchError(res.error ?? "Could not read that listing");
        return;
      }
      const filled: string[] = [];
      if (res.data.name && !name) {
        setName(res.data.name);
        filled.push("name");
      }
      if (res.data.address && !address) {
        setAddress(res.data.address);
        filled.push("address");
      }
      if (res.data.rent != null && !rent) {
        setRent(String(Math.round(res.data.rent)));
        filled.push("rent");
      }
      if (res.data.sqft != null && !sqft) {
        setSqft(String(Math.round(res.data.sqft)));
        filled.push("sqft");
      }
      setFetchHint(
        filled.length > 0
          ? `Filled ${filled.join(", ")}. Review before saving.`
          : "Nothing new found on that page."
      );
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      {apartment && <input type="hidden" name="id" value={apartment.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="apt-name">Name *</Label>
        <Input
          id="apt-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Tiong Bahru 2BR"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apt-address">Address</Label>
        <Input
          id="apt-address"
          name="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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
            value={rent}
            onChange={(e) => setRent(e.target.value)}
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
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="apt-bedrooms">Bedrooms</Label>
          <Input
            id="apt-bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            max={20}
            step="1"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apt-bathrooms">Bathrooms</Label>
          <Input
            id="apt-bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            max={20}
            step="1"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apt-url">Listing URL</Label>
        <div className="flex gap-2">
          <Input
            id="apt-url"
            name="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleFetch}
            disabled={fetching || !url}
          >
            {fetching ? "Fetching…" : "Fetch"}
          </Button>
        </div>
        {fetchError && (
          <p className="text-xs text-destructive">{fetchError}</p>
        )}
        {fetchHint && !fetchError && (
          <p className="text-xs text-muted-foreground">{fetchHint}</p>
        )}
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
